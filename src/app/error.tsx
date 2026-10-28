"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="auth-main" style={{ minHeight: "100vh" }}>
      <div className="panel unavailable">
        <h1>Възникна неочаквана грешка</h1>
        <p>
          Опитай отново след малко. Ако проблемът продължи, провери дали
          услугите са стартирани.
        </p>
        <button className="button primary" onClick={reset}>
          Опитай отново
        </button>
      </div>
    </main>
  );
}
