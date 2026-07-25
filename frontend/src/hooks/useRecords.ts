import { useState, useCallback } from "react";

/**
 * RecordFilters - All available filter options
 */
export interface RecordFilters {
  q?: string; // search query
  year?: number; // burial year
  month?: number; // burial month (1-12)
  gender?: "MALE" | "FEMALE" | "UNKNOWN"; // gender filter
  ageMin?: number; // minimum age
  ageMax?: number; // maximum age
  page?: number; // pagination page
  limit?: number; // records per page
  sortBy?: string; // sort column
  sortDir?: "asc" | "desc"; // sort direction
}

/**
 * RecordRow - Single record from database
 */
export interface RecordRow {
  id: string;
  srNo?: number;
  name: string;
  ageText?: string;
  gender: "MALE" | "FEMALE" | "UNKNOWN";
  burialDate: string;
  burialDay?: string;
  burialTime?: string;
  deathDate?: string;
  deathTime?: string;
  misriDate?: string;
  relativeName?: string;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * PaginatedResponse - API response with pagination info
 */
export interface PaginatedResponse<T> {
  rows: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * useRecords - Manage records state with filtering and pagination
 * 
 * Features:
 * - Fetch records from API
 * - Apply filters (search, year, month, gender, age)
 * - Handle pagination
 * - Loading/error states
 * - Callback to refetch
 */
export function useRecords(token: string | null) {
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<RecordFilters>({});

  const limit = 50;

  /**
   * fetchRecords - Fetch from API with current filters
   */
  const fetchRecords = useCallback(async () => {
    if (!token) {
      setError("Not authenticated");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Build query string from filters
      const params = new URLSearchParams();
      if (filters.q) params.append("q", filters.q);
      if (filters.year) params.append("year", String(filters.year));
      if (filters.month) params.append("month", String(filters.month));
      if (filters.gender) params.append("gender", filters.gender);
      if (filters.ageMin !== undefined) params.append("ageMin", String(filters.ageMin));
      if (filters.ageMax !== undefined) params.append("ageMax", String(filters.ageMax));
      params.append("page", String(page));
      params.append("limit", String(limit));
      if (filters.sortBy) params.append("sortBy", filters.sortBy);
      if (filters.sortDir) params.append("sortDir", filters.sortDir);

      const res = await fetch(
        `http://localhost:4000/api/records?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `HTTP ${res.status}`);
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
  }, [token, page, filters, limit]);

  return {
    records,
    total,
    page,
    limit,
    loading,
    error,
    setPage,
    setFilters,
    fetchRecords,
  };
}
