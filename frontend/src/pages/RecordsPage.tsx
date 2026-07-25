import { useEffect, useState, useCallback } from "react";
import SearchBar from "../components/SearchBar";
import FilterPanel from "../components/FilterPanel";
import RecordTable from "../components/RecordTable";
import RecordForm, { CreateRecordInput } from "../components/RecordForm";
import { useRecords, type RecordRow, type RecordFilters } from "../hooks/useRecords";

interface RecordsPageProps {
  token: string | null;
  user?: { email: string; name: string; role: string };
  onLogout: () => void;
}

/**
 * RecordsPage - Main dashboard showing all records with search, filter, and CRUD
 * 
 * FIXED: useCallback prevents handlers from being recreated on every render
 * PREVENTS: Infinite loop in child components (SearchBar, FilterPanel, etc.)
 */
export default function RecordsPage({
  token,
  user,
  onLogout,
}: RecordsPageProps) {
  const { records, total, page, limit, loading, error, setPage, setFilters, fetchRecords } =
    useRecords(token);

  const [sortBy, setSortBy] = useState("burialDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [showForm, setShowForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RecordRow | undefined>();
  const [formLoading, setFormLoading] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<RecordRow | null>(null);

  const isAdmin = user?.role === "ADMIN";
  const totalPages = Math.ceil(total / limit);

  // Fetch whenever token, page, sort, or filters change.
  // fetchRecords (from useRecords) is a useCallback keyed on [token, page, filters, limit],
  // so this effect re-runs any time one of those actually changes.
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // FIXED: useCallback prevents this from being recreated on every render
  const handleSearch = useCallback((query: string) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, q: query }));
  }, [setPage, setFilters]);

  // FIXED: useCallback prevents this from being recreated on every render
  const handleFilterChange = useCallback((newFilters: Partial<RecordFilters>) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, [setPage, setFilters]);

  const handleSort = (column: string, direction: "asc" | "desc") => {
    setSortBy(column);
    setSortDir(direction);
    setFilters((prev) => ({ ...prev, sortBy: column, sortDir: direction }));
  };

  const handleCreateClick = () => {
    setSelectedRecord(undefined);
    setShowForm(true);
  };

  const handleEditClick = (record: RecordRow) => {
    setSelectedRecord(record);
    setShowForm(true);
  };

  const handleDeleteClick = (record: RecordRow) => {
    setDeleteConfirm(record);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm || !token) return;

    try {
      const res = await fetch(
        `http://localhost:4000/api/records/${deleteConfirm.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Delete failed");

      setDeleteConfirm(null);
      await fetchRecords();
      alert("Record deleted successfully");
    } catch (err: any) {
      alert("Delete error: " + err.message);
    }
  };

  const handleFormSubmit = async (data: CreateRecordInput) => {
    if (!token) return;

    setFormLoading(true);
    try {
      const url = selectedRecord
        ? `http://localhost:4000/api/records/${selectedRecord.id}`
        : "http://localhost:4000/api/records";

      const method = selectedRecord ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Save failed");
      }

      setShowForm(false);
      setSelectedRecord(undefined);
      await fetchRecords();
      alert(
        selectedRecord
          ? "Record updated successfully"
          : "Record created successfully"
      );
    } catch (err: any) {
      throw new Error(err.message || "Save failed");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      {/* Header */}
      <header
        style={{
          background: "white",
          borderBottom: "1px solid #ddd",
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "24px" }}>📋 Death Records</h1>
        </div>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          {user && (
            <span style={{ fontSize: "14px", color: "#666" }}>
              👤 {user.name} ({user.role})
            </span>
          )}
          <button
            onClick={onLogout}
            style={{
              padding: "8px 16px",
              background: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <main style={{ padding: "24px" }}>
        {/* Admin Actions */}
        {isAdmin && (
          <div style={{ marginBottom: "20px" }}>
            <button
              onClick={handleCreateClick}
              style={{
                padding: "10px 20px",
                background: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              + New Record
            </button>
          </div>
        )}

        {/* Search Bar */}
        <SearchBar onSearch={handleSearch} />

        {/* Filter Panel */}
        <FilterPanel onFilterChange={handleFilterChange} />

        {/* Error Message */}
        {error && (
          <div
            style={{
              background: "#f8d7da",
              color: "#721c24",
              padding: "12px",
              borderRadius: "4px",
              marginBottom: "16px",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Stats */}
        <div
          style={{
            background: "white",
            padding: "16px",
            borderRadius: "4px",
            marginBottom: "16px",
            fontSize: "14px",
            color: "#666",
          }}
        >
          Showing {records.length === 0 ? 0 : (page - 1) * limit + 1} to{" "}
          {Math.min(page * limit, total)} of {total} records
          {loading && " (loading...)"}
        </div>

        {/* Table */}
        <div style={{ background: "white", borderRadius: "4px", overflow: "hidden" }}>
          {records.length > 0 ? (
            <RecordTable
              records={records}
              onSort={handleSort}
              onEdit={isAdmin ? handleEditClick : undefined}
              onDelete={isAdmin ? handleDeleteClick : undefined}
              canEdit={isAdmin}
              sortBy={sortBy}
              sortDir={sortDir}
            />
          ) : (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "#999",
              }}
            >
              📭 No records found
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              justifyContent: "center",
              gap: "8px",
              alignItems: "center",
            }}
          >
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1 || loading}
              style={{
                padding: "8px 12px",
                background: page === 1 ? "#e9ecef" : "#007BFF",
                color: page === 1 ? "#999" : "white",
                border: "none",
                borderRadius: "4px",
                cursor: page === 1 ? "default" : "pointer",
              }}
            >
              ← Previous
            </button>

            <span style={{ fontSize: "14px", color: "#666" }}>
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || loading}
              style={{
                padding: "8px 12px",
                background: page === totalPages ? "#e9ecef" : "#007BFF",
                color: page === totalPages ? "#999" : "white",
                border: "none",
                borderRadius: "4px",
                cursor: page === totalPages ? "default" : "pointer",
              }}
            >
              Next →
            </button>
          </div>
        )}
      </main>

      {/* Record Form Modal */}
      {showForm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <RecordForm
              record={selectedRecord}
              onSubmit={handleFormSubmit}
              onCancel={() => setShowForm(false)}
              loading={formLoading}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1001,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              maxWidth: "400px",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Delete Record?</h3>
            <p>
              Are you sure you want to delete the record for{" "}
              <strong>{deleteConfirm.name}</strong>? This can be restored later.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={handleDeleteConfirm}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}