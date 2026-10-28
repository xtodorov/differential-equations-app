"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BookOpen, Check, Sigma, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
export function AuthForm({ register }: { register: boolean }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const res = await fetch(`/api/auth/${register ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      window.location.href = "/dashboard";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Няма връзка със сървъра.");
      setBusy(false);
    }
  }
  return (
    <main className="auth-layout">
      <section className="auth-story">
        <Link className="brand" href="/">
          <span className="brand-icon">
            <Sigma />
          </span>
          MathForge<span className="brand-ai">AI</span>
        </Link>
        <div>
          <span className="eyebrow">
            <Sparkles size={14} /> ТВОЯТ ПЪТ КЪМ РАЗБИРАНЕТО
          </span>
          <h1>
            Сложните задачи.
            <br />
            <em>Ясните стъпки.</em>
          </h1>
          <p>
            От първата дроб до диференциалните уравнения. Изгради увереност с
            практика, която те учи да мислиш.
          </p>
          <div className="auth-formula">
            y′ = 2y <ArrowRight /> y = Ce<sup>2x</sup>
          </div>
          <ul>
            <li>
              <Check /> Истински уроци на български
            </li>
            <li>
              <Check /> Проверени математически отговори
            </li>
            <li>
              <Check /> Wolfram Language без нужда от лиценз
            </li>
          </ul>
        </div>
        <small>Малка стъпка днес. Голямо разбиране утре.</small>
      </section>
      <section className="auth-main">
        <div className="auth-card">
          <span className="square-icon">
            <BookOpen />
          </span>
          <h2>{register ? "Започни своя път" : "Добре дошъл отново"}</h2>
          <p>
            {register
              ? "Създай безплатен профил и учи със собствено темпо."
              : "Продължи оттам, докъдето стигна."}
          </p>
          <form
            method="post"
            action={register ? "/api/auth/register" : "/api/auth/login"}
            onSubmit={submit}
          >
            {register && (
              <label>
                Име
                <input
                  name="name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={80}
                  placeholder="Твоето име"
                />
              </label>
            )}
            <label>
              Имейл
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="student@example.com"
              />
            </label>
            <label>
              Парола
              <input
                name="password"
                type="password"
                autoComplete={register ? "new-password" : "current-password"}
                required
                minLength={register ? 12 : 1}
                maxLength={128}
                placeholder={register ? "Поне 12 знака" : "Твоята парола"}
              />
            </label>
            {error && (
              <div role="alert" className="error">
                {error}
              </div>
            )}
            <Button disabled={busy} type="submit">
              {busy ? "Момент…" : register ? "Създай профил" : "Влез в профила"}
              <ArrowRight size={17} />
            </Button>
          </form>
          <p className="auth-switch">
            {register ? "Вече имаш профил?" : "За първи път тук?"}{" "}
            <Link href={register ? "/login" : "/register"}>
              {register ? "Влез" : "Създай профил"}
            </Link>
          </p>
          <small>Учебният MVP е безплатен. Не е необходима карта.</small>
        </div>
      </section>
    </main>
  );
}
