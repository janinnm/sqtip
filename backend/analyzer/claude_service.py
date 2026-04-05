import anthropic
from django.conf import settings


def build_single_prompt(sql: str, structure: dict) -> str:
    warnings = "\n".join(f"- {w}" for w in structure.get("warnings", [])) or "None detected"
    joins = "\n".join(f"- {j['type']} on {j['condition']}" for j in structure.get("joins", [])) or "None"
    filters = "\n".join(f"- {f}" for f in structure.get("filters", [])) or "None"
    aggs = ", ".join(structure.get("aggregations", [])) or "None"

    return f"""You are a SQL performance educator. Analyze this SQL query for a developer or learner.

SQL Query:
```sql
{sql}
```

Parsed structure:
- Tables scanned: {', '.join(structure.get('tables', [])) or 'unknown'}
- Joins: {joins}
- Filters (WHERE): {filters}
- Aggregations: {aggs}
- GROUP BY: {', '.join(structure.get('groupby', [])) or 'none'}
- ORDER BY: {', '.join(structure.get('orderby', [])) or 'none'}
- Has SELECT *: {structure.get('has_select_star', False)}
- Subqueries: {len(structure.get('subqueries', []))}
- Estimated cost: {structure.get('estimated_cost', 'unknown')}
- Static warnings: {warnings}

Provide a clear, structured analysis with these exact sections:

## What This Query Does
2-3 sentences explaining what the query retrieves in plain English.

## Execution Steps
Numbered list of what the database actually does step by step to run this query.

## Performance Characteristics
What makes this query fast or slow. Be specific about which parts are expensive and why.

## Potential Issues
Any red flags, anti-patterns, or things to watch out for. If none, say so.

## Recommendations
1-3 concrete suggestions to improve this query. If it's already well-written, say so.

Keep explanations clear enough for a learner but precise enough for a developer. Avoid vague advice."""


def build_compare_prompt(sql1: str, sql2: str, structure1: dict, structure2: dict) -> str:
    return f"""You are a SQL performance educator. Compare these two SQL queries that accomplish the same goal.

Query A:
```sql
{sql1}
```

Query B:
```sql
{sql2}
```

Query A structure: tables={structure1.get('tables')}, joins={len(structure1.get('joins', []))}, filters={len(structure1.get('filters', []))}, subqueries={len(structure1.get('subqueries', []))}, cost={structure1.get('estimated_cost')}
Query B structure: tables={structure2.get('tables')}, joins={len(structure2.get('joins', []))}, filters={len(structure2.get('filters', []))}, subqueries={len(structure2.get('subqueries', []))}, cost={structure2.get('estimated_cost')}

Provide a structured comparison with these exact sections:

## What Both Queries Do
1-2 sentences confirming they accomplish the same thing (or noting if they differ).

## How They Differ
Key structural differences — how each query approaches the problem differently.

## Query A Analysis
Performance characteristics, strengths, and weaknesses of Query A.

## Query B Analysis
Performance characteristics, strengths, and weaknesses of Query B.

## Verdict
Which query is generally better and why. Be direct. If it depends on context (data size, indexes, etc.), explain what factors matter.

## Key Takeaway
One sentence a learner should remember from this comparison.

Be direct, specific, and educational. Avoid vague advice."""


def analyze_query(sql: str, structure: dict) -> str:
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    prompt = build_single_prompt(sql, structure)

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


def compare_queries(sql1: str, sql2: str, structure1: dict, structure2: dict) -> str:
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    prompt = build_compare_prompt(sql1, sql2, structure1, structure2)

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1200,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text