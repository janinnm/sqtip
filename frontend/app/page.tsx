"use client";
import { useState, useCallback } from "react";
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

interface Structure {
  nodes: any[];
  edges: any[];
  warnings: string[];
  estimated_cost: string;
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("single");

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
      setStructure(data.structure);
      setAnalysis(data.analysis);
    } catch (e) {
      setAnalysis("Error connecting to backend. Make sure Django is running.");
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
      setStructureA(data.query_a.structure);
      setStructureB(data.query_b.structure);
      setComparison(data.comparison);
    } catch (e) {
      setComparison(
        "Error connecting to backend. Make sure Django is running.",
      );
    }
    setLoadingCompare(false);
  }, [sql1, sql2]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0b",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid #2a2a2f",
          padding: "0 24px",
          height: "52px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "22px",
              height: "22px",
              background: "#7c6af7",
              borderRadius: "5px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="2" fill="white" />
              <path
                d="M6 1v2M6 9v2M1 6h2M9 6h2"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span
            style={{
              fontWeight: 600,
              fontSize: "15px",
              letterSpacing: "-0.02em",
            }}
          >
            SQTip
          </span>
        </div>

        {/* Mode toggle */}
        <div
          style={{
            display: "flex",
            background: "#111113",
            border: "1px solid #2a2a2f",
            borderRadius: "6px",
            padding: "3px",
            gap: "2px",
          }}
        >
          {(["single", "compare"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: "5px 14px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 500,
                fontFamily: "DM Sans, sans-serif",
                background: mode === m ? "#7c6af7" : "transparent",
                color: mode === m ? "white" : "#71717a",
                transition: "all 0.15s",
              }}
            >
              {m === "single" ? "Analyze" : "Compare"}
            </button>
          ))}
        </div>

        <div style={{ width: "120px" }} />
      </header>

      {/* Single Mode */}
      {mode === "single" && (
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            gap: "1px",
            background: "#2a2a2f",
            overflow: "hidden",
            height: "calc(100vh - 52px)",
          }}
        >
          {/* Editor */}
          <div
            style={{
              background: "#0a0a0b",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                borderBottom: "1px solid #2a2a2f",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  color: "#52525b",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                }}
              >
                SQL Query
              </span>
              <button
                onClick={runAnalysis}
                disabled={loading}
                style={{
                  background: "#7c6af7",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  padding: "5px 14px",
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                {loading ? "Analyzing..." : "Analyze →"}
              </button>
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <QueryEditor
                value={sql}
                onChange={setSql}
                placeholder="Write your SQL query here..."
              />
            </div>
          </div>

          {/* Flow diagram */}
          <div
            style={{
              background: "#0a0a0b",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                borderBottom: "1px solid #2a2a2f",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  color: "#52525b",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                }}
              >
                Execution Flow
              </span>
              {structure && (
                <span
                  style={{
                    fontSize: "10px",
                    padding: "2px 8px",
                    borderRadius: "3px",
                    fontWeight: 500,
                    background:
                      structure.estimated_cost === "low"
                        ? "#10b98120"
                        : structure.estimated_cost === "high"
                          ? "#ef444420"
                          : "#f59e0b20",
                    color:
                      structure.estimated_cost === "low"
                        ? "#10b981"
                        : structure.estimated_cost === "high"
                          ? "#ef4444"
                          : "#f59e0b",
                  }}
                >
                  {structure.estimated_cost} cost
                </span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <FlowDiagram
                nodes={structure?.nodes || []}
                edges={structure?.edges || []}
              />
            </div>
          </div>

          {/* Warnings */}
          <div
            style={{
              background: "#0a0a0b",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                borderBottom: "1px solid #2a2a2f",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  color: "#52525b",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                }}
              >
                Static Warnings
              </span>
            </div>
            <div style={{ flex: 1, padding: "16px", overflowY: "auto" }}>
              {structure?.warnings?.length ? (
                structure.warnings.map((w, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginBottom: "10px",
                      padding: "10px 12px",
                      background: "#18181b",
                      borderRadius: "5px",
                      borderLeft: "3px solid #f59e0b",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#a1a1aa",
                        lineHeight: 1.5,
                      }}
                    >
                      {w}
                    </span>
                  </div>
                ))
              ) : (
                <p style={{ color: "#52525b", fontSize: "13px" }}>
                  {structure
                    ? "No warnings detected"
                    : "Run a query to see warnings"}
                </p>
              )}
            </div>
          </div>

          {/* Analysis */}
          <div
            style={{
              background: "#0a0a0b",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                borderBottom: "1px solid #2a2a2f",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  color: "#52525b",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                }}
              >
                AI Analysis
              </span>
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <AnalysisPanel analysis={analysis} loading={loading} />
            </div>
          </div>
        </div>
      )}

      {/* Compare Mode */}
      {mode === "compare" && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            height: "calc(100vh - 52px)",
          }}
        >
          {/* Top: two editors */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1px",
              background: "#2a2a2f",
              height: "240px",
              flexShrink: 0,
            }}
          >
            {[
              { label: "Query A", value: sql1, onChange: setSql1 },
              { label: "Query B", value: sql2, onChange: setSql2 },
            ].map(({ label, value, onChange }) => (
              <div
                key={label}
                style={{
                  background: "#0a0a0b",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "10px 14px",
                    borderBottom: "1px solid #2a2a2f",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#52525b",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      fontWeight: 600,
                    }}
                  >
                    {label}
                  </span>
                  {label === "Query B" && (
                    <button
                      onClick={runComparison}
                      disabled={loadingCompare}
                      style={{
                        background: "#7c6af7",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        padding: "5px 14px",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: loadingCompare ? "not-allowed" : "pointer",
                        opacity: loadingCompare ? 0.7 : 1,
                        fontFamily: "DM Sans, sans-serif",
                      }}
                    >
                      {loadingCompare ? "Comparing..." : "Compare →"}
                    </button>
                  )}
                </div>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <QueryEditor value={value} onChange={onChange} />
                </div>
              </div>
            ))}
          </div>

          {/* Middle: two diagrams */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1px",
              background: "#2a2a2f",
              flex: 1,
              overflow: "hidden",
            }}
          >
            {[
              { label: "Flow A", structure: structureA },
              { label: "Flow B", structure: structureB },
            ].map(({ label, structure }) => (
              <div
                key={label}
                style={{
                  background: "#0a0a0b",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "10px 14px",
                    borderBottom: "1px solid #2a2a2f",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#52525b",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      fontWeight: 600,
                    }}
                  >
                    {label}
                  </span>
                  {structure && (
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "2px 8px",
                        borderRadius: "3px",
                        fontWeight: 500,
                        background:
                          structure.estimated_cost === "low"
                            ? "#10b98120"
                            : structure.estimated_cost === "high"
                              ? "#ef444420"
                              : "#f59e0b20",
                        color:
                          structure.estimated_cost === "low"
                            ? "#10b981"
                            : structure.estimated_cost === "high"
                              ? "#ef4444"
                              : "#f59e0b",
                      }}
                    >
                      {structure.estimated_cost} cost
                    </span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <FlowDiagram
                    nodes={structure?.nodes || []}
                    edges={structure?.edges || []}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Bottom: comparison analysis */}
          <div
            style={{
              height: "260px",
              background: "#0a0a0b",
              borderTop: "1px solid #2a2a2f",
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                borderBottom: "1px solid #2a2a2f",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  color: "#52525b",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                }}
              >
                Comparison Analysis
              </span>
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <AnalysisPanel analysis={comparison} loading={loadingCompare} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
