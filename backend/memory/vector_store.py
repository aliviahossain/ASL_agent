"""
ChromaDB vector store for semantic paper search.
Uses ChromaDB's built-in embedding function (ONNX-based, no torch needed).
"""
import chromadb
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction

from backend.core.config import settings
from backend.core.logger import get_logger

logger = get_logger(__name__)

_client = None
_collection = None


def _get_collection():
    global _client, _collection
    if _collection is not None:
        return _collection
    _client = chromadb.PersistentClient(path=str(settings.chroma_persist_dir))
    ef = DefaultEmbeddingFunction()
    _collection = _client.get_or_create_collection(
        name=settings.chroma_collection_name,
        embedding_function=ef,
        metadata={"hnsw:space": "cosine"},
    )
    logger.info(f"ChromaDB collection '{settings.chroma_collection_name}' ready — {_collection.count()} docs")
    return _collection


def add_papers(papers: list[dict]) -> int:
    """Upsert papers into ChromaDB. Returns count of papers added."""
    col = _get_collection()
    if not papers:
        return 0

    ids, documents, metadatas = [], [], []
    for p in papers:
        paper_id = str(p.get("paper_id", ""))
        title = p.get("title", "")
        abstract = p.get("abstract", "")
        text = f"{title}\n\n{abstract}"

        ids.append(paper_id)
        documents.append(text)
        metadatas.append({
            "title": title[:500],
            "source": p.get("source", ""),
            "authors": ", ".join(p.get("authors", [])[:4])[:300],
            "published": str(p.get("published") or ""),
            "url": p.get("url", "")[:500],
            "citation_count": int(p.get("citation_count") or 0),
        })

    col.upsert(ids=ids, documents=documents, metadatas=metadatas)
    logger.info(f"Upserted {len(ids)} papers into ChromaDB")
    return len(ids)


def search_similar(query: str, n_results: int = 5) -> list[dict]:
    """Semantic search — returns list of {paper_id, title, source, score, metadata}."""
    col = _get_collection()
    if col.count() == 0:
        return []
    results = col.query(
        query_texts=[query],
        n_results=min(n_results, col.count()),
        include=["metadatas", "distances", "documents"],
    )
    output = []
    for i, pid in enumerate(results["ids"][0]):
        meta = results["metadatas"][0][i]
        dist = results["distances"][0][i]
        output.append({
            "paper_id": pid,
            "title": meta.get("title", ""),
            "source": meta.get("source", ""),
            "authors": meta.get("authors", ""),
            "url": meta.get("url", ""),
            "score": round(1 - dist, 4),
        })
    return output


def collection_size() -> int:
    try:
        return _get_collection().count()
    except Exception:
        return 0
