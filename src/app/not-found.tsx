import Link from "next/link";
export default function NotFound() {
  return (
    <main className="auth-main" style={{ minHeight: "100vh" }}>
      <div className="panel unavailable">
        <span className="eyebrow">404</span>
        <h1>Тази страница не е намерена</h1>
        <p>
          Адресът може да е променен. Върни се към своето учебно пространство.
        </p>
        <Link className="button primary" href="/dashboard">
          Към моя преглед
        </Link>
      </div>
    </main>
  );
}
