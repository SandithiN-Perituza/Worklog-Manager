import React, { useEffect, useRef, useState } from "react";
import { BsPencilSquare, BsFillTrashFill, BsClipboard2 } from "react-icons/bs";

type Row = {
  id: string;
  client: string;
  sowNo: string;
  changeRequestNo: string;
  setTime: string;
  workedItemDetails: string;
};

type Props = {
  initialRows?: Row[];
};

const CLIENT_OPTIONS = ["Client A", "Client B", "Client C"];
const SOW_BY_CLIENT: Record<string, string[]> = {
  "Client A": ["SOW-A-001", "SOW-A-002", "SOW-A-003"],
  "Client B": ["SOW-B-101", "SOW-B-102", "SOW-B-103"],
  "Client C": ["SOW-C-201", "SOW-C-202", "SOW-C-203"],
};
const DEFAULT_SOWS = ["SOW-001", "SOW-002", "SOW-003"];
const HOUR_OPTIONS = Array.from({ length: 13 }, (_, i) => i); // 0-12 hours
const MINUTE_OPTIONS = [0, 15, 30, 45];

const emptyRow = (): Row => ({
  id: crypto.randomUUID(),
  client: "",
  sowNo: "",
  changeRequestNo: "",
  setTime: "",
  workedItemDetails: "",
});

export default function InlineGridForm({ initialRows = [] }: Props) {
  const STORAGE_KEY = "wm_inline_rows_v1";
  const [rows, setRows] = useState<Row[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed as Row[];
      }
    } catch {
      // ignore parse errors and fall back
    }
    return initialRows.length ? initialRows : [emptyRow()];
  });
  
  // Commit current draft to rows without leaving edit mode
  const commitDraft = () => {
    if (!draft) return;
    setRows((prev) => prev.map((r) => (r.id === draft.id ? draft : r)));
  };
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Row | null>(null);
  const truncate = (text: string, max = 90): string => {
    if (!text) return "-";
    return text.length > max ? `${text.slice(0, max)}…` : text;
  };

  const formatTime = (hours: number, minutes: number) => `${hours}h ${minutes}m`;
  const parseTime = (value: string): { hours: number; minutes: number } => {
    const match = /(?:(\d+)h)?\s*(?:(\d+)m)?/.exec(value || "");
    const h = Math.max(0, parseInt(match?.[1] ?? "0", 10) || 0);
    const m = Math.max(0, parseInt(match?.[2] ?? "0", 10) || 0);
    return { hours: h, minutes: m };
  };

  // Table container ref to detect outside clicks for auto-save
  const tableRef = useRef<HTMLDivElement | null>(null);

  // Start editing a row on cell click
  const startRowEdit = (row: Row) => {
    if (editingId && editingId !== row.id) {
      // Auto-save previous row before switching
      saveEdit();
    }
    setEditingId(row.id);
    setDraft({ ...row });
  };

  // Worked Item Details modal state
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsFor, setDetailsFor] = useState<string | null>(null);
  const [detailsValue, setDetailsValue] = useState<string>("");

  const startEdit = (row: Row) => startRowEdit(row);

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const saveEdit = () => {
    if (!draft) return;
    setRows((prev) => prev.map((r) => (r.id === draft.id ? draft : r)));
    cancelEdit();
  };

  const deleteRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const duplicateRow = (source: Row) => {
    const copy: Row = {
      ...source,
      id: crypto.randomUUID(),
    };
    setRows((prev) => [...prev, copy]);
  };

  const addRow = () => {
    const row = emptyRow();
    setRows((prev) => [...prev, row]);
    setEditingId(row.id);
    setDraft({ ...row });
  };

  const onDraftChange = (field: keyof Row, value: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const updated: Row = { ...prev, [field]: value } as Row;
      setRows((rowsPrev) => rowsPrev.map((r) => (r.id === updated.id ? updated : r)));
      return updated;
    });
  };

  const openDetails = (row: Row) => {
    // Ensure row enters edit mode when opening details
    startRowEdit(row);
    setDetailsFor(row.id);
    setDetailsValue(row.workedItemDetails);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setDetailsFor(null);
  };

  const saveDetails = () => {
    if (!detailsFor) return;
    if (editingId === detailsFor && draft) {
      const updated: Row = { ...draft, workedItemDetails: detailsValue };
      setDraft(updated);
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } else {
      setRows((prev) =>
        prev.map((r) =>
          r.id === detailsFor ? { ...r, workedItemDetails: detailsValue } : r
        )
      );
    }
    closeDetails();
  };

  const isDetailsReadOnly = detailsFor ? editingId !== detailsFor : true;

  // Auto-save when clicking outside of the table container
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!editingId) return;
      const container = tableRef.current;
      if (container && !container.contains(e.target as Node)) {
        saveEdit();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [editingId, draft]);

  // Persist rows to localStorage so they survive refresh
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch {
      // storage may be unavailable (e.g., private mode); ignore
    }
  }, [rows]);

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
            {rows.map((row) => {
              const isEditing = editingId === row.id;
              return (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <select
                      className="w-44 rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                      value={editingId === row.id ? (draft?.client ?? "") : (row.client ?? "")}
                      onFocus={() => startRowEdit(row)}
                      onChange={(e) => {
                        if (editingId !== row.id) startRowEdit(row);
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
                      value={editingId === row.id ? (draft?.sowNo ?? "") : (row.sowNo ?? "")}
                      onFocus={() => startRowEdit(row)}
                      onChange={(e) => {
                        if (editingId !== row.id) startRowEdit(row);
                        onDraftChange("sowNo", e.target.value);
                      }}
                    >
                      <option value="" disabled>Select SOW</option>
                      {(SOW_BY_CLIENT[(editingId === row.id ? (draft?.client ?? row.client) : row.client) || ""] || DEFAULT_SOWS).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      className="w-44 rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                      value={editingId === row.id ? (draft?.changeRequestNo ?? "") : (row.changeRequestNo ?? "")}
                      onFocus={() => startRowEdit(row)}
                      onChange={(e) => {
                        if (editingId !== row.id) startRowEdit(row);
                        onDraftChange("changeRequestNo", e.target.value);
                      }}
                      placeholder="Enter CR number"
                    />
                  </td>
                  <td className="px-4 py-2">
                    {(() => {
                      const { hours, minutes } = parseTime(
                        editingId === row.id ? (draft?.setTime ?? "") : (row.setTime ?? "")
                      );
                      return (
                        <div className="flex items-center gap-2">
                          <select
                            className="w-24 rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                            value={hours}
                            onFocus={() => startRowEdit(row)}
                            onChange={(e) => {
                              const h = parseInt(e.target.value, 10) || 0;
                              const m = minutes;
                              if (editingId !== row.id) startRowEdit(row);
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
                              if (editingId !== row.id) startRowEdit(row);
                              onDraftChange("setTime", formatTime(h, m));
                            }}
                          >
                            {MINUTE_OPTIONS.map((m) => (
                              <option key={m} value={m}>{m}m</option>
                            ))}
                          </select>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <button
                        // className="rounded border border-gray-300 px-3 py-1 text-sm font-medium text-gray-800 hover:bg-gray-100"
                        onClick={() => openDetails(row)}
                      >
                        <BsPencilSquare className="h-5 w-5" />
                      </button>
                      <span className="text-sm text-gray-900">
                        {truncate(
                          editingId === row.id
                            ? (draft?.workedItemDetails ?? "")
                            : row.workedItemDetails
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-2">
                      <button
                        // className="rounded border border-blue-300 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-50"
                        onClick={() => duplicateRow(row)}
                      >
                        <BsClipboard2 className="h-5 w-5 text-blue-600 hover:text-blue-800" />
                      </button><button
                        // className="rounded border border-red-300 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-50"
                        onClick={() => deleteRow(row.id)}
                      >
                        <BsFillTrashFill className="h-5 w-5 text-red-600 hover:text-red-800" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            <tr className="bg-gray-50">
              <td className="px-4 py-2">
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

      {/* Worked Item Details Modal */}
      {detailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={saveDetails}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-2xl rounded-lg bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-900">Worked Item Details</h3>
              <button
                className="rounded p-2 text-gray-600 hover:bg-gray-100"
                onClick={saveDetails}
                aria-label="Close modal"
              >
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
                <p className="mt-2 text-xs text-gray-500">
                  This row is not in edit mode. Click Edit on the row to modify details.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t px-4 py-3">
              <button
                className="rounded bg-gray-200 px-3 py-1 text-sm font-medium text-gray-800 hover:bg-gray-300"
                onClick={saveDetails}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
