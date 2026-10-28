"use client";
import { useEffect, useRef, useState } from "react";
export default function Graph() {
  const ref = useRef<HTMLDivElement>(null);
  const [rate, setRate] = useState(-0.5),
    [initial, setInitial] = useState(3),
    [model, setModel] = useState("exponential"),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    let dispose: (() => void) | undefined;
    async function draw() {
      try {
        const Plotly = (await import("plotly.js-dist-min")).default;
        if (!active || !ref.current) return;
        const x = Array.from({ length: 201 }, (_, i) => i / 25);
        const y = x.map((t) =>
          model === "oscillation"
            ? initial * Math.cos(rate * t)
            : model === "cooling"
              ? 20 + (initial - 20) * Math.exp(-Math.abs(rate) * t)
              : initial * Math.exp(rate * t),
        );
        await Plotly.newPlot(
          ref.current,
          [
            {
              x,
              y,
              type: "scatter",
              mode: "lines",
              line: { color: "#8b7bff", width: 3 },
              fill: "tozeroy",
              fillcolor: "rgba(139,123,255,0.07)",
              name: "y(x)",
            },
          ],
          {
            paper_bgcolor: "transparent",
            plot_bgcolor: "transparent",
            font: { color: "#939bb0" },
            margin: { t: 20, r: 20, b: 45, l: 50 },
            xaxis: {
              title: { text: "x — време" },
              gridcolor: "#282d3d",
              zerolinecolor: "#42475a",
            },
            yaxis: {
              title: { text: "y(x)" },
              gridcolor: "#282d3d",
              zerolinecolor: "#42475a",
            },
            autosize: true,
          },
          { responsive: true, displaylogo: false },
        );
        dispose = () => {
          if (ref.current) Plotly.purge(ref.current);
        };
      } catch {
        setError("Графиката не може да се зареди.");
      }
    }
    draw();
    return () => {
      active = false;
      dispose?.();
    };
  }, [rate, initial, model]);
  return (
    <div className="panel graph-panel">
      <div className="panel-heading">
        <h3>Изследвай модела</h3>
        <span className="tag">Интерактивно</span>
      </div>
      <label>
        Модел
        <select value={model} onChange={(e) => setModel(e.target.value)}>
          <option value="exponential">Експоненциален растеж / затихване</option>
          <option value="oscillation">Хармонично трептене</option>
          <option value="cooling">Охлаждане (Tₐ = 20)</option>
        </select>
      </label>
      <div className="sliders">
        <label>
          Параметър k = {rate.toFixed(1)}
          <input
            aria-label="Параметър k"
            type="range"
            min={-1}
            max={1}
            step={0.1}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
          />
        </label>
        <label>
          Начална стойност = {initial}
          <input
            aria-label="Начална стойност"
            type="range"
            min={0}
            max={80}
            step={1}
            value={initial}
            onChange={(e) => setInitial(Number(e.target.value))}
          />
        </label>
      </div>
      {error ? <p role="alert">{error}</p> : <div ref={ref} className="plot" />}
      <code>
        {model === "oscillation"
          ? `y = ${initial} cos(${rate} x)`
          : model === "cooling"
            ? `T = 20 + (${initial}-20) exp(-${Math.abs(rate)} x)`
            : `y = ${initial} exp(${rate} x)`}
      </code>
      <p className="muted">
        Графиката е изчислена по аналитичната формула в браузъра. Не използва
        Wolfram изпълнение.
      </p>
    </div>
  );
}
