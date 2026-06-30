import arxiv
import time
from pathlib import Path
from datetime import datetime

from backend.core.config import settings
from backend.core.logger import get_logger
from backend.core.models import Author, Paper

logger = get_logger(__name__)

_SORT_MAP = {
    "relevance": arxiv.SortCriterion.Relevance,
    "lastUpdatedDate": arxiv.SortCriterion.LastUpdatedDate,
    "submittedDate": arxiv.SortCriterion.SubmittedDate,
}


def search_arxiv(query: str, max_results: int | None = None) -> list[Paper]:
    """Search ArXiv and return Paper objects (no PDFs downloaded yet)."""
    max_results = max_results or settings.arxiv_max_results
    sort = _SORT_MAP.get(settings.arxiv_sort_by, arxiv.SortCriterion.Relevance)

    logger.info(f"Searching ArXiv: '{query}' (max={max_results})")
    client = arxiv.Client(page_size=50, delay_seconds=3, num_retries=3)
    search = arxiv.Search(query=query, max_results=max_results, sort_by=sort)

    papers: list[Paper] = []
    for result in client.results(search):
        paper = Paper(
            paper_id=result.entry_id.split("/abs/")[-1],
            title=result.title.strip(),
            authors=[Author(name=a.name) for a in result.authors],
            abstract=result.summary.strip(),
            published=result.published,
            url=result.entry_id,
            pdf_url=result.pdf_url or "",
            source="arxiv",
            doi=result.doi,
            keywords=result.categories,
            venue=result.journal_ref,
        )
        papers.append(paper)
        logger.debug(f"  Found: {paper.paper_id} — {paper.title[:60]}")

    logger.info(f"ArXiv returned {len(papers)} results")
    return papers


def download_pdf(paper: Paper, overwrite: bool = False) -> Paper:
    """Download the PDF for a paper to settings.pdf_dir; updates paper.local_pdf_path."""
    if not paper.pdf_url:
        logger.warning(f"No PDF URL for {paper.paper_id}")
        return paper

    safe_id = paper.paper_id.replace("/", "_").replace(".", "_")
    dest = settings.pdf_dir / f"{safe_id}.pdf"

    if dest.exists() and not overwrite:
        logger.info(f"PDF already cached: {dest}")
        paper.local_pdf_path = str(dest)
        return paper

    client = arxiv.Client(delay_seconds=3, num_retries=3)
    search = arxiv.Search(id_list=[paper.paper_id.split("v")[0]])

    for result in client.results(search):
        logger.info(f"Downloading PDF for {paper.paper_id}")
        result.download_pdf(dirpath=str(settings.pdf_dir), filename=dest.name)
        paper.local_pdf_path = str(dest)
        time.sleep(1)
        break

    return paper


def fetch_papers(query: str, max_results: int | None = None, download: bool = True) -> list[Paper]:
    """Search ArXiv and optionally download all PDFs."""
    papers = search_arxiv(query, max_results)
    if download:
        for i, paper in enumerate(papers):
            papers[i] = download_pdf(paper)
    return papers
