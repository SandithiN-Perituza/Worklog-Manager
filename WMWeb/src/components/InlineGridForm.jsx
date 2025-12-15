import React, { useCallback, useEffect, useRef, useState } from "react";
import { BsPencilSquare, BsFillTrashFill, BsClipboard2 } from "react-icons/bs";

const CLIENT_OPTIONS = ["Client A", "Client B", "Client C"];
const SOW_BY_CLIENT = {
  "Client A": ["SOW-A-001", "SOW-A-002", "SOW-A-003"],
  "Client B": ["SOW-B-101", "SOW-B-102", "SOW-B-103"],
  "Client C": ["SOW-C-201", "SOW-C-202", "SOW-C-203"],
};
const DEFAULT_SOWS = ["SOW-001", "SOW-002", "SOW-003"];
const HOUR_OPTIONS = Array.from({ length: 13 }, (_, i) => i); // 0-12 hours
const MINUTE_OPTIONS = [0, 15, 30, 45];

const todayIso = () => new Date().toISOString().slice(0, 10);

const emptyRow = (date = todayIso()) => ({
  id: crypto.randomUUID(),
  client: "",
  sowNo: "",
  changeRequestNo: "",
  setTime: "",
  workedItemDetails: "",
  date,
});

export default function InlineGridForm({ initialRows = [], selectedDate = null, onRowsChange = null }) {
  const STORAGE_KEY = "wm_inline_rows_v1";
  const [rows, setRows] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore parse errors and fall back
    }
    // Ensure rows have a date field
    const baseRows = initialRows.length ? initialRows : [emptyRow()];
    return baseRows.map((r) => ({ ...(r || {}), date: r?.date ?? todayIso() }));
  });
  
//   const commitDraft = () => {
//     if (!draft) return;
//     setRows((prev) => prev.map((r) => (r.id === draft.id ? draft : r)));
//   };
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const truncate = (text, max = 90) => {
    if (!text) return "-";
    return text.length > max ? `${text.slice(0, max)}…` : text;
  };

  const formatTime = (hours, minutes) => `${hours}h ${minutes}m`;
  const parseTime = (value) => {
    const match = /(?:(\d+)h)?\s*(?:(\d+)m)?/.exec(value || "");
    const h = Math.max(0, parseInt(match?.[1] ?? "0", 10) || 0);
    const m = Math.max(0, parseInt(match?.[2] ?? "0", 10) || 0);
    return { hours: h, minutes: m };
  };

  const computeTotalMinutes = (list) => {
    return list.reduce((acc, r) => {
      try {
        const { hours, minutes } = parseTime(r?.setTime ?? "");
        return acc + (hours * 60 + minutes);
      } catch {
        return acc;
      }
    }, 0);
  };

  const formatTotal = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const tableRef = useRef(null);
  const PAGE_SIZE = 5;
  const [page, setPage] = useState(1);

  const startRowEdit = (row) => {
    if (editingId && editingId !== row.id) {
      saveEdit();
    }
    setEditingId(row.id);
    setDraft({ ...row });
  };

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsFor, setDetailsFor] = useState(null);
  const [detailsValue, setDetailsValue] = useState("");

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const saveEdit = useCallback(() => {
    if (!draft) return;
    setRows((prev) => {
      const next = prev.map((r) => (r.id === draft.id ? draft : r));
      if (onRowsChange) onRowsChange(next);
      return next;
    });
    cancelEdit();
  }, [draft]);

  const deleteRow = (id) => {
    setRows((prev) => {
      const next = prev.filter((r) => r.id !== id);
      const totalPages = Math.max(1, Math.ceil(next.length / PAGE_SIZE));
      setPage((cur) => Math.min(cur, totalPages));
      if (onRowsChange) onRowsChange(next);
      return next;
    });
  };

  const duplicateRow = (source) => {
    const copy = {
      ...source,
      id: crypto.randomUUID(),
    };
    setRows((prev) => {
      const next = [...prev, copy];
      const totalPages = Math.max(1, Math.ceil(next.length / PAGE_SIZE));
      setPage(totalPages);
      if (onRowsChange) onRowsChange(next);
      return next;
    });
  };

  const addRow = () => {
    const row = emptyRow(selectedDate ?? todayIso());
    setRows((prev) => {
      const next = [...prev, row];
      const totalPages = Math.max(1, Math.ceil(next.length / PAGE_SIZE));
      setPage(totalPages);
      if (onRowsChange) onRowsChange(next);
      return next;
    });
    setEditingId(row.id);
    setDraft({ ...row });
  };

  const onDraftChange = (field, value) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, [field]: value };
      setRows((rowsPrev) => rowsPrev.map((r) => (r.id === updated.id ? updated : r)));
      return updated;
    });
  };

  const openDetails = (row) => {
    startRowEdit(row);
    setDetailsFor(row.id);
    setDetailsValue(row.workedItemDetails);
    setDetailsOpen(true);
  };

  const saveDetails = () => {
    if (!detailsFor) return;
    if (editingId === detailsFor && draft) {
      const updated = { ...draft, workedItemDetails: detailsValue };
      setDraft(updated);
      setRows((prev) => {
        const next = prev.map((r) => (r.id === updated.id ? updated : r));
        if (onRowsChange) onRowsChange(next);
        return next;
      });
    } else {
      setRows((prev) => {
        const next = prev.map((r) => (r.id === detailsFor ? { ...r, workedItemDetails: detailsValue } : r));
        if (onRowsChange) onRowsChange(next);
        return next;
      });
    }
    setDetailsOpen(false);
    setDetailsFor(null);
  };

  const isDetailsReadOnly = detailsFor ? editingId !== detailsFor : true;

  useEffect(() => {
    const handler = (e) => {
      if (!editingId) return;
      const container = tableRef.current;
      if (container && !container.contains(e.target)) {
        saveEdit();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [editingId, draft, saveEdit]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
      if (onRowsChange) onRowsChange(rows);
    } catch {
        console.error("Failed to save rows to localStorage");
    }
  }, [rows]);

  // If selectedDate changes, ensure there's at least one row for that date for quick entry
  useEffect(() => {
    if (!selectedDate) return;
    const exists = rows.some((r) => (r.date ?? todayIso()) === selectedDate);
    if (!exists) {
      const r = emptyRow(selectedDate);
      setRows((prev) => [...prev, r]);
    }
  }, [selectedDate]);

  return (
    <div className="p-4" ref={tableRef}>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Client</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">SOW No.</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Change Request No.</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Set Time</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Worked Item Details</th>
              <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {(() => {
              const filtered = rows.filter((r) => (r.date ?? todayIso()) === (selectedDate ?? todayIso()));
              const total = filtered.length;
              const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
              if (page > totalPages) setPage(totalPages);
              const start = (page - 1) * PAGE_SIZE;
              const visible = filtered.slice(start, start + PAGE_SIZE);
              return visible.map((row) => {
                const isEditing = editingId === row.id;
                const clientForSows = (isEditing ? (draft?.client ?? row.client) : row.client) || "";
                const sowOptions = SOW_BY_CLIENT[clientForSows] || DEFAULT_SOWS;
                const { hours, minutes } = parseTime(isEditing ? (draft?.setTime ?? "") : (row.setTime ?? ""));
                return (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <select
                        className="w-44 rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                        value={isEditing ? (draft?.client ?? "") : (row.client ?? "")}
                        onFocus={() => startRowEdit(row)}
                        onChange={(e) => {
                          if (!isEditing) startRowEdit(row);
                          onDraftChange("client", e.target.value);
                        }}
                      >
                        <option value="" disabled>Select client</option>
                        {CLIENT_OPTIONS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <select
                        className="w-40 rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                        value={isEditing ? (draft?.sowNo ?? "") : (row.sowNo ?? "")}
                        onFocus={() => startRowEdit(row)}
                        onChange={(e) => {
                          if (!isEditing) startRowEdit(row);
                          onDraftChange("sowNo", e.target.value);
                        }}
                      >
                        <option value="" disabled>Select SOW</option>
                        {sowOptions.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        className="w-44 rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                        value={isEditing ? (draft?.changeRequestNo ?? "") : (row.changeRequestNo ?? "")}
                        onFocus={() => startRowEdit(row)}
                        onChange={(e) => {
                          if (!isEditing) startRowEdit(row);
                          onDraftChange("changeRequestNo", e.target.value);
                        }}
                        placeholder="Enter CR number"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <select
                          className="w-24 rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                          value={hours}
                          onFocus={() => startRowEdit(row)}
                          onChange={(e) => {
                            const h = parseInt(e.target.value, 10) || 0;
                            const m = minutes;
                            if (!isEditing) startRowEdit(row);
                            onDraftChange("setTime", formatTime(h, m));
                          }}
                        >
                          {HOUR_OPTIONS.map((h) => (
                            <option key={h} value={h}>{h}h</option>
                          ))}
                        </select>
                        <select
                          className="w-24 rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                          value={minutes}
                          onFocus={() => startRowEdit(row)}
                          onChange={(e) => {
                            const h = hours;
                            const m = parseInt(e.target.value, 10) || 0;
                            if (!isEditing) startRowEdit(row);
                            onDraftChange("setTime", formatTime(h, m));
                          }}
                        >
                          {MINUTE_OPTIONS.map((m) => (
                            <option key={m} value={m}>{m}m</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        <button onClick={() => openDetails(row)}>
                          <BsPencilSquare className="h-5 w-5" />
                        </button>
                        <span className="text-sm text-gray-900">
                          {truncate(isEditing ? (draft?.workedItemDetails ?? "") : row.workedItemDetails)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => duplicateRow(row)}>
                          <BsClipboard2 className="h-5 w-5 text-blue-600 hover:text-blue-800" />
                        </button>
                        <button onClick={() => deleteRow(row.id)}>
                          <BsFillTrashFill className="h-5 w-5 text-red-600 hover:text-red-800" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              });
            })()}
            <tr className="bg-gray-50">
              <td className="px-4 py-2" colSpan={6}>
                <div className="flex justify-start">
                  <button
                    className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700"
                    onClick={addRow}
                  >
                    + Add Row
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {rows.filter((r) => (r.date ?? todayIso()) === (selectedDate ?? todayIso())).length === 0 ? (
            "No entries"
          ) : (
            (() => {
              const start = (page - 1) * PAGE_SIZE + 1;
              const filteredCount = rows.filter((r) => (r.date ?? todayIso()) === (selectedDate ?? todayIso())).length;
              const end = Math.min(filteredCount, page * PAGE_SIZE);
              return `Showing ${start}-${end} of ${filteredCount}`;
            })()
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded border px-2 py-1 text-sm disabled:opacity-60"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Prev
          </button>
          {(() => {
            const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
            const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
            return pages.map((p) => (
              <button
                key={p}
                className={`rounded px-2 py-1 text-sm ${p === page ? "bg-indigo-600 text-white" : "border"}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ));
          })()}
          <button
            className="rounded border px-2 py-1 text-sm disabled:opacity-60"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.max(1, Math.ceil(rows.length / PAGE_SIZE))}
          >
            Next
          </button>
        </div>
      </div>

      {/* Total hours - bottom right (for selected date) */}
      <div className="mt-3 flex justify-end">
        <div className="inline-flex items-center gap-3 rounded border border-indigo-200 bg-indigo-50 px-4 py-2">
          <div className="text-xs text-indigo-600">Total</div>
          <div className="text-lg font-semibold text-indigo-900">{formatTotal(computeTotalMinutes(rows.filter((r) => (r.date ?? todayIso()) === (selectedDate ?? todayIso()))))}</div>
        </div>
      </div>

      {detailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={saveDetails} aria-hidden="true" />
          <div className="relative z-10 w-full max-w-2xl rounded-lg bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-900">Worked Item Details</h3>
              <button className="rounded p-2 text-gray-600 hover:bg-gray-100" onClick={saveDetails} aria-label="Close modal">
                ✕
              </button>
            </div>
            <div className="p-4">
              <textarea
                className="h-64 w-full resize-none rounded border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="Enter detailed description of worked items..."
                value={detailsValue}
                onChange={(e) => setDetailsValue(e.target.value)}
                disabled={isDetailsReadOnly}
              />
              {isDetailsReadOnly && (
                <p className="mt-2 text-xs text-gray-500">This row is not in edit mode. Click Edit on the row to modify details.</p>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t px-4 py-3">
              <button className="rounded bg-gray-200 px-3 py-1 text-sm font-medium text-gray-800 hover:bg-gray-300" onClick={saveDetails}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
