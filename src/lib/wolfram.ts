export type PracticeResult = { correct: boolean; message: string };
// Only curated token sequences are accepted. Whitespace is insignificant, token
// boundaries are not: "S qrt" must never be accepted as "Sqrt".
export function tokens(code: string): string[] | null {
  if (code.length > 1000) return null;
  const out: string[] = [];
  let rest = code;
  while (rest.length) {
    const whitespace = rest.match(/^\s+/);
    if (whitespace) {
      rest = rest.slice(whitespace[0].length);
      continue;
    }
    const m = rest.match(
      /^(?:[A-Za-z$][A-Za-z0-9$]*|\d+(?:\.\d+)?|==|:=|->|\/\.|[\[\]{}(),+\-*/^'=;_])/,
    );
    if (!m) return null;
    out.push(m[0]);
    rest = rest.slice(m[0].length);
  }
  const stack: string[] = [];
  const pairs: Record<string, string> = { "]": "[", "}": "{", ")": "(" };
  for (const t of out) {
    if (["[", "{", "("].includes(t)) stack.push(t);
    if (pairs[t] && stack.pop() !== pairs[t]) return null;
  }
  return stack.length ? null : out;
}
export function validateWolfram(
  answer: string,
  expected: string,
): PracticeResult {
  const actual = tokens(answer),
    target = tokens(expected);
  if (!actual)
    return {
      correct: false,
      message: "Провери скобите и използвай само поддържания учебен синтаксис.",
    };
  const correct = JSON.stringify(actual) === JSON.stringify(target);
  return {
    correct,
    message: correct
      ? "Вярно! Записът съвпада с проверения учебен образец. Кодът не е изпълняван."
      : "Записът още не съответства на задачата. Провери името, скобите и аргументите. Учебният режим приема документирания образец.",
  };
}
export interface WolframProvider {
  mode: "practice" | "connected";
  execute(code: string): Promise<{ output: string; executed: boolean }>;
}
export class UnavailableWolframProvider implements WolframProvider {
  mode = "connected" as const;
  async execute(_code: string): Promise<{ output: string; executed: boolean }> {
    throw new Error(
      "Лицензиран Wolfram backend не е свързан. Използвай учебния режим.",
    );
  }
}
