import { useState, useEffect } from "react";
import type { AuthUser, RecordRow, PaginatedResponse } from "@mayyat/shared";

interface RecordsPageProps {
  user: AuthUser;
  onLogout: () => void;
}

export default function RecordsPage({ user, onLogout }: RecordsPageProps) {
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const limit = 50;

  useEffect(() => {
    fetchRecords();
  }, [page]);

  const fetchRecords = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please log in again.");
        setLoading(false);
        return;
      }

      const res = await fetch(
        `http://localhost:4000/api/records?page=${page}&limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const data: PaginatedResponse<RecordRow> = await res.json();
      setRecords(data.rows || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to fetch records");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    onLogout();
  };

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>Death Records</h1>
        <div>
          <span style={{ marginRight: "16px" }}>Hello, {user.name}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {error && <div style={{ color: "#dc3545", marginBottom: "16px" }}>{error}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Burial Date</th>
                <th>Relative</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>{record.name}</td>
                  <td>{record.ageText || "–"}</td>
                  <td>{record.gender}</td>
                  <td>{record.burialDate}</td>
                  <td>{record.relativeName || "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>
              Page {page} of {Math.ceil(total / limit)} ({total} total)
            </span>
            <div>
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                style={{ marginRight: "8px" }}
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page * limit >= total}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}