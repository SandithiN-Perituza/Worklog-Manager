import React from "react";
import { FiMenu } from "react-icons/fi";

export default function Header({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-white">
      <div className="mx-auto flex h-14 items-center gap-3 px-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded p-2 text-gray-700 hover:bg-gray-100"
          aria-label="Open sidebar"
        >
          {/* Hamburger icon via react-icons */}
          <FiMenu className="h-5 w-5" aria-hidden="true" />
        </button>
        <span className="text-base font-semibold text-gray-900">
          Worklog Manager
        </span>
        {/* ...existing code... */}
      </div>
    </header>
  );
}
