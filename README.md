# ASL Agent — Autonomous Scientific Literature Explorer

A research assistant that searches ArXiv and Semantic Scholar, summarises papers with a local LLM, builds a knowledge graph, and flags contradictions — all streaming in real time through a clean browser UI.

---

## What It Does

Type any research topic and the agent runs a full pipeline automatically:

1. **Searches** ArXiv and Semantic Scholar in parallel, pulling the most relevant papers
2. **Summarises** each paper locally using Ollama (no data leaves your machine)
3. **Detects contradictions** — flags papers that make conflicting claims
4. **Builds a knowledge graph** of concepts and how they connect across papers
5. **Writes a research overview** synthesising the findings into a single narrative
6. **Streams everything live** — papers, summaries, and graph nodes appear as they are ready

### UI Tabs

| Tab | What you see |
|---|---|
| **Papers** | Card grid of results with abstracts, authors, dates, and AI summaries. Click any card for a full detail view. |
| **Research Summary** | A synthesised overview of the topic plus a list of flagged contradictions between papers. |
| **Knowledge Graph** | Interactive force-directed graph of concepts and their relationships extracted from the papers. |
| **Run History** | Log of past agent runs. |

A live status log runs alongside every tab, showing each step the agent takes as it happens.

---

## Architecture

```
frontend/          React + Vite UI (port 5173)
backend/
  api/             FastAPI — streams SSE events to the browser
  agents/          LangGraph ReAct agent (ChatOllama + 4 tools)
  ingestion/       ArXiv & Semantic Scholar fetchers, PDF extractor
  graph/           Knowledge graph builder & Neo4j serialiser
  memory/          ChromaDB vector store for paper embeddings
  tracking/        MLflow experiment tracker
```

The agent is built on **LangGraph** with a ReAct loop. It has four tools — `search_papers`, `summarize_paper`, `detect_contradictions`, and `generate_overview` — and falls back to a sequential pipeline if Ollama is unavailable. The FastAPI backend streams results as Server-Sent Events so the UI updates incrementally rather than waiting for the full run to finish.

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

cp .env .env.local   # or edit .env directly
```

Fill in your values — see [Environment Variables](#environment-variables) below.

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
# or: ollama pull llama3, llama3.1, gemma2, phi3, etc.
# must match OLLAMA_MODEL in your .env
```

---

## Running the App

You need **three terminals** from the project root.

### Terminal 1 — Ollama

```bash
ollama serve
```

Keep this running. The backend connects to it at `http://localhost:11434`.

### Terminal 2 — Backend

```bash
python -m uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 --reload
```

- API: `http://localhost:8000`
- Interactive docs: `http://localhost:8000/docs`

### Terminal 3 — Frontend

```bash
cd frontend
npm run dev
```

- UI: `http://localhost:5173`

---

## Optional Services

### MLflow (experiment tracking)

```bash
mlflow ui --port 5000
```

Dashboard at `http://localhost:5000` — tracks each agent run with timing and results.

### Neo4j (persistent knowledge graph)

Set `NEO4J_URI`, `NEO4J_USER`, and `NEO4J_PASSWORD` in `.env`, then start Neo4j locally or via Docker:

```bash
docker run -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/your-password \
  neo4j:latest
```

Without Neo4j the knowledge graph still works — it just isn't persisted between runs.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `mistral` | Model for summaries and the ReAct agent |
| `SEMANTIC_SCHOLAR_API_KEY` | *(empty)* | Optional — raises the API rate limit |
| `NEO4J_URI` | `bolt://localhost:7687` | Neo4j connection URI |
| `NEO4J_USER` | `neo4j` | Neo4j username |
| `NEO4J_PASSWORD` | `password` | Neo4j password |
| `MLFLOW_TRACKING_URI` | `http://localhost:5000` | MLflow server URL |
| `MLFLOW_EXPERIMENT_NAME` | `asl-agent` | MLflow experiment label |
| `API_HOST` | `0.0.0.0` | FastAPI bind host |
| `API_PORT` | `8000` | FastAPI bind port |
| `CORS_ORIGINS` | `["http://localhost:3000","http://localhost:5173"]` | Allowed CORS origins |
