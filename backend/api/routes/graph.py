from fastapi import APIRouter
from backend.graph.builder import get_graph
from backend.graph.serializer import graph_to_json

router = APIRouter()


@router.get("/graph")
def get_knowledge_graph():
    """Return the current knowledge graph as JSON for react-force-graph-2d."""
    G = get_graph()
    data = graph_to_json(G)
    return {
        "nodes": data["nodes"],
        "links": data["links"],
        "stats": {
            "node_count": len(data["nodes"]),
            "edge_count": len(data["links"]),
        },
    }
