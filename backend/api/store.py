from backend.core.models import Paper

# Simple in-memory paper store (replaced by ChromaDB in Step 3)
papers: dict[str, Paper] = {}
