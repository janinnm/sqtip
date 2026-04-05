import sqlparse
from sqlparse.sql import IdentifierList, Identifier, Where, Comparison
from sqlparse.tokens import Keyword, DML, Punctuation
import re


def extract_query_structure(sql: str) -> dict:
    """
    Parse SQL and extract structural components for diagram generation.
    Returns a dict with tables, joins, filters, aggregations, etc.
    """
    parsed = sqlparse.parse(sql.strip())
    if not parsed:
        return {}

    stmt = parsed[0]
    flat_tokens = [t for t in stmt.flatten()]

    structure = {
        "type": stmt.get_type() or "SELECT",
        "tables": [],
        "joins": [],
        "filters": [],
        "aggregations": [],
        "groupby": [],
        "orderby": [],
        "subqueries": [],
        "has_select_star": False,
        "selected_columns": [],
        "estimated_cost": "medium",
        "warnings": [],
        "nodes": [],
        "edges": [],
    }

    sql_upper = sql.upper()

    # Detect SELECT *
    if re.search(r'SELECT\s+\*', sql_upper):
        structure["has_select_star"] = True
        structure["warnings"].append("SELECT * fetches all columns — consider selecting only what you need")

    # Extract selected columns
    select_match = re.search(r'SELECT\s+(.*?)\s+FROM', sql_upper, re.DOTALL)
    if select_match:
        cols_raw = select_match.group(1)
        cols = [c.strip() for c in cols_raw.split(',')]
        structure["selected_columns"] = cols[:8]  # limit

    # Extract tables from FROM clause
    from_match = re.search(r'FROM\s+([\w,\s]+?)(?:\s+(?:JOIN|WHERE|GROUP|ORDER|LIMIT|$))', sql_upper)
    if from_match:
        tables_raw = from_match.group(1)
        tables = [t.strip() for t in re.split(r'\s*,\s*', tables_raw) if t.strip()]
        structure["tables"] = tables

    # Extract JOINs
    join_pattern = re.finditer(
        r'((?:LEFT|RIGHT|INNER|OUTER|FULL|CROSS)?\s*JOIN)\s+(\w+)(?:\s+\w+)?\s+ON\s+([\w\s.=\'\"]+?)(?=\s+(?:JOIN|WHERE|GROUP|ORDER|LIMIT|$))',
        sql_upper,
        re.DOTALL
    )
    for match in join_pattern:
        join_type = match.group(1).strip()
        table = match.group(2).strip()
        condition = match.group(3).strip()
        structure["joins"].append({
            "type": join_type,
            "table": table,
            "condition": condition[:60],
        })
        if table not in structure["tables"]:
            structure["tables"].append(table)

    # Extract WHERE filters
    where_match = re.search(r'WHERE\s+(.*?)(?:\s+(?:GROUP|ORDER|LIMIT|$))', sql_upper, re.DOTALL)
    if where_match:
        filters_raw = where_match.group(1).strip()
        conditions = re.split(r'\s+AND\s+|\s+OR\s+', filters_raw)
        structure["filters"] = [c.strip()[:80] for c in conditions if c.strip()]

    # Extract aggregations
    agg_funcs = ['COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'GROUP_CONCAT', 'STRING_AGG']
    for func in agg_funcs:
        if func in sql_upper:
            match = re.search(rf'{func}\s*\([^)]+\)', sql_upper)
            if match:
                structure["aggregations"].append(match.group(0))

    # Extract GROUP BY
    group_match = re.search(r'GROUP\s+BY\s+(.*?)(?:\s+(?:HAVING|ORDER|LIMIT|$))', sql_upper, re.DOTALL)
    if group_match:
        cols = [c.strip() for c in group_match.group(1).split(',')]
        structure["groupby"] = cols

    # Extract ORDER BY
    order_match = re.search(r'ORDER\s+BY\s+(.*?)(?:\s+(?:LIMIT|$))', sql_upper, re.DOTALL)
    if order_match:
        cols = [c.strip() for c in order_match.group(1).split(',')]
        structure["orderby"] = cols

    # Detect subqueries
    subquery_count = len(re.findall(r'\(\s*SELECT', sql_upper))
    if subquery_count > 0:
        structure["subqueries"] = [f"Subquery #{i+1}" for i in range(subquery_count)]
        structure["warnings"].append(f"{subquery_count} subquery/subqueries detected — may cause repeated scans")

    # Estimate cost
    cost_score = 0
    cost_score += len(structure["tables"]) * 1
    cost_score += len(structure["joins"]) * 2
    cost_score += len(structure["subqueries"]) * 3
    cost_score += 1 if structure["has_select_star"] else 0
    cost_score += 1 if not structure["filters"] else 0

    if cost_score <= 2:
        structure["estimated_cost"] = "low"
    elif cost_score <= 5:
        structure["estimated_cost"] = "medium"
    else:
        structure["estimated_cost"] = "high"

    # Build execution nodes for diagram
    structure["nodes"] = _build_nodes(structure)
    structure["edges"] = _build_edges(structure)

    return structure


def _build_nodes(structure: dict) -> list:
    nodes = []
    node_id = 0

    # Table scan nodes
    for table in structure["tables"]:
        nodes.append({
            "id": f"scan_{node_id}",
            "type": "scan",
            "label": f"Scan",
            "sublabel": table.lower(),
            "cost": "low" if structure["filters"] else "high",
        })
        node_id += 1

    # Filter node
    if structure["filters"]:
        nodes.append({
            "id": "filter",
            "type": "filter",
            "label": "Filter",
            "sublabel": f"{len(structure['filters'])} condition{'s' if len(structure['filters']) > 1 else ''}",
            "cost": "low",
        })

    # Subquery nodes
    for i, sq in enumerate(structure["subqueries"]):
        nodes.append({
            "id": f"subquery_{i}",
            "type": "subquery",
            "label": "Subquery",
            "sublabel": f"nested scan #{i+1}",
            "cost": "high",
        })

    # Join node
    if structure["joins"]:
        for j in structure["joins"]:
            nodes.append({
                "id": f"join_{node_id}",
                "type": "join",
                "label": j["type"].title(),
                "sublabel": f"on {j['condition'][:40].lower()}",
                "cost": "medium",
            })
            node_id += 1

    # Aggregation node
    if structure["aggregations"]:
        nodes.append({
            "id": "aggregate",
            "type": "aggregate",
            "label": "Aggregate",
            "sublabel": ", ".join([a[:20].lower() for a in structure["aggregations"][:2]]),
            "cost": "medium",
        })

    # Group by node
    if structure["groupby"]:
        nodes.append({
            "id": "groupby",
            "type": "groupby",
            "label": "Group By",
            "sublabel": ", ".join([c.lower() for c in structure["groupby"][:3]]),
            "cost": "medium",
        })

    # Order by node
    if structure["orderby"]:
        nodes.append({
            "id": "orderby",
            "type": "sort",
            "label": "Sort",
            "sublabel": ", ".join([c.lower() for c in structure["orderby"][:3]]),
            "cost": "medium",
        })

    # Output node
    nodes.append({
        "id": "output",
        "type": "output",
        "label": "Output",
        "sublabel": f"{len(structure['selected_columns'])} column{'s' if len(structure['selected_columns']) != 1 else ''}",
        "cost": "low",
    })

    return nodes


def _build_edges(structure: dict) -> list:
    edges = []
    nodes = structure["nodes"]
    if not nodes:
        return edges

    # Simple linear edges connecting nodes in order
    for i in range(len(nodes) - 1):
        edges.append({
            "from": nodes[i]["id"],
            "to": nodes[i + 1]["id"],
        })

    return edges