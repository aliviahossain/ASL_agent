import time
import json
import hashlib
from pathlib import Path
from datetime import datetime

import requests

from backend.core.config import settings
from backend.core.logger import get_logger
from backend.core.models import Author, Paper

logger = get_logger(__name__)

_BASE_URL = "https://api.semanticscholar.org/graph/v1"
_FIELDS = (
    "paperId,title,authors,abstract,year,externalIds,"
    "openAccessPdf,referenceCount,citationCount,venue,publicationDate"
)


def _headers() -> dict:
    h = {"Accept": "application/json"}
    if settings.semantic_scholar_api_key:
        h["x-api-key"] = settings.semantic_scholar_api_key
    return h


def _to_paper(data: dict) -> Paper | None:
    if not data.get("abstract"):
        return None
    authors = [Author(name=a.get("name", "")) for a in data.get("authors", [])]
    pdf_url = ""
    if data.get("openAccessPdf"):
        pdf_url = data["openAccessPdf"].get("url", "")
    pub_date = None
    if data.get("publicationDate"):
        try:
            pub_date = datetime.strptime(data["publicationDate"], "%Y-%m-%d")
        except ValueError:
            pass
    doi = (data.get("externalIds") or {}).get("DOI")
    return Paper(
        paper_id=data["paperId"],
        title=data.get("title", "").strip(),
        authors=authors,
        abstract=data.get("abstract", "").strip(),
        published=pub_date,
        url=f"https://www.semanticscholar.org/paper/{data['paperId']}",
        pdf_url=pdf_url,
        source="semantic_scholar",
        doi=doi,
        citation_count=data.get("citationCount"),
        venue=data.get("venue"),
    )


def search_semantic_scholar(query: str, max_results: int | None = None) -> list[Paper]:
    """Search Semantic Scholar and return Paper objects."""
    max_results = max_results or settings.semantic_scholar_max_results
    logger.info(f"Searching Semantic Scholar: '{query}' (max={max_results})")

    papers: list[Paper] = []
    offset = 0
    limit = min(100, max_results)

    while len(papers) < max_results:
        params = {
            "query": query,
            "fields": _FIELDS,
            "limit": limit,
            "offset": offset,
        }
        resp = requests.get(
            f"{_BASE_URL}/paper/search",
            params=params,
            headers=_headers(),
            timeout=30,
        )
        if resp.status_code == 429:
            logger.warning("Rate limited by Semantic Scholar — sleeping 10s")
            time.sleep(10)
            continue
        resp.raise_for_status()

        batch = resp.json().get("data", [])
        if not batch:
            break

        for item in batch:
            paper = _to_paper(item)
            if paper:
                papers.append(paper)
            if len(papers) >= max_results:
                break

        offset += len(batch)
        time.sleep(1)

    logger.info(f"Semantic Scholar returned {len(papers)} results")
    return papers


def download_open_access_pdf(paper: Paper, overwrite: bool = False) -> Paper:
    """Download an open-access PDF from Semantic Scholar if available."""
    if not paper.pdf_url:
        logger.debug(f"No open-access PDF for {paper.paper_id}")
        return paper

    safe_id = paper.paper_id.replace("/", "_")[:80]
    dest = settings.pdf_dir / f"ss_{safe_id}.pdf"

    if dest.exists() and not overwrite:
        logger.info(f"PDF already cached: {dest}")
        paper.local_pdf_path = str(dest)
        return paper

    logger.info(f"Downloading PDF for {paper.paper_id}")
    try:
        resp = requests.get(paper.pdf_url, timeout=60, stream=True)
        resp.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)
        paper.local_pdf_path = str(dest)
    except Exception as e:
        logger.warning(f"Failed to download PDF {paper.pdf_url}: {e}")

    return paper


def fetch_papers(query: str, max_results: int | None = None, download: bool = True) -> list[Paper]:
    """Search Semantic Scholar and optionally download open-access PDFs."""
    papers = search_semantic_scholar(query, max_results)
    if download:
        for i, paper in enumerate(papers):
            papers[i] = download_open_access_pdf(paper)
    return papers
