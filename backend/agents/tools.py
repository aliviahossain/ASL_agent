"""
LangGraph tool definitions for the ReAct agent.
Tools write their results into a module-level cache so the agent
can accumulate papers/summaries across multiple tool calls.
"""
import json
from langchain_core.tools import tool

from backend.core.logger import get_logger
from backend.ingestion import arxiv_fetcher, semantic_scholar_fetcher
from backend.agents.llm import call_llm
from backend.agents import prompts as P

logger = get_logger(__name__)

# Module-level accumulator shared across tool calls in one agent run
_cache: dict = {"papers": {}, "summaries": {}, "contradictions": []}


def reset_cache():
    _cache["papers"] = {}
    _cache["summaries"] = {}
    _cache["contradictions"] = []


def get_cache() -> dict:
    return _cache


def _fetch_arxiv(query: str, max_results: int) -> list[dict]:
    papers = arxiv_fetcher.search_arxiv(query, max_results)
    return [
        {
            "paper_id": p.paper_id,
            "title": p.title,
            "authors": [a.name for a in p.authors[:4]],
            "abstract": p.abstract[:600],
            "published": p.published.isoformat() if p.published else None,
            "url": p.url,
            "pdf_url": p.pdf_url,
            "source": "arxiv",
            "keywords": p.keywords[:5],
        }
        for p in papers
    ]


def _fetch_s2(query: str, max_results: int) -> list[dict]:
    papers = semantic_scholar_fetcher.search_semantic_scholar(query, max_results)
    return [
        {
            "paper_id": p.paper_id,
            "title": p.title,
            "authors": [a.name for a in p.authors[:4]],
            "abstract": p.abstract[:600],
            "published": p.published.isoformat() if p.published else None,
            "url": p.url,
            "pdf_url": p.pdf_url,
            "source": "semantic_scholar",
            "citation_count": p.citation_count,
            "venue": p.venue,
        }
        for p in papers
    ]


@tool
def search_papers(query: str, max_results: int = 5, sources: str = "arxiv,semantic_scholar") -> str:
    """Search ArXiv and/or Semantic Scholar for papers on the given topic.
    Returns a JSON list of paper metadata."""
    from concurrent.futures import ThreadPoolExecutor
    source_list = [s.strip() for s in sources.split(",")]
    found = []

    # Fetch both sources in parallel
    fetch_fns = []
    if "arxiv" in source_list:
        fetch_fns.append(("arxiv", _fetch_arxiv))
    if "semantic_scholar" in source_list:
        fetch_fns.append(("s2", _fetch_s2))

    results_by_source: dict[str, list[dict]] = {}
    with ThreadPoolExecutor(max_workers=2) as pool:
        futs = {pool.submit(fn, query, max_results): name for name, fn in fetch_fns}
        for fut, name in futs.items():
            try:
                results_by_source[name] = fut.result()
            except Exception as e:
                logger.error(f"{name} search error: {e}")
                results_by_source[name] = []

    # Merge, deduplicating by normalized title
    seen_titles: set[str] = set()
    for name in ["arxiv", "s2"]:
        for d in results_by_source.get(name, []):
            key = " ".join(d["title"].lower().split())
            if key in seen_titles:
                continue
            seen_titles.add(key)
            _cache["papers"][d["paper_id"]] = d
            found.append(d)

    logger.info(f"search_papers found {len(found)} papers")
    return json.dumps({"found": len(found), "papers": found})


@tool
def summarize_paper(paper_id: str) -> str:
    """Generate an LLM summary of a paper given its paper_id.
    The paper must have been found by search_papers first."""
    paper = _cache["papers"].get(paper_id)
    if not paper:
        return f"Paper {paper_id} not found. Call search_papers first."

    # Check if already summarized
    if paper_id in _cache["summaries"]:
        return _cache["summaries"][paper_id]

    sections_text = ""
    if paper.get("sections"):
        for name, text in list(paper["sections"].items())[:3]:
            sections_text += f"\n### {name}\n{text[:400]}\n"

    prompt = P.SUMMARIZE_PAPER_PROMPT.format(
        title=paper["title"],
        authors=", ".join(paper["authors"]),
        abstract=paper["abstract"],
        sections_text=sections_text,
    )
    summary = call_llm([{"role": "user", "content": prompt}])
    _cache["summaries"][paper_id] = summary
    logger.info(f"Summarized {paper_id}: {len(summary)} chars")
    return summary


@tool
def detect_contradictions(paper_ids: str) -> str:
    """Compare summaries of given papers (comma-separated paper_ids) and detect contradictions.
    Papers must be summarized first."""
    ids = [pid.strip() for pid in paper_ids.split(",")]
    summaries_text = ""
    for pid in ids:
        summary = _cache["summaries"].get(pid, "")
        if not summary:
            continue
        paper = _cache["papers"].get(pid, {})
        summaries_text += f"\n---\nPaper ID: {pid}\nTitle: {paper.get('title', 'Unknown')}\n{summary}\n"

    if not summaries_text:
        return "No summaries available. Call summarize_paper for each paper first."

    prompt = P.CONTRADICTIONS_PROMPT.format(summaries_text=summaries_text)
    result = call_llm([{"role": "user", "content": prompt}])

    try:
        start = result.find("[")
        end = result.rfind("]") + 1
        if start != -1 and end > start:
            contradictions = json.loads(result[start:end])
            _cache["contradictions"].extend(contradictions)
            return json.dumps(contradictions)
    except Exception:
        pass
    return result


@tool
def generate_overview(query: str) -> str:
    """Generate a final structured research overview for the given query.
    Call this after searching and summarizing papers."""
    papers = list(_cache["papers"].values())
    summaries = _cache["summaries"]
    contradictions = _cache["contradictions"]

    papers_list = "\n".join(
        f"- [{p['paper_id']}] {p['title']} ({', '.join(p['authors'][:2])})"
        for p in papers
    )
    summaries_text = "\n\n".join(
        f"[{pid}]\n{text}" for pid, text in summaries.items()
    )
    contradictions_text = (
        json.dumps(contradictions, indent=2) if contradictions else "None found."
    )

    prompt = P.OVERVIEW_PROMPT.format(
        query=query,
        papers_list=papers_list or "No papers found.",
        summaries_text=summaries_text or "No summaries available.",
        contradictions_text=contradictions_text,
    )
    overview = call_llm(
        [{"role": "user", "content": prompt}],
        max_tokens=3000,
    )
    logger.info(f"Generated overview: {len(overview)} chars")
    return overview
