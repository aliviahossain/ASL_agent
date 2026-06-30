"""
MLflow experiment tracking — uses local file store by default (no server needed).
To use the MLflow UI run: mlflow ui --port 5000
Then set MLFLOW_TRACKING_URI=http://localhost:5000 in .env.
"""
import time
import json
from pathlib import Path
from contextlib import contextmanager

import mlflow

from backend.core.config import settings
from backend.core.logger import get_logger

logger = get_logger(__name__)

_initialized = False


def _init():
    global _initialized
    if _initialized:
        return
    try:
        uri = settings.mlflow_tracking_uri
        # Default to local file store so no server is needed
        if uri == "http://localhost:5000":
            uri = "./mlruns"
        mlflow.set_tracking_uri(uri)
        mlflow.set_experiment(settings.mlflow_experiment_name)
        _initialized = True
    except Exception as e:
        logger.warning(f"MLflow init failed: {e}")


@contextmanager
def track_run(query: str, run_name: str | None = None):
    _init()
    run_name = run_name or f"query: {query[:40]}"
    try:
        with mlflow.start_run(run_name=run_name) as run:
            tracker = _RunTracker(run, query)
            mlflow.log_param("query", query)
            mlflow.log_param("model", settings.ollama_model)
            tracker._start = time.time()
            try:
                yield tracker
            finally:
                elapsed = time.time() - tracker._start
                mlflow.log_metric("duration_seconds", round(elapsed, 2))
    except Exception as e:
        logger.warning(f"MLflow tracking unavailable: {e}")
        yield _NoopTracker()


class _RunTracker:
    def __init__(self, run, query: str):
        self._run = run
        self._query = query
        self._start = time.time()

    def log_result(self, result: dict):
        papers = result.get("papers", [])
        summaries = result.get("summaries", {})
        contradictions = result.get("contradictions", [])
        overview = result.get("overview", "")

        mlflow.log_metrics({
            "papers_found": len(papers),
            "papers_summarized": len(summaries),
            "contradictions_found": len(contradictions),
            "overview_length": len(overview),
        })

        sources: dict[str, int] = {}
        for p in papers:
            src = p.get("source", "unknown")
            sources[src] = sources.get(src, 0) + 1
        for src, count in sources.items():
            mlflow.log_metric(f"papers_from_{src}", count)

        if overview:
            tmp = Path("data/cache") / f"overview_{self._run.info.run_id[:8]}.md"
            tmp.parent.mkdir(parents=True, exist_ok=True)
            tmp.write_text(f"# Research Overview: {self._query}\n\n{overview}", encoding="utf-8")
            mlflow.log_artifact(str(tmp))

        logger.info(f"MLflow run {self._run.info.run_id[:8]} logged")

    @property
    def run_id(self) -> str:
        return self._run.info.run_id


class _NoopTracker:
    def log_result(self, result: dict):
        pass

    @property
    def run_id(self) -> str:
        return "no-mlflow"


def list_recent_runs(n: int = 20) -> list[dict]:
    _init()
    try:
        runs = mlflow.search_runs(
            experiment_names=[settings.mlflow_experiment_name],
            order_by=["start_time DESC"],
            max_results=n,
        )
        records = []
        for _, row in runs.iterrows():
            records.append({
                "run_id": row.get("run_id", ""),
                "run_name": row.get("tags.mlflow.runName", ""),
                "query": row.get("params.query", ""),
                "model": row.get("params.model", ""),
                "papers_found": int(row.get("metrics.papers_found", 0) or 0),
                "papers_summarized": int(row.get("metrics.papers_summarized", 0) or 0),
                "contradictions_found": int(row.get("metrics.contradictions_found", 0) or 0),
                "duration_seconds": round(float(row.get("metrics.duration_seconds", 0) or 0), 1),
                "start_time": str(row.get("start_time", "")),
                "status": row.get("status", ""),
            })
        return records
    except Exception as e:
        logger.warning(f"MLflow list_runs failed: {e}")
        return []
