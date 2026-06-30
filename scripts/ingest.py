"""
CLI script to run the ingestion pipeline manually.

Usage:
    python -m scripts.ingest "exoplanet atmospheres" --max 5 --sources arxiv
    python -m scripts.ingest "transformer attention" --max 3 --no-pdf
"""
import argparse
import json
from dataclasses import asdict

from backend.ingestion.pipeline import run_ingestion_pipeline


def main():
    parser = argparse.ArgumentParser(description="ASL Agent — paper ingestion")
    parser.add_argument("query", type=str, help="Research topic to search")
    parser.add_argument("--max", type=int, default=5, help="Max papers per source")
    parser.add_argument(
        "--sources",
        nargs="+",
        choices=["arxiv", "semantic_scholar"],
        default=["arxiv", "semantic_scholar"],
    )
    parser.add_argument("--no-pdf", action="store_true", help="Skip PDF download")
    parser.add_argument("--no-text", action="store_true", help="Skip text extraction")
    args = parser.parse_args()

    papers = run_ingestion_pipeline(
        query=args.query,
        max_per_source=args.max,
        download_pdfs=not args.no_pdf,
        extract_text=not args.no_text,
        sources=args.sources,
    )

    print(f"\n{'='*60}")
    print(f"  Ingested {len(papers)} papers for: '{args.query}'")
    print(f"{'='*60}\n")

    for p in papers:
        authors = ", ".join(a.name for a in p.authors[:3])
        if len(p.authors) > 3:
            authors += " et al."
        print(f"[{p.source.upper()}] {p.paper_id}")
        print(f"  Title   : {p.title}")
        print(f"  Authors : {authors}")
        print(f"  Abstract: {p.abstract[:200]}...")
        if p.sections:
            print(f"  Sections: {list(p.sections.keys())}")
        if p.local_pdf_path:
            print(f"  PDF     : {p.local_pdf_path}")
        print()


if __name__ == "__main__":
    main()
