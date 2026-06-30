import json
import asyncio
from typing import AsyncGenerator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.core.logger import get_logger
from backend.core.models import Paper
from backend.ingestion import arxiv_fetcher, semantic_scholar_fetcher
from backend.ingestion.pdf_extractor import enrich_paper_with_pdf

logger = get_logger(__name__)
router = APIRouter()

# In-memory store shared with papers route
from backend.api import store


class SearchRequest(BaseModel):
    query: str
    max_per_source: int = 5
    sources: list[str] = ["arxiv", "semantic_scholar"]
    download_pdfs: bool = False
    extract_text: bool = False


def _paper_to_dict(p: Paper) -> dict:
    return {
        "paper_id": p.paper_id,
        "title": p.title,
        "authors": [a.name for a in p.authors],
        "abstract": p.abstract,
        "published": p.published.isoformat() if p.published else None,
        "url": p.url,
        "pdf_url": p.pdf_url,
        "source": p.source,
        "local_pdf_path": p.local_pdf_path,
        "sections": list(p.sections.keys()) if p.sections else [],
        "keywords": p.keywords[:8],
        "citation_count": p.citation_count,
        "venue": p.venue,
    }


def _event(kind: str, payload: dict) -> str:
    return f"data: {json.dumps({'type': kind, **payload})}\n\n"


async def _run_search(req: SearchRequest) -> AsyncGenerator[str, None]:
    yield _event("status", {"message": f"Starting search for '{req.query}'..."})
    await asyncio.sleep(0)

    all_papers: list[Paper] = []

    if "arxiv" in req.sources:
        yield _event("status", {"message": "Searching ArXiv..."})
        await asyncio.sleep(0)
        try:
            loop = asyncio.get_event_loop()
            papers = await loop.run_in_executor(
                None,
                lambda: arxiv_fetcher.search_arxiv(req.query, req.max_per_source),
            )
            all_papers.extend(papers)
            yield _event("status", {"message": f"ArXiv: found {len(papers)} papers"})
            for p in papers:
                yield _event("paper", _paper_to_dict(p))
                await asyncio.sleep(0)
        except Exception as e:
            yield _event("error", {"message": f"ArXiv error: {e}"})

    if "semantic_scholar" in req.sources:
        yield _event("status", {"message": "Searching Semantic Scholar..."})
        await asyncio.sleep(0)
        try:
            loop = asyncio.get_event_loop()
            papers = await loop.run_in_executor(
                None,
                lambda: semantic_scholar_fetcher.search_semantic_scholar(
                    req.query, req.max_per_source
                ),
            )
            # dedupe against arxiv results by title
            existing_titles = {" ".join(p.title.lower().split()) for p in all_papers}
            new_papers = [
                p for p in papers
                if " ".join(p.title.lower().split()) not in existing_titles
            ]
            all_papers.extend(new_papers)
            yield _event("status", {"message": f"Semantic Scholar: found {len(new_papers)} new papers"})
            for p in new_papers:
                yield _event("paper", _paper_to_dict(p))
                await asyncio.sleep(0)
        except Exception as e:
            yield _event("error", {"message": f"Semantic Scholar error: {e}"})

    if req.download_pdfs:
        yield _event("status", {"message": "Downloading PDFs..."})
        await asyncio.sleep(0)
        for i, paper in enumerate(all_papers):
            if not paper.pdf_url:
                continue
            try:
                loop = asyncio.get_event_loop()
                if paper.source == "arxiv":
                    all_papers[i] = await loop.run_in_executor(
                        None, lambda p=paper: arxiv_fetcher.download_pdf(p)
                    )
                else:
                    all_papers[i] = await loop.run_in_executor(
                        None,
                        lambda p=paper: semantic_scholar_fetcher.download_open_access_pdf(p),
                    )
                yield _event("status", {"message": f"Downloaded: {paper.title[:50]}..."})
                if req.extract_text and all_papers[i].local_pdf_path:
                    all_papers[i] = await loop.run_in_executor(
                        None, lambda p=all_papers[i]: enrich_paper_with_pdf(p)
                    )
                    yield _event("paper_updated", _paper_to_dict(all_papers[i]))
                await asyncio.sleep(0)
            except Exception as e:
                yield _event("error", {"message": f"PDF error for {paper.paper_id}: {e}"})

    # Persist to in-memory store
    store.papers.update({p.paper_id: p for p in all_papers})

    yield _event("done", {"total": len(all_papers), "message": f"Done — {len(all_papers)} papers ingested"})


@router.post("/search")
async def search_papers(req: SearchRequest):
    return StreamingResponse(
        _run_search(req),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
