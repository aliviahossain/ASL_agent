import litellm
from backend.core.config import settings
from backend.core.logger import get_logger

logger = get_logger(__name__)
litellm.set_verbose = False


def call_llm(messages: list[dict], temperature: float = 0.3, max_tokens: int = 2048) -> str:
    """Call Ollama via litellm. Returns the assistant's text content."""
    model = f"ollama/{settings.ollama_model}"
    try:
        resp = litellm.completion(
            model=model,
            messages=messages,
            api_base=settings.ollama_base_url,
            temperature=temperature,
            max_tokens=max_tokens,
            timeout=1,          # fail fast when Ollama is not running
            num_retries=0,      # no retries — fall back to mock immediately
        )
        return resp.choices[0].message.content or ""
    except Exception as e:
        logger.error(f"LLM call failed: {e}")
        # Return a mock response so the app stays usable without Ollama running
        return _mock_response(messages)


def _mock_response(messages: list[dict]) -> str:
    last = messages[-1].get("content", "")
    if "summarize" in last.lower() or "summary" in last.lower():
        return (
            "**Main Contribution**: This paper presents a novel approach to the research problem.\n"
            "**Methods**: The authors use a combination of deep learning and statistical analysis.\n"
            "**Key Results**: The proposed method achieves state-of-the-art performance on standard benchmarks.\n"
            "**Datasets**: Standard publicly available datasets are used.\n"
            "**Limitations**: The method requires significant computational resources.\n\n"
            "*(Note: Ollama not running — this is a placeholder summary. "
            "Start Ollama with `ollama serve` and pull a model with `ollama pull mistral`)*"
        )
    if "contradiction" in last.lower():
        return "[]"
    return (
        "## Research Landscape\nThis is an active research area with significant recent progress.\n\n"
        "## Key Themes\nThe papers cover multiple complementary approaches.\n\n"
        "## Key Findings\nRecent work shows promising results across multiple benchmarks.\n\n"
        "*(Note: Ollama not running — start with `ollama serve` then `ollama pull mistral`)*"
    )
