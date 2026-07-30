"use client";

export function DeleteCaseButton() {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (
          !confirm(
            "Delete this case? Its documents are permanently deleted too. Any linked petitions or posts stay but are unlinked from it. This cannot be undone.",
          )
        ) {
          e.preventDefault();
        }
      }}
      className="text-red-600 underline"
    >
      Delete
    </button>
  );
}
