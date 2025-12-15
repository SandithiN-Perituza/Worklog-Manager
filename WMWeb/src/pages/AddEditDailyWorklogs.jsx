import React from "react";
import InlineGridForm from "../components/InlineGridForm";

export default function AddEditDailyWorklogs() {
  return (
    <div className="p-4">
      <h2 className="mb-3 text-lg font-semibold text-gray-900 text-center">
        Add / Edit Daily Worklogs
      </h2>
      <InlineGridForm />
    </div>
  );
}
