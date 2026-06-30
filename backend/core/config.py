from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    # Paths
    data_dir: Path = Path("data")
    pdf_dir: Path = Path("data/pdfs")
    cache_dir: Path = Path("data/cache")

    # ArXiv
    arxiv_max_results: int = 20
    arxiv_sort_by: str = "relevance"

    # Semantic Scholar
    semantic_scholar_api_key: str = ""
    semantic_scholar_max_results: int = 20

    # Ollama / LLM
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "mistral"

    # ChromaDB
    chroma_persist_dir: Path = Path("data/chroma")
    chroma_collection_name: str = "papers"

    # Neo4j
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "password"

    # MLflow
    mlflow_tracking_uri: str = "http://localhost:5000"
    mlflow_experiment_name: str = "asl-agent"

    # FastAPI
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

# Ensure required directories exist
for d in [settings.data_dir, settings.pdf_dir, settings.cache_dir, settings.chroma_persist_dir]:
    d.mkdir(parents=True, exist_ok=True)
