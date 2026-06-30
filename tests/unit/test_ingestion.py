import pytest
from unittest.mock import patch, MagicMock
from pathlib import Path

from backend.core.models import Paper, Author
from backend.ingestion.pdf_extractor import extract_text_from_pdf, _is_section_heading, _clean


# ── _clean ──────────────────────────────────────────────────────────────────

def test_clean_collapses_whitespace():
    assert _clean("hello   world") == "hello world"


def test_clean_fixes_hyphen_breaks():
    assert _clean("meth-\nods") == "methods"


# ── _is_section_heading ──────────────────────────────────────────────────────

@pytest.mark.parametrize("heading", [
    "Introduction",
    "1. Methods",
    "2.1 Dataset",
    "Abstract",
    "Related Work",
    "Conclusion",
])
def test_recognises_valid_headings(heading):
    assert _is_section_heading(heading)


@pytest.mark.parametrize("non_heading", [
    "We show that our model outperforms baselines by a significant margin.",
    "",
    "a",
])
def test_rejects_non_headings(non_heading):
    assert not _is_section_heading(non_heading)


# ── extract_text_from_pdf (mocked) ────────────────────────────────────────────

def test_extract_raises_for_missing_file():
    with pytest.raises(FileNotFoundError):
        extract_text_from_pdf("/nonexistent/path/paper.pdf")


@patch("backend.ingestion.pdf_extractor.fitz.open")
def test_extract_returns_full_text_and_sections(mock_open, tmp_path):
    fake_pdf = tmp_path / "paper.pdf"
    fake_pdf.write_bytes(b"%PDF-1.4")  # stub file so exists() passes

    # Build a mock fitz document with two pages
    mock_doc = MagicMock()
    mock_doc.__iter__ = MagicMock(return_value=iter([]))

    def make_span(text, size):
        return {"text": text, "size": size}

    def make_line(text, size):
        return {"spans": [make_span(text, size)]}

    def make_block(lines):
        return {"type": 0, "lines": [make_line(t, s) for t, s in lines]}

    page = MagicMock()
    page.get_text.return_value = {
        "blocks": [
            make_block([
                ("Introduction", 14.0),
                ("This paper presents a novel approach.", 10.0),
                ("We evaluate on standard benchmarks.", 10.0),
            ]),
            make_block([
                ("Methods", 14.0),
                ("Our method uses a transformer architecture.", 10.0),
            ]),
        ]
    }
    mock_doc.__enter__ = MagicMock(return_value=mock_doc)
    mock_doc.__exit__ = MagicMock(return_value=False)
    mock_doc.__iter__ = MagicMock(return_value=iter([page]))
    mock_doc.close = MagicMock()
    mock_open.return_value = mock_doc

    full_text, sections = extract_text_from_pdf(fake_pdf)

    assert len(full_text) > 0
    assert isinstance(sections, dict)
