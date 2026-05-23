import { useState, useEffect } from "react";
import type { AuthUser } from "@mayyat/shared";
import LoginPage from "./pages/LoginPage";
import RecordsPage from "./pages/RecordsPage";

function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists and is valid
    const token = localStorage.getItem("token");
    if (token) {
      // Try to fetch /api/auth/me to validate token
      fetch("http://localhost:4000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.user) setUser(data.user);
          else localStorage.removeItem("token");
        })
        .catch(() => localStorage.removeItem("token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return <RecordsPage user={user} onLogout={() => setUser(null)} />;
}

export default App;
