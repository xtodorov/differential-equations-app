"use client";
import Editor, { loader } from "@monaco-editor/react";
loader.config({ paths: { vs: "/monaco/vs" } });
export default function CodeEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="editor-wrap">
      <Editor
        height="200px"
        language="wolfram"
        theme="vs-dark"
        value={value}
        onChange={(v) => onChange(v || "")}
        loading={<p>Зареждане на редактора…</p>}
        beforeMount={(monaco) => {
          if (
            !monaco.languages
              .getLanguages()
              .some((l: { id: string }) => l.id === "wolfram")
          ) {
            monaco.languages.register({ id: "wolfram" });
            monaco.languages.setMonarchTokensProvider("wolfram", {
              tokenizer: {
                root: [
                  [/\(\*.*?\*\)/, "comment"],
                  [
                    /\b(?:DSolveValue|DSolve|NDSolveValue|D|Integrate|Sin|Cos|Exp|Log|Solve|Sqrt|Plot|Clear|N|Expand|Factor|Simplify)\b/,
                    "keyword",
                  ],
                  [/[A-Z][a-zA-Z]*/, "type"],
                  [/\d+/, "number"],
                  [/[\[\]{}()]/, "delimiter.bracket"],
                  [/==|:=|->|\/\./, "operator"],
                ],
              },
            });
            monaco.languages.setLanguageConfiguration("wolfram", {
              brackets: [
                ["[", "]"],
                ["{", "}"],
                ["(", ")"],
              ],
              autoClosingPairs: [
                { open: "[", close: "]" },
                { open: "{", close: "}" },
                { open: "(", close: ")" },
              ],
            });
          }
        }}
        options={{
          minimap: { enabled: false },
          fontSize: 15,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          padding: { top: 16 },
          ariaLabel: "Wolfram Language код",
        }}
      />
      <label className="editor-accessible">
        Обикновен редактор (достъпен и без Monaco)
        <textarea
          aria-label="Wolfram отговор"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
        />
      </label>
    </div>
  );
}
