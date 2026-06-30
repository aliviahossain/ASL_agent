"""
Build a networkx knowledge graph from a list of papers.

Node types:
  - paper  (paper_id, title, source, year)
  - concept (name)
  - method  (name)
  - dataset (name)
  - task    (name)

Edge types:
  - paper  → concept : DISCUSSES
  - paper  → method  : USES
  - paper  → dataset : EVALUATED_ON
  - paper  → task    : ADDRESSES
  - paper  → paper   : SIMILAR_TO (if shared concepts ≥ threshold)
"""
import networkx as nx
from backend.graph.extractor import extract_concepts
from backend.core.logger import get_logger

logger = get_logger(__name__)

_SIMILARITY_THRESHOLD = 2   # shared concept nodes to draw a SIMILAR_TO edge

# Module-level graph (reset each run via build_graph)
_graph: nx.DiGraph = nx.DiGraph()


def get_graph() -> nx.DiGraph:
    return _graph


def build_graph(papers: list[dict], summaries: dict[str, str] | None = None) -> nx.DiGraph:
    """
    Build and return a fresh DiGraph for the given papers.
    Enriches each paper with concept extraction.
    """
    global _graph
    G = nx.DiGraph()

    paper_concepts: dict[str, set] = {}   # paper_id → set of concept node names

    for paper in papers:
        pid = paper["paper_id"]
        year = None
        if paper.get("published"):
            try:
                year = int(str(paper["published"])[:4])
            except (ValueError, TypeError):
                pass

        G.add_node(pid, type="paper", title=paper.get("title", ""),
                   source=paper.get("source", ""), year=year,
                   url=paper.get("url", ""),
                   abstract=paper.get("abstract", "")[:300],
                   citation_count=paper.get("citation_count"))

        # Extract concepts
        concepts_data = extract_concepts(paper)
        connected: set[str] = set()

        def _add_concept_edge(name: str, edge_type: str, node_type: str):
            name = name.strip().lower()
            if not name or len(name) < 3:
                return
            if not G.has_node(name):
                G.add_node(name, type=node_type, label=name)
            G.add_edge(pid, name, relation=edge_type)
            connected.add(name)

        for c in concepts_data.get("concepts", []):
            _add_concept_edge(c, "DISCUSSES", "concept")
        for m in concepts_data.get("methods", []):
            _add_concept_edge(m, "USES", "method")
        for d in concepts_data.get("datasets", []):
            _add_concept_edge(d, "EVALUATED_ON", "dataset")
        for t in concepts_data.get("tasks", []):
            _add_concept_edge(t, "ADDRESSES", "task")

        paper_concepts[pid] = connected
        logger.debug(f"  {pid}: {len(connected)} concept nodes")

    # Add SIMILAR_TO edges between papers that share enough concept nodes
    pids = list(paper_concepts.keys())
    for i in range(len(pids)):
        for j in range(i + 1, len(pids)):
            shared = paper_concepts[pids[i]] & paper_concepts[pids[j]]
            if len(shared) >= _SIMILARITY_THRESHOLD:
                weight = len(shared)
                G.add_edge(pids[i], pids[j], relation="SIMILAR_TO", weight=weight,
                           shared_concepts=list(shared)[:5])
                G.add_edge(pids[j], pids[i], relation="SIMILAR_TO", weight=weight,
                           shared_concepts=list(shared)[:5])

    _graph = G
    logger.info(f"Knowledge graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")
    return G
