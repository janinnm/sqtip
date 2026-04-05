"use client";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { EditorView } from "@codemirror/view";

const darkTheme = EditorView.theme(
  {
    "&": { background: "#111113 !important", color: "#e4e4e7" },
    ".cm-content": { caretColor: "#7c6af7" },
    ".cm-cursor": { borderLeftColor: "#7c6af7" },
    ".cm-activeLine": { background: "#18181b" },
    ".cm-gutters": {
      background: "#111113",
      borderRight: "1px solid #2a2a2f",
      color: "#52525b",
    },
    ".cm-activeLineGutter": { background: "#18181b" },
    ".cm-selectionBackground": { background: "#4a3fa0 !important" },
    "&.cm-focused .cm-selectionBackground": {
      background: "#4a3fa0 !important",
    },
  },
  { dark: true },
);

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export default function QueryEditor({ value, onChange, placeholder }: Props) {
  return (
    <div
      style={{
        height: "100%",
        background: "#111113",
        borderRadius: "6px",
        overflow: "hidden",
      }}
    >
      <CodeMirror
        value={value}
        height="100%"
        extensions={[sql(), darkTheme]}
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
