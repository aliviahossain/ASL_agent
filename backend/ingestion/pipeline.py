from backend.core.logger import get_logger
from backend.core.models import Paper
from backend.ingestion import arxiv_fetcher, semantic_scholar_fetcher
from backend.ingestion.pdf_extractor import enrich_paper_with_pdf

logger = get_logger(__name__)


def _deduplicate(papers: list[Paper]) -> list[Paper]:
    """Remove duplicate papers by DOI, then by normalised title."""
    seen_doi: set[str] = set()
    seen_title: set[str] = set()
    unique: list[Paper] = []
    for p in papers:
        title_key = " ".join(p.title.lower().split())
        if p.doi and p.doi in seen_doi:
            continue
        if title_key in seen_title:
            continue
        if p.doi:
            seen_doi.add(p.doi)
        seen_title.add(title_key)
        unique.append(p)
    return unique


def run_ingestion_pipeline(
    query: str,
    max_per_source: int = 10,
    download_pdfs: bool = True,
    extract_text: bool = True,
    sources: list[str] | None = None,
) -> list[Paper]:
    """
    Full ingestion pipeline:
      1. Search ArXiv and/or Semantic Scholar
      2. Optionally download PDFs
      3. Optionally extract full text + sections
      4. Deduplicate
    Returns list of enriched Paper objects.
    """
    sources = sources or ["arxiv", "semantic_scholar"]
    all_papers: list[Paper] = []

    if "arxiv" in sources:
        try:
            arxiv_papers = arxiv_fetcher.fetch_papers(
                query, max_results=max_per_source, download=download_pdfs
            )
            all_papers.extend(arxiv_papers)
        except Exception as e:
            logger.error(f"ArXiv fetch failed: {e}")

    if "semantic_scholar" in sources:
        try:
            ss_papers = semantic_scholar_fetcher.fetch_papers(
                query, max_results=max_per_source, download=download_pdfs
            )
            all_papers.extend(ss_papers)
        except Exception as e:
            logger.error(f"Semantic Scholar fetch failed: {e}")

    all_papers = _deduplicate(all_papers)
    logger.info(f"After deduplication: {len(all_papers)} unique papers")

    if extract_text:
        for i, paper in enumerate(all_papers):
            if paper.local_pdf_path:
                all_papers[i] = enrich_paper_with_pdf(paper)

    return all_papers
