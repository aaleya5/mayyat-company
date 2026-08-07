import { useEffect, useState, useCallback } from "react";
import SearchBar from "../components/SearchBar";
import FilterPanel from "../components/FilterPanel";
import RecordTable from "../components/RecordTable";
import RecordForm, { CreateRecordInput } from "../components/RecordForm";
import RecordDetail from "../components/RecordDetail";
import ToastStack, { type ToastData } from "../components/ToastStack";
import { useRecords, type RecordRow, type RecordFilters } from "../hooks/useRecords";

interface RecordsPageProps {
  token: string | null;
  user?: { email: string; name: string; role: string };
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
}: RecordsPageProps) {
  const { records, total, page, limit, loading, error, setPage, setFilters, fetchRecords } =
    useRecords(token);

  const [sortBy, setSortBy] = useState("burialDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [showForm, setShowForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RecordRow | undefined>();
  const [formLoading, setFormLoading] = useState(false);
  const [viewRecord, setViewRecord] = useState<RecordRow | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<RecordRow | null>(null);

  const [toasts, setToasts] = useState<ToastData[]>([]);
  const showToast = useCallback((message: string, variant: "success" | "error") => {
    setToasts((prev) => [...prev, { id: Date.now(), message, variant }]);
  }, []);
  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

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

  const handleViewClick = (record: RecordRow) => {
    setViewRecord(record);
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
      showToast("Record deleted successfully", "success");
    } catch (err: any) {
      showToast("Delete error: " + err.message, "error");
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
      showToast(
        selectedRecord ? "Record updated successfully" : "Record created successfully",
        "success"
      );
    } catch (err: any) {
      throw new Error(err.message || "Save failed");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <>
        {/* Admin Actions */}
        {isAdmin && (
          <div className="mb-5">
            <button
              onClick={handleCreateClick}
              className="bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-ink-light"
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
          <div className="mb-4 border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            ⚠️ {error}
          </div>
        )}

        {/* Stats */}
        <div className="mb-4 bg-surface px-4 py-3 text-sm text-muted">
          Showing {records.length === 0 ? 0 : (page - 1) * limit + 1} to{" "}
          {Math.min(page * limit, total)} of {total} records
          {loading && " (loading...)"}
        </div>

        {/* Table */}
        <div className="overflow-hidden border border-border bg-surface">
          {records.length > 0 ? (
            <RecordTable
              records={records}
              onSort={handleSort}
              onView={handleViewClick}
              onEdit={isAdmin ? handleEditClick : undefined}
              onDelete={isAdmin ? handleDeleteClick : undefined}
              canEdit={isAdmin}
              sortBy={sortBy}
              sortDir={sortDir}
            />
          ) : (
            <div className="px-6 py-16 text-center text-muted">
              <p className="text-2xl">📭</p>
              <p className="mt-2">No records found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1 || loading}
              className="bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-ink-light disabled:cursor-default disabled:bg-border disabled:text-muted"
            >
              ← Previous
            </button>

            <span className="text-sm text-muted">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || loading}
              className="bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-ink-light disabled:cursor-default disabled:bg-border disabled:text-muted"
            >
              Next →
            </button>
          </div>
        )}

      {/* Record Detail Modal (read-only, available to all roles) */}
      {viewRecord && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-ink-dark/60 p-4">
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto bg-surface shadow-xl"
          >
            <RecordDetail record={viewRecord} onClose={() => setViewRecord(null)} />
          </div>
        </div>
      )}

      {/* Record Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-ink-dark/60 p-4">
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto bg-surface shadow-xl"
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
        <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-ink-dark/60 p-4">
          <div className="w-full max-w-sm bg-surface p-6 shadow-xl">
            <h3 className="font-display text-lg font-semibold text-ink-text">
              Delete Record?
            </h3>
            <p className="mt-2 text-sm text-muted">
              Are you sure you want to delete the record for{" "}
              <strong className="text-ink-text">{deleteConfirm.name}</strong>? This
              can be restored later.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 bg-danger px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-danger-light"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-border px-4 py-2.5 text-sm font-medium text-ink-text transition-colors hover:bg-paper"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}