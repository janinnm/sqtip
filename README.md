# SQTip

Visual SQL query analyzer — analyze and compare queries with execution flow diagrams.

## What it does

SQTip helps developers and learners understand what their SQL queries are actually doing. Paste a query to get a visual execution flow diagram, static warnings, and an AI-powered plain-English analysis. Use compare mode to put two queries side by side and find out which one is better and why.

## Stack

- **Backend** — Django, Django REST Framework
- **Frontend** — Next.js, TypeScript, Tailwind CSS
- **Diagram** — ReactFlow
- **AI** — Ollama

## Getting Started

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add your ANTHROPIC_API_KEY
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Visit `http://localhost:3000`.

## Environment Variables

**backend/.env**
```
ANTHROPIC_API_KEY=your_key_here
DJANGO_SECRET_KEY=your_secret_key
DEBUG=True
MOCK_MODE=False
```

**frontend/.env.local**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Mock Mode

Set `MOCK_MODE=True` in your backend `.env` to run without an Anthropic API key. Useful for frontend development and testing.

## Roadmap

- **EXPLAIN metrics** — integrate MySQL/PostgreSQL EXPLAIN output to surface real execution data: rows scanned, index usage, access type, filesort detection, and filtered row percentage
- **Data size context** — let users provide approximate row counts per table so the analysis can give quantitative cost estimates (e.g. "full table scan on ~500k rows")
- **UI improvements** — refine the layout, diagram interactions, and overall visual polish

## License

MIT
