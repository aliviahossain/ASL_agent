from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime


@dataclass
class Author:
    name: str
    affiliation: Optional[str] = None


@dataclass
class Paper:
    paper_id: str                          # arxiv id or semantic scholar id
    title: str
    authors: list[Author]
    abstract: str
    published: Optional[datetime] = None
    url: str = ""
    pdf_url: str = ""
    source: str = ""                       # "arxiv" | "semantic_scholar"
    local_pdf_path: Optional[str] = None
    full_text: Optional[str] = None
    sections: dict[str, str] = field(default_factory=dict)   # section_name -> text
    references: list[str] = field(default_factory=list)      # paper ids
    keywords: list[str] = field(default_factory=list)
    doi: Optional[str] = None
    citation_count: Optional[int] = None
    venue: Optional[str] = None
