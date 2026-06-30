from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.core.config import settings
from backend.api.routes import search, papers, agent, graph, runs
from backend.memory.vector_store import collection_size

app = FastAPI(title="ASL Agent API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router, prefix="/api")
app.include_router(papers.router, prefix="/api")
app.include_router(agent.router, prefix="/api")
app.include_router(graph.router, prefix="/api")
app.include_router(runs.router, prefix="/api")


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "vector_store_size": collection_size(),
        "ollama_model": settings.ollama_model,
        "ollama_url": settings.ollama_base_url,
    }
