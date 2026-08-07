import { useState, useCallback, useEffect } from "react";

export interface TallyGridRow {
  year: number;
  months: Record<string, number>; // "Jan" -> count, etc.
  total: number;
}

export interface StatsResponse {
  totalRecords: number;
  yearsCovered: { first: number | null; last: number | null };
  byYear: Array<{ year: number; count: number }>;
  tallyGrid: TallyGridRow[];
  byGender: Array<{ gender: "MALE" | "FEMALE" | "UNKNOWN"; count: number }>;
  byAgeBracket: Array<{ bracket: string; count: number }>;
}

/**
 * useStats - Fetch the aggregate stats payload for the Tally Interface.
 * Mirrors useRecords' pattern (loading/error state, manual refetch).
 */
export function useStats(token: string | null) {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    if (!token) {
      setError("Not authenticated");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:4000/api/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const data: StatsResponse = await res.json();
      setStats(data);
    } catch (err: any) {
      console.error("Fetch stats error:", err);
      setError(err.message || "Failed to fetch stats");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, fetchStats };
}
