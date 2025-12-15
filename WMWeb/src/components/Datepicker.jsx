import React, { useEffect, useState } from "react";

const STORAGE_KEY = "wm_selected_date_v1";
const todayIso = () => new Date().toISOString().slice(0, 10);

export default function Datepicker({ value, onChange }) {
  const [date, setDate] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return value ?? saved ?? todayIso();
    } catch {
      return value ?? todayIso();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, date);
    } catch {}
    if (onChange) onChange(date);
  }, [date, onChange]);

  const shiftDays = (delta) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    const iso = d.toISOString().slice(0, 10);
    setDate(iso);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        className="rounded border px-2 py-1 text-sm"
        onClick={() => shiftDays(-1)}
        aria-label="Previous date"
      >
        ◀
      </button>
      <input
        type="date"
        className="rounded border px-2 py-1 text-sm"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <button
        className="rounded border px-2 py-1 text-sm"
        onClick={() => shiftDays(1)}
        aria-label="Next date"
      >
        ▶
      </button>
    </div>
  );
}
