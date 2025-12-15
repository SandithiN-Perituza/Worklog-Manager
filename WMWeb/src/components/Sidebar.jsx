import React from "react";

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      )}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-64 transform bg-white shadow-lg transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Sidebar"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-medium text-gray-700">Menu</span>
          <button
            className="rounded p-2 text-gray-600 hover:bg-gray-100"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>
        <nav className="p-4">
          <ul className="space-y-2 text-sm">
            <li>
              <a className="block rounded px-3 py-2 hover:bg-gray-100" href="/">
                Home
              </a>
            </li>
            {/* ...add more links as needed... */}
          </ul>
        </nav>
      </aside>
    </>
  );
}
