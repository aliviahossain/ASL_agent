from fastapi import APIRouter
from backend.tracking.mlflow_tracker import list_recent_runs

router = APIRouter()


@router.get("/runs")
def get_runs(limit: int = 20):
    """Return recent MLflow experiment runs."""
    runs = list_recent_runs(limit)
    return {"runs": runs, "total": len(runs)}
