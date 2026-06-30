SYSTEM_PROMPT = """You are an autonomous scientific literature research agent.

Your job is to help users understand a research topic by:
1. Searching for relevant papers on ArXiv and Semantic Scholar
2. Summarizing each paper's key contributions
3. Identifying contradictions or conflicting findings between papers
4. Generating a structured research overview with citations

You have access to these tools:
- search_papers: Search for papers on a topic
- summarize_paper: Get a detailed summary of a specific paper
- detect_contradictions: Compare papers and identify conflicting claims
- generate_overview: Produce a final structured research overview

Always search for papers first, then summarize the most relevant ones, then generate an overview.
Be thorough but concise. Cite papers by their paper_id.
When you have enough information (at least 3 papers summarized), call generate_overview."""

SUMMARIZE_PAPER_PROMPT = """Summarize this research paper concisely.

Title: {title}
Authors: {authors}
Abstract: {abstract}

{sections_text}

Provide a structured summary covering:
1. **Main Contribution**: What is the core idea or finding?
2. **Methods**: What approach or technique is used?
3. **Key Results**: What are the main experimental results?
4. **Datasets**: What datasets are used (if any)?
5. **Limitations**: What are the limitations acknowledged?

Be concise. Use 3-5 sentences per section."""

CONTRADICTIONS_PROMPT = """Compare these research paper summaries and identify any contradictions or conflicting claims.

{summaries_text}

Look for:
- Conflicting experimental results on the same benchmark
- Opposite conclusions about a method's effectiveness
- Disagreements about dataset characteristics
- Conflicting claims about state-of-the-art performance

Return a JSON array of contradictions in this format:
[{{"paper_a": "id1", "paper_b": "id2", "claim_a": "...", "claim_b": "...", "topic": "..."}}]

If no contradictions found, return: []"""

OVERVIEW_PROMPT = """You are writing a structured research overview for a scientist.

Topic: {query}

Papers analyzed:
{papers_list}

Summaries:
{summaries_text}

Contradictions found:
{contradictions_text}

Write a comprehensive research overview with these sections:

## Research Landscape
Brief overview of the field and why this topic matters.

## Key Themes
The main research directions and recurring themes across papers.

## Methodological Approaches
Common and novel methods used across the papers.

## Key Findings
The most important results and contributions.

## Open Questions & Contradictions
Unresolved debates, contradictions, and gaps in the literature.

## Recommended Reading
The 3 most important papers and why.

Use inline citations like [paper_id] when referencing specific papers."""
