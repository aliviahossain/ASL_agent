"""
Extract concepts and relationships from paper text using the LLM.
"""
import json
import re
from backend.agents.llm import call_llm
from backend.core.logger import get_logger

logger = get_logger(__name__)

_CONCEPT_PROMPT = """Extract the key technical concepts and methods from this paper abstract.

Title: {title}
Abstract: {abstract}

Return ONLY a JSON object with this exact structure:
{{
  "concepts": ["concept1", "concept2", ...],
  "methods": ["method1", "method2", ...],
  "datasets": ["dataset1", ...],
  "tasks": ["task1", ...]
}}

Rules:
- concepts: 3-8 core technical concepts (e.g. "attention mechanism", "graph neural network")
- methods: specific algorithms or architectures used
- datasets: datasets mentioned (can be empty list)
- tasks: ML/research tasks addressed (e.g. "image classification", "text generation")
- Each item max 5 words, lowercase
- Return only valid JSON, no extra text"""


def extract_concepts(paper: dict) -> dict:
    """
    Call LLM to extract concepts/methods/datasets from a paper.
    Returns dict with keys: concepts, methods, datasets, tasks.
    Falls back to simple keyword extraction if LLM fails.
    """
    prompt = _CONCEPT_PROMPT.format(
        title=paper.get("title", ""),
        abstract=paper.get("abstract", "")[:800],
    )
    raw = call_llm([{"role": "user", "content": prompt}], temperature=0.1, max_tokens=400)

    try:
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start != -1 and end > start:
            result = json.loads(raw[start:end])
            for key in ["concepts", "methods", "datasets", "tasks"]:
                if key not in result or not isinstance(result[key], list):
                    result[key] = []
            return result
    except Exception:
        pass

    # Fallback: pull from keywords or categories
    logger.debug(f"LLM concept extraction failed for '{paper.get('title','')}', using fallback")
    return _keyword_fallback(paper)


def _keyword_fallback(paper: dict) -> dict:
    keywords = paper.get("keywords", [])
    abstract = paper.get("abstract", "").lower()

    common_methods = [
        "transformer", "lstm", "cnn", "bert", "gpt", "attention",
        "diffusion", "vae", "gan", "reinforcement learning", "fine-tuning",
        "graph neural network", "contrastive learning", "self-supervised",
    ]
    found_methods = [m for m in common_methods if m in abstract]

    return {
        "concepts": [k.lower() for k in keywords[:5]],
        "methods": found_methods[:4],
        "datasets": [],
        "tasks": [],
    }
