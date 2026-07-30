"use client";

export function DeletePetitionButton() {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (
          !confirm(
            "Delete this petition? This also permanently deletes all of its signatures. This cannot be undone.",
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
