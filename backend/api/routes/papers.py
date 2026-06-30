from fastapi import APIRouter, HTTPException

from backend.api import store

router = APIRouter()


@router.get("/papers")
def list_papers():
    result = []
    for p in store.papers.values():
        result.append({
            "paper_id": p.paper_id,
            "title": p.title,
            "authors": [a.name for a in p.authors],
            "abstract": p.abstract,
            "published": p.published.isoformat() if p.published else None,
            "url": p.url,
            "source": p.source,
            "sections": list(p.sections.keys()) if p.sections else [],
            "keywords": p.keywords[:8],
            "citation_count": p.citation_count,
            "venue": p.venue,
        })
    return {"papers": result, "total": len(result)}


@router.get("/papers/{paper_id}")
def get_paper(paper_id: str):
    paper = store.papers.get(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    return {
        "paper_id": paper.paper_id,
        "title": paper.title,
        "authors": [a.name for a in paper.authors],
        "abstract": paper.abstract,
        "published": paper.published.isoformat() if paper.published else None,
        "url": paper.url,
        "pdf_url": paper.pdf_url,
        "source": paper.source,
        "full_text": paper.full_text,
        "sections": paper.sections,
        "keywords": paper.keywords,
        "citation_count": paper.citation_count,
        "venue": paper.venue,
        "doi": paper.doi,
    }
