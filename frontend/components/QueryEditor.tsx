"use client";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { EditorView } from "@codemirror/view";
import {
  syntaxHighlighting,
  defaultHighlightStyle,
} from "@codemirror/language";

const darkTheme = EditorView.theme(
  {
    "&": { background: "var(--surface-1) !important", color: "var(--text)" },
    ".cm-content": { caretColor: "var(--accent)" },
    ".cm-cursor": { borderLeftColor: "var(--accent)" },
    ".cm-activeLine": { background: "var(--surface-2)" },
    ".cm-gutters": {
      background: "var(--surface-1)",
      borderRight: "1px solid var(--border)",
      color: "var(--text-dim)",
    },
    ".cm-activeLineGutter": { background: "var(--surface-2)" },
    ".cm-selectionBackground": { background: "var(--accent-dim) !important" },
    "&.cm-focused .cm-selectionBackground": {
      background: "var(--accent-dim) !important",
    },
    ".cm-keyword": { color: "#60a5fa !important" }, // Blue for SQL keywords in dark mode
    ".cm-sql-keyword": { color: "#60a5fa !important" }, // Additional SQL keyword class
  },
  { dark: true },
);

const lightTheme = EditorView.theme(
  {
    "&": { background: "var(--surface-1) !important", color: "var(--text)" },
    ".cm-content": { caretColor: "var(--accent)" },
    ".cm-cursor": { borderLeftColor: "var(--accent)" },
    ".cm-activeLine": { background: "var(--surface-2)" },
    ".cm-gutters": {
      background: "var(--surface-1)",
      borderRight: "1px solid var(--border)",
      color: "var(--text-dim)",
    },
    ".cm-activeLineGutter": { background: "var(--surface-2)" },
    ".cm-selectionBackground": { background: "var(--accent-dim) !important" },
    "&.cm-focused .cm-selectionBackground": {
      background: "var(--accent-dim) !important",
    },
    ".cm-keyword": { color: "#2563eb !important" }, // Darker blue for SQL keywords in light mode
    ".cm-sql-keyword": { color: "#2563eb !important" }, // Additional SQL keyword class
  },
  { dark: false },
);

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  theme?: "dark" | "light";
}

export default function QueryEditor({
  value,
  onChange,
  placeholder,
  theme = "dark",
}: Props) {
  return (
    <div
      style={{
        height: "100%",
        background: "var(--surface-1)",
        borderRadius: "6px",
        overflow: "hidden",
      }}
    >
      <CodeMirror
        value={value}
        height="100%"
        extensions={[
          sql(),
          syntaxHighlighting(defaultHighlightStyle),
          theme === "dark" ? darkTheme : lightTheme,
        ]}
        onChange={onChange}
        placeholder={placeholder}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          foldGutter: false,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: true,
          syntaxHighlighting: true,
          bracketMatching: true,
          autocompletion: true,
          rectangularSelection: false,
          crosshairCursor: false,
          highlightActiveLine: true,
          highlightSelectionMatches: false,
          closeBrackets: true,
          searchKeymap: false,
          historyKeymap: true,
        }}
      />
    </div>
  );
}
