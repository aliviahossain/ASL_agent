import json
import asyncio
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.core.logger import get_logger
from backend.agents.react_agent import run_agent
from backend.memory.vector_store import add_papers, search_similar
from backend.graph.builder import build_graph
from backend.graph.serializer import graph_to_json
from backend.tracking.mlflow_tracker import track_run
from backend.api import store as paper_store

logger = get_logger(__name__)
router = APIRouter()


class AgentRequest(BaseModel):
    query: str
    max_per_source: int = 5
    sources: list[str] = ["arxiv", "semantic_scholar"]


def _sse(kind: str, payload: dict) -> str:
    return f"data: {json.dumps({'type': kind, **payload})}\n\n"


async def _stream_agent(req: AgentRequest):
    yield _sse("status", {"message": f"Agent starting for: '{req.query}'"})
    await asyncio.sleep(0)

    yield _sse("status", {"message": "Searching papers and running ReAct loop..."})
    await asyncio.sleep(0)

    loop = asyncio.get_event_loop()

    with track_run(req.query) as tracker:
        result = await loop.run_in_executor(
            None,
            lambda: run_agent(req.query, req.max_per_source, req.sources),
        )
        tracker.log_result(result)

    papers = result.get("papers", [])
    summaries = result.get("summaries", {})
    contradictions = result.get("contradictions", [])
    overview = result.get("overview", "")

    yield _sse("status", {"message": f"Found {len(papers)} papers, generated {len(summaries)} summaries"})
    await asyncio.sleep(0)

    # Stream papers
    for p in papers:
        paper_store.papers[p["paper_id"]] = p
        yield _sse("paper", p)
        await asyncio.sleep(0)

    # Stream summaries
    for pid, summary in summaries.items():
        yield _sse("summary", {"paper_id": pid, "summary": summary})
        await asyncio.sleep(0)

    # Stream contradictions
    if contradictions:
        yield _sse("contradictions", {"items": contradictions})
        await asyncio.sleep(0)

    # Build and stream knowledge graph
    yield _sse("status", {"message": "Building knowledge graph..."})
    await asyncio.sleep(0)
    G = await loop.run_in_executor(None, lambda: build_graph(papers, summaries))
    graph_data = graph_to_json(G)
    yield _sse("graph", graph_data)
    await asyncio.sleep(0)

    # Add to ChromaDB
    yield _sse("status", {"message": "Indexing papers into vector store..."})
    await asyncio.sleep(0)
    await loop.run_in_executor(None, lambda: add_papers(papers))

    # Stream final overview
    if overview:
        yield _sse("overview", {"text": overview})

    yield _sse("done", {
        "message": f"Complete — {len(papers)} papers, {len(summaries)} summaries, {len(contradictions)} contradictions",
        "papers_count": len(papers),
        "summaries_count": len(summaries),
    })


@router.post("/agent/run")
async def run_agent_endpoint(req: AgentRequest):
    return StreamingResponse(
        _stream_agent(req),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/agent/similar")
async def find_similar(query: str, n: int = 5):
    results = search_similar(query, n)
    return {"results": results, "total": len(results)}
