import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Button from "./Button.jsx";

// Confirmation dialog for permanently deleting an event instance (GitHub style). The delete
// button stays disabled until the user types the exact event name. Uses a
// portal so it is never clipped by ancestor containers.
export default function DeleteEventDialog({
    eventName,
    isDeleting,
    error,
    onConfirm,
    onCancel,
}) {
    const [typedName, setTypedName] = useState("");
    const nameMatches = typedName === eventName;

    useEffect(() => {
        function handleKey(e) {
            if (e.key === "Escape" && !isDeleting) onCancel();
        }

        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [isDeleting, onCancel]);

    function handleSubmit(event) {
        event.preventDefault();
        if (nameMatches && !isDeleting) onConfirm(typedName);
    }

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => {
                if (!isDeleting) onCancel();
            }}
        >
            <form
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-event-title"
                onSubmit={handleSubmit}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-md"
            >
                <h2
                    id="delete-event-title"
                    className="text-lg font-bold text-red-600 mb-2"
                >
                    Delete event
                </h2>
                <p className="text-sm text-[#55616D] mb-4">
                    This permanently deletes{" "}
                    <span className="font-semibold text-[#004785]">
                        {eventName}
                    </span>{" "}
                    and everything in it: tracks, submissions, scores, judge
                    assignments, and tables. This cannot be undone.
                </p>

                <label className="block text-xs font-semibold text-[#55616D] mb-1">
                    Type{" "}
                    <span className="font-bold text-[#004785] break-words">
                        {eventName}
                    </span>{" "}
                    to confirm
                </label>
                <input
                    type="text"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/50"
                    disabled={isDeleting}
                    autoFocus
                />

                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

                <div className="mt-5 flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="danger"
                        disabled={!nameMatches || isDeleting}
                    >
                        {isDeleting ? "Deleting..." : "Delete event"}
                    </Button>
                </div>
            </form>
        </div>,
        document.body,
    );
}
