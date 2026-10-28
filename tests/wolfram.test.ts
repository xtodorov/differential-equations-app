import { describe, it, expect } from "vitest";
import {
  validateWolfram,
  tokens,
  UnavailableWolframProvider,
} from "../src/lib/wolfram";
import { curriculum } from "../src/lib/content";
describe("offline Wolfram validator", () => {
  it("accepts whitespace without destroying token boundaries", () => {
    expect(validateWolfram("Sqrt [ 9 ]", "Sqrt[9]").correct).toBe(true);
    expect(validateWolfram("S qrt[9]", "Sqrt[9]").correct).toBe(false);
  });
  it("rejects incorrect casing and delimiters", () => {
    for (const code of ["sqrt[9]", "Sqrt(9)", "Sqrt[9}", 'Sqrt[9];Run["x"]'])
      expect(validateWolfram(code, "Sqrt[9]").correct).toBe(false);
  });
  it("distinguishes assignment and equality", () => {
    expect(validateWolfram("x=2", "x==2").correct).toBe(false);
  });
  it("rejects unbalanced and unsupported tokens", () => {
    expect(tokens("D[x")).toBeNull();
    expect(tokens('Run["bad"]')).toBeNull();
  });
  it("validates all curated Wolfram answers", () => {
    for (const l of curriculum)
      for (const e of l.exercises.filter((e) => e.kind === "wolfram"))
        expect(validateWolfram(e.answer, e.answer).correct).toBe(true);
  });
  it("does not imply connected execution exists", async () => {
    await expect(
      new UnavailableWolframProvider().execute("1+1"),
    ).rejects.toThrow("не е свързан");
  });
});
describe("curriculum integrity", () => {
  it("contains the required seed coverage and meaningful exercises", () => {
    expect(curriculum).toHaveLength(23);
    expect(curriculum.filter((l) => l.track === "math")).toHaveLength(12);
    expect(curriculum.filter((l) => l.track === "wolfram")).toHaveLength(9);
    expect(curriculum.filter((l) => l.track === "combined")).toHaveLength(2);
    const ids = new Set<string>();
    for (const l of curriculum) {
      expect(l.content.theory.join("").length).toBeGreaterThan(200);
      expect(l.exercises).toHaveLength(3);
      for (const e of l.exercises) {
        expect(ids.has(e.id)).toBe(false);
        ids.add(e.id);
        expect(e.hints).toHaveLength(3);
        expect(e.explanation.length).toBeGreaterThan(15);
      }
    }
  });
});

describe("mathematical notation", () => {
  it("retains LaTeX derivative commands in lesson data", () => {
    expect(
      curriculum.find((l) => l.id === "separable")?.content.formula,
    ).toContain("\\prime");
    expect(curriculum.find((l) => l.id === "chain")?.content.formula).toContain(
      "\\prime",
    );
  });
});
