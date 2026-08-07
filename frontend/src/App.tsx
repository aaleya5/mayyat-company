import { useState, useEffect, Suspense, lazy } from "react";
import type { AuthUser } from "@mayyat/shared";
import LoginPage from "./pages/LoginPage";
import RecordsPage from "./pages/RecordsPage";
import Layout, { type AppView } from "./components/Layout";

// Lazy-loaded: recharts is a fairly heavy dependency, and only admins ever
// see this page. Without this, everyone - including VIEWER accounts who can
// never reach the Tally tab - would download it on initial page load.
const StatsPage = lazy(() => import("./pages/StatsPage"));

function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<AppView>("records");

  useEffect(() => {
    // Check if token exists and is valid
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      // Try to fetch /api/auth/me to validate token
      fetch("http://localhost:4000/api/auth/me", {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.user) {
            setUser(data.user);
            setToken(storedToken);
          } else {
            localStorage.removeItem("token");
          }
        })
        .catch(() => localStorage.removeItem("token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (loggedInUser: AuthUser) => {
    // LoginPage already wrote the token to localStorage before calling this
    setToken(localStorage.getItem("token"));
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setView("records");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper font-sans text-sm text-muted">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Layout user={user} onLogout={handleLogout} view={view} onNavigate={setView}>
      {view === "stats" ? (
        <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
          <StatsPage token={token} />
        </Suspense>
      ) : (
        <RecordsPage token={token} user={user} />
      )}
    </Layout>
  );
}

export default App;
