"use client";

export function DeleteCommentButton() {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!confirm("Permanently delete this comment? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
      className="text-red-600 underline"
    >
      Delete
    </button>
  );
}
