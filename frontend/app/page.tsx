"use client";
import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import AnalysisPanel from "@/components/AnalysisPanel";

const QueryEditor = dynamic(() => import("@/components/QueryEditor"), {
  ssr: false,
});
const FlowDiagram = dynamic(() => import("@/components/FlowDiagram"), {
  ssr: false,
});

const API = process.env.NEXT_PUBLIC_API_URL;

const SAMPLE_SINGLE = `SELECT u.name, COUNT(o.id) as order_count
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.country = 'PH'
GROUP BY u.name
ORDER BY order_count DESC;`;

const SAMPLE_A = `SELECT u.name
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.status = 'completed';`;

const SAMPLE_B = `SELECT name
FROM users
WHERE id IN (
  SELECT user_id FROM orders
  WHERE status = 'completed'
);`;

type Mode = "single" | "compare";

type Theme = "dark" | "light";

interface Structure {
  nodes: any[];
  edges: any[];
  warnings: string[];
  estimated_cost: string;
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("single");
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = window.localStorage.getItem("sqtip-theme");
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("sqtip-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  // Single mode
  const [sql, setSql] = useState(SAMPLE_SINGLE);
  const [structure, setStructure] = useState<Structure | null>(null);
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);

  // Compare mode
  const [sql1, setSql1] = useState(SAMPLE_A);
  const [sql2, setSql2] = useState(SAMPLE_B);
  const [structureA, setStructureA] = useState<Structure | null>(null);
  const [structureB, setStructureB] = useState<Structure | null>(null);
  const [comparison, setComparison] = useState("");
  const [loadingCompare, setLoadingCompare] = useState(false);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setAnalysis("");
    try {
      const res = await fetch(`${API}/api/analyze/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAnalysis(`❌ ${data.error}`);
        setStructure(null);
      } else {
        setStructure(data.structure);
        setAnalysis(data.analysis);
      }
    } catch (e) {
      setAnalysis("Error connecting to backend. Make sure Django is running.");
      setStructure(null);
    }
    setLoading(false);
  }, [sql]);

  const runComparison = useCallback(async () => {
    setLoadingCompare(true);
    setComparison("");
    try {
      const res = await fetch(`${API}/api/compare/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql1, sql2 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setComparison(`❌ ${data.error}`);
        setStructureA(null);
        setStructureB(null);
      } else {
        setStructureA(data.query_a.structure);
        setStructureB(data.query_b.structure);
        setComparison(data.comparison);
      }
    } catch (e) {
      setComparison(
        "Error connecting to backend. Make sure Django is running.",
      );
      setStructureA(null);
      setStructureB(null);
    }
    setLoadingCompare(false);
  }, [sql1, sql2]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          sq<span className="brand-accent">tip</span>
        </div>

        <div className="mode-toggle">
          {(["single", "compare"] as Mode[]).map((m) => (
            <button
              key={m}
              className={`toggle-button ${mode === m ? "active" : ""}`}
              onClick={() => setMode(m)}
              type="button"
            >
              {m === "single" ? "Analyze" : "Compare"}
            </button>
          ))}
        </div>

        <button className="theme-toggle" onClick={toggleTheme} type="button">
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
      </header>

      {mode === "single" && (
        <div className="main-grid">
          <div className="panel-card full-height">
            <div className="panel-header">
              <span className="panel-title">SQL query</span>
              <button
                className="theme-toggle"
                onClick={runAnalysis}
                type="button"
                disabled={loading}
              >
                {loading ? "Analyzing..." : "Analyze →"}
              </button>
            </div>
            <div className="panel-body">
              <QueryEditor
                value={sql}
                onChange={setSql}
                placeholder="Write your SQL query here..."
                theme={theme}
              />
            </div>
          </div>

          <div className="panel-card full-height">
            <div className="panel-header">
              <span className="panel-title">Execution flow</span>
              {structure && (
                <span className="status-chip">
                  {structure.estimated_cost} cost
                </span>
              )}
            </div>
            <div className="panel-body">
              <FlowDiagram
                nodes={structure?.nodes || []}
                edges={structure?.edges || []}
              />
            </div>
          </div>

          <div className="panel-card full-height">
            <div className="panel-header">
              <span className="panel-title">Static warnings</span>
            </div>
            <div className="panel-body panel-scroll">
              {structure?.warnings?.length ? (
                structure.warnings.map((w, i) => (
                  <div key={i} className="panel-warning">
                    {w}
                  </div>
                ))
              ) : (
                <p className="empty-state">
                  {structure
                    ? "No warnings detected"
                    : "Run a query to see warnings"}
                </p>
              )}
            </div>
          </div>

          <div className="panel-card full-height">
            <div className="panel-header">
              <span className="panel-title">AI analysis</span>
            </div>
            <div className="panel-body">
              <AnalysisPanel analysis={analysis} loading={loading} />
            </div>
          </div>
        </div>
      )}

      {mode === "compare" && (
        <div className="main-grid">
          <div className="panel-card full-height">
            <div className="panel-header">
              <span className="panel-title">Query A</span>
            </div>
            <div className="panel-body">
              <QueryEditor
                value={sql1}
                onChange={setSql1}
                placeholder="First query"
                theme={theme}
              />
            </div>
          </div>

          <div className="panel-card full-height">
            <div className="panel-header">
              <span className="panel-title">Query B</span>
              <button
                className="theme-toggle"
                onClick={runComparison}
                type="button"
                disabled={loadingCompare}
              >
                {loadingCompare ? "Comparing..." : "Compare →"}
              </button>
            </div>
            <div className="panel-body">
              <QueryEditor
                value={sql2}
                onChange={setSql2}
                placeholder="Second query"
                theme={theme}
              />
            </div>
          </div>

          <div className="panel-card full-height">
            <div className="panel-header">
              <span className="panel-title">Comparison</span>
            </div>
            <div className="panel-body panel-scroll">
              <p className="empty-state">
                {comparison || "Run comparison to see the diff"}
              </p>
            </div>
          </div>

          <div className="panel-card full-height">
            <div className="panel-header">
              <span className="panel-title">Analysis</span>
            </div>
            <div className="panel-body">
              <AnalysisPanel analysis={comparison} loading={loadingCompare} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
