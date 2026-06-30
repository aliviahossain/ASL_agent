import re
from pathlib import Path
from typing import Optional

import fitz  # PyMuPDF

from backend.core.logger import get_logger
from backend.core.models import Paper

logger = get_logger(__name__)

# Section heading patterns (covers most CS/physics/bio paper structures)
_SECTION_PATTERNS = [
    re.compile(r"^(\d+\.?\s+)?(abstract|introduction|background|related work|"
               r"methodology|methods?|approach|model|experiments?|results?|"
               r"evaluation|discussion|conclusion|references|acknowledgements?|"
               r"appendix)\b", re.IGNORECASE),
]

_MIN_SECTION_CHARS = 100   # ignore tiny blobs that aren't real sections


def _is_section_heading(text: str) -> bool:
    text = text.strip()
    if len(text) > 120 or len(text) < 3:
        return False
    for pat in _SECTION_PATTERNS:
        if pat.match(text):
            return True
    # numbered headings like "3 Experiments" or "2.1 Dataset"
    if re.match(r"^\d+(\.\d+)?\s+[A-Z]", text):
        return True
    return False


def _clean(text: str) -> str:
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"(\w)-\s+(\w)", r"\1\2", text)   # fix hyphenated line breaks
    return text.strip()


def extract_text_from_pdf(pdf_path: str | Path) -> tuple[str, dict[str, str]]:
    """
    Returns (full_text, sections_dict).
    sections_dict maps section_name -> section_text.
    Falls back to pdfplumber if PyMuPDF yields < 200 chars.
    """
    pdf_path = Path(pdf_path)
    if not pdf_path.exists():
        raise FileNotFoundError(pdf_path)

    full_text, sections = _extract_pymupdf(pdf_path)

    if len(full_text) < 200:
        logger.warning(f"PyMuPDF got very little text from {pdf_path.name}, trying pdfplumber")
        full_text, sections = _extract_pdfplumber(pdf_path)

    return full_text, sections


def _extract_pymupdf(pdf_path: Path) -> tuple[str, dict[str, str]]:
    doc = fitz.open(str(pdf_path))
    blocks_by_page: list[list[dict]] = []

    for page in doc:
        blocks = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE)["blocks"]
        page_blocks = []
        for b in blocks:
            if b.get("type") != 0:      # type 0 = text
                continue
            for line in b.get("lines", []):
                line_text = " ".join(
                    span["text"] for span in line.get("spans", [])
                ).strip()
                if not line_text:
                    continue
                font_size = max(
                    (span.get("size", 0) for span in line.get("spans", [])), default=0
                )
                page_blocks.append({"text": line_text, "size": font_size})
        blocks_by_page.append(page_blocks)

    doc.close()

    all_lines = [b for page in blocks_by_page for b in page]
    if not all_lines:
        return "", {}

    # Detect body font size (mode of sizes)
    from collections import Counter
    size_counts = Counter(round(b["size"]) for b in all_lines)
    body_size = size_counts.most_common(1)[0][0]

    sections: dict[str, str] = {}
    current_section = "preamble"
    current_chunks: list[str] = []

    for block in all_lines:
        text = block["text"].strip()
        size = round(block["size"])

        is_heading = (size > body_size + 1 and len(text) < 120) or _is_section_heading(text)

        if is_heading:
            if current_chunks:
                body = _clean(" ".join(current_chunks))
                if len(body) >= _MIN_SECTION_CHARS:
                    sections[current_section] = body
            current_section = text.lower()
            current_chunks = []
        else:
            current_chunks.append(text)

    if current_chunks:
        body = _clean(" ".join(current_chunks))
        if len(body) >= _MIN_SECTION_CHARS:
            sections[current_section] = body

    full_text = _clean(" ".join(b["text"] for b in all_lines))
    return full_text, sections


def _extract_pdfplumber(pdf_path: Path) -> tuple[str, dict[str, str]]:
    try:
        import pdfplumber
    except ImportError:
        logger.error("pdfplumber not installed; pip install pdfplumber")
        return "", {}

    pages_text: list[str] = []
    with pdfplumber.open(str(pdf_path)) as pdf:
        for page in pdf.pages:
            t = page.extract_text() or ""
            pages_text.append(t)

    full_text = _clean("\n".join(pages_text))

    # Simple section splitting for pdfplumber fallback
    sections: dict[str, str] = {}
    current_section = "preamble"
    current_chunks: list[str] = []

    for line in full_text.split("\n"):
        if _is_section_heading(line):
            if current_chunks:
                body = _clean(" ".join(current_chunks))
                if len(body) >= _MIN_SECTION_CHARS:
                    sections[current_section] = body
            current_section = line.strip().lower()
            current_chunks = []
        else:
            current_chunks.append(line)

    if current_chunks:
        body = _clean(" ".join(current_chunks))
        if len(body) >= _MIN_SECTION_CHARS:
            sections[current_section] = body

    return full_text, sections


def enrich_paper_with_pdf(paper: Paper) -> Paper:
    """Populate paper.full_text and paper.sections from its local PDF."""
    if not paper.local_pdf_path:
        logger.warning(f"No local PDF for paper {paper.paper_id}")
        return paper
    try:
        full_text, sections = extract_text_from_pdf(paper.local_pdf_path)
        paper.full_text = full_text
        paper.sections = sections
        logger.info(
            f"Extracted {len(full_text):,} chars, {len(sections)} sections from {paper.paper_id}"
        )
    except Exception as e:
        logger.error(f"PDF extraction failed for {paper.paper_id}: {e}")
    return paper
