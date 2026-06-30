"""Convert a networkx DiGraph to the JSON format expected by react-force-graph-2d."""
import networkx as nx

_NODE_COLORS = {
    "paper":   "#6c63ff",
    "concept": "#4ade80",
    "method":  "#f59e0b",
    "dataset": "#f87171",
    "task":    "#38bdf8",
}

_NODE_SIZES = {
    "paper":   8,
    "concept": 5,
    "method":  6,
    "dataset": 5,
    "task":    5,
}


def graph_to_json(G: nx.DiGraph) -> dict:
    """
    Returns {"nodes": [...], "links": [...]} for react-force-graph-2d.
    """
    nodes = []
    for node_id, attrs in G.nodes(data=True):
        node_type = attrs.get("type", "concept")
        nodes.append({
            "id": str(node_id),
            "label": attrs.get("label") or attrs.get("title") or str(node_id),
            "type": node_type,
            "color": _NODE_COLORS.get(node_type, "#94a3b8"),
            "size": _NODE_SIZES.get(node_type, 5),
            # paper-specific
            "title": attrs.get("title", ""),
            "source": attrs.get("source", ""),
            "year": attrs.get("year"),
            "url": attrs.get("url", ""),
            "abstract": attrs.get("abstract", ""),
            "citation_count": attrs.get("citation_count"),
        })

    links = []
    for src, dst, attrs in G.edges(data=True):
        links.append({
            "source": str(src),
            "target": str(dst),
            "relation": attrs.get("relation", ""),
            "weight": attrs.get("weight", 1),
        })

    return {"nodes": nodes, "links": links}
