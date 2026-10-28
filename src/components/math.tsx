"use client";
import katex from "katex";
export function Formula({ tex }: { tex: string }) {
  let html = "";
  try {
    html = katex.renderToString(tex, {
      throwOnError: false,
      displayMode: true,
      trust: false,
    });
  } catch {
    html = "";
  }
  return <div className="formula" dangerouslySetInnerHTML={{ __html: html }} />;
}
