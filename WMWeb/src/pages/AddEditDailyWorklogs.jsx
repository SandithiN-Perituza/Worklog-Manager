import React, { useEffect, useMemo, useState } from "react";
import InlineGridForm from "../components/InlineGridForm";
import Datepicker from "../components/Datepicker";

const ROWS_STORAGE_KEY = "wm_inline_rows_v1";

const parseTime = (value) => {
  if (!value) return { hours: 0, minutes: 0 };
  const match = /(?:(\d+)h)?\s*(?:(\d+)m)?/.exec(value || "");
  const h = Math.max(0, parseInt(match?.[1] ?? "0", 10) || 0);
  const m = Math.max(0, parseInt(match?.[2] ?? "0", 10) || 0);
  return { hours: h, minutes: m };
};

const formatMinutes = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

export default function AddEditDailyWorklogs() {
  const [selectedDate, setSelectedDate] = useState(() => {
    try {
      const saved = localStorage.getItem("wm_selected_date_v1");
      return saved ?? new Date().toISOString().slice(0, 10);
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  });
  const [rows, setRows] = useState([]);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRowsFromStorage = () => {
    try {
      const raw = localStorage.getItem(ROWS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    setRows(loadRowsFromStorage());
    const onStorage = (e) => {
      if (e.key === ROWS_STORAGE_KEY) {
        setRows(loadRowsFromStorage());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const totalMinutesForSelectedDate = useMemo(() => {
    if (!rows || rows.length === 0) return 0;
    return rows
      .filter((r) => (r.date ?? new Date().toISOString().slice(0, 10)) === selectedDate)
      .reduce((acc, r) => {
        const { hours, minutes } = parseTime(r.setTime || "");
        return acc + hours * 60 + minutes;
      }, 0);
  }, [rows, selectedDate]);

  const submitForSelectedDate = async () => {
    const entries = rows.filter((r) => (r.date ?? new Date().toISOString().slice(0, 10)) === selectedDate);
    if (entries.length === 0) {
      setSubmitStatus("No worklog entries for the selected date.");
      return;
    }
    for (const e of entries) {
      if (!e.client) {
        setSubmitStatus("All entries must have a client selected.");
        return;
      }
      if (!e.setTime) {
        setSubmitStatus("All entries must have set time selected.");
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, items: entries }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      setSubmitStatus("Submitted successfully.");
    } catch (err) {
      setSubmitStatus(`Submit failed: ${err?.message ?? err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="mb-3 text-lg font-semibold text-gray-900 text-center">
        Add / Edit Daily Worklogs
      </h2>

      <div className="mb-4 flex items-center justify-start gap-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Select Date</label>
          <Datepicker value={selectedDate} onChange={(d) => setSelectedDate(d)} />
        </div>
      </div>

      <InlineGridForm selectedDate={selectedDate} onRowsChange={(newRows) => setRows(newRows)} />

      <div className="mt-6 flex justify-end">
        <button
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          onClick={submitForSelectedDate}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </div>

      {submitStatus && <div className="mt-3 text-sm text-gray-700">{submitStatus}</div>}
    </div>
  );
}
