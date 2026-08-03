import { useState } from "react";
import type { AuthUser } from "@mayyat/shared";

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      onLogin(data.user);
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full border border-border bg-surface px-3 py-2.5 text-sm text-ink-text placeholder:text-muted focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15 disabled:cursor-not-allowed disabled:bg-paper disabled:text-muted";
  const labelClass = "mb-1.5 block text-sm font-medium text-ink-text";

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 font-sans">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-ink">
            Mayyat
          </h1>
          <p className="mt-1 text-sm text-muted">
            Community Death Records Registry
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="border border-border bg-surface p-6 shadow-sm"
        >
          <div className="mb-4">
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@mayyat.local"
              required
              disabled={loading}
              className={inputClass}
            />
          </div>

          <div className="mb-5">
            <label className={labelClass}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              className={inputClass}
            />
          </div>

          {error && (
            <div className="mb-4 border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-ink-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
      </div>
    </div>
  );
}