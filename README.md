# ASL Agent — Autonomous Scientific Literature Explorer

Searches ArXiv and Semantic Scholar, summarises papers with a local LLM (Ollama), builds a knowledge graph, and flags contradictions — all in real time.

---

## Prerequisites

| Tool | Purpose | Install |
|---|---|---|
| Python 3.11+ | Backend | python.org |
| Node.js 18+ | Frontend | nodejs.org |
| Ollama | Local LLM inference | ollama.com |

---

## Setup

### 1. Clone & configure environment

```bash
git clone <repo-url>
cd ASL_agent

cp .env.example .env
# Edit .env — set OLLAMA_MODEL, optional API keys
```

### 2. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 3. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### 4. Pull an Ollama model

```bash
ollama pull mistral
# or: ollama pull llama3, gemma2, phi3, etc.
# must match OLLAMA_MODEL in your .env
```

---

## Running the App

Open **two terminals** from the project root.

### Terminal 1 — Backend

```bash
python -m uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 --reload
```

API available at `http://localhost:8000`
Interactive docs at `http://localhost:8000/docs`

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

UI available at `http://localhost:5173`

---

## Optional Services

### MLflow (experiment tracking)

```bash
mlflow ui --port 5000
```

Dashboard at `http://localhost:5000`

### Neo4j (persistent knowledge graph)

Set `NEO4J_URI`, `NEO4J_USER`, and `NEO4J_PASSWORD` in `.env`, then start Neo4j locally or via Docker:

```bash
docker run -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password \
  neo4j:latest
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `mistral` | Model name to use for summaries |
| `SEMANTIC_SCHOLAR_API_KEY` | *(empty)* | Optional — raises the API rate limit |
| `NEO4J_URI` | `bolt://localhost:7687` | Neo4j connection |
| `NEO4J_USER` | `neo4j` | Neo4j username |
| `NEO4J_PASSWORD` | `password` | Neo4j password |
| `MLFLOW_TRACKING_URI` | `http://localhost:5000` | MLflow server URL |
| `MLFLOW_EXPERIMENT_NAME` | `asl-agent` | MLflow experiment label |
| `API_HOST` | `0.0.0.0` | FastAPI bind host |
| `API_PORT` | `8000` | FastAPI bind port |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | Allowed CORS origins |
