from typing import Annotated, Optional
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    query: str
    messages: Annotated[list, add_messages]
    papers: list[dict]           # raw paper dicts accumulated by tools
    summaries: dict[str, str]    # paper_id -> LLM summary
    findings: list[str]          # key findings extracted
    contradictions: list[dict]   # [{paper_a, paper_b, claim_a, claim_b}]
    overview: Optional[str]      # final structured research overview
    step_count: int
