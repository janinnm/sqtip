from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .sql_parser import extract_query_structure
from .claude_service import analyze_query, compare_queries
from django.conf import settings

MOCK_ANALYSIS = """
## What This Query Does
This query retrieves all users from the users table who are located in the Philippines, returning their name and email address.

## Execution Steps
1. Open and scan the `users` table
2. For each row, evaluate the WHERE condition `country = 'PH'`
3. Discard rows that don't match
4. Return the `name` and `email` columns for matching rows

## Performance Characteristics
This is a simple filtered scan. If `country` has no index, the database reads every row in the table (full table scan). On a small table this is fine, but at 100k+ rows it becomes expensive.

## Potential Issues
- No index on `country` column will cause a full table scan
- `SELECT *` is not used here which is good, but double check you need both columns

## Recommendations
1. Add an index on the `country` column: `CREATE INDEX idx_users_country ON users(country);`
2. If you only need one column, select only that one to reduce data transfer
"""

MOCK_COMPARISON = """
## What Both Queries Do
Both queries retrieve the names of users who have placed at least one order, just using different approaches.

## How They Differ
Query A uses a JOIN to combine the users and orders tables directly. Query B uses a subquery with IN to filter users based on a separate SELECT on the orders table.

## Query A Analysis
The JOIN approach is generally more efficient. The database can use indexes on both sides of the join condition and process rows in a single pass. Most query optimizers handle this well.

## Query B Analysis
The subquery with IN can be less efficient because the inner SELECT may be executed repeatedly or produce a large list. On small datasets the difference is negligible, but it scales poorly.

## Verdict
**Query A wins.** The JOIN is cleaner, more readable, and generally faster — especially as the orders table grows. Most SQL optimizers will handle it better than a subquery.

## Key Takeaway
Prefer JOINs over subqueries with IN when you're matching rows across two tables — they give the optimizer more to work with.
"""


class AnalyzeView(APIView):
    def post(self, request):
        sql = request.data.get("sql", "").strip()
        if not sql:
            return Response({"error": "SQL query is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            structure = extract_query_structure(sql)
            if getattr(settings, 'MOCK_MODE', False):
                analysis = MOCK_ANALYSIS
            else:
                analysis = analyze_query(sql, structure)
            return Response({"structure": structure, "analysis": analysis})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CompareView(APIView):
    def post(self, request):
        sql1 = request.data.get("sql1", "").strip()
        sql2 = request.data.get("sql2", "").strip()
        if not sql1 or not sql2:
            return Response({"error": "Both queries are required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            structure1 = extract_query_structure(sql1)
            structure2 = extract_query_structure(sql2)
            if getattr(settings, 'MOCK_MODE', False):
                comparison = MOCK_COMPARISON
            else:
                comparison = compare_queries(sql1, sql2, structure1, structure2)
            return Response({
                "query_a": {"structure": structure1},
                "query_b": {"structure": structure2},
                "comparison": comparison,
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)