import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Renders a small ⓘ icon. Clicking it opens a popover showing the criterion
// name, description, and scoring phase. Uses a portal so it is never clipped
// by overflow:hidden / overflow:auto ancestor containers (e.g. table wrappers).
export default function CriterionInfoTooltip({ name, description, scoringPhase }) {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const btnRef = useRef(null);

    function handleOpen() {
        if (!open && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setCoords({
                // Position above the button; popover is 12px above its bottom edge
                top: rect.top + window.scrollY - 8,
                left: rect.left + window.scrollX + rect.width / 2,
            });
        }
        setOpen((v) => !v);
    }

    useEffect(() => {
        if (!open) return;

        function handleOutside(e) {
            if (btnRef.current && !btnRef.current.contains(e.target)) {
                setOpen(false);
            }
        }

        function handleKey(e) {
            if (e.key === "Escape") setOpen(false);
        }

        document.addEventListener("mousedown", handleOutside);
        document.addEventListener("keydown", handleKey);
        return () => {
            document.removeEventListener("mousedown", handleOutside);
            document.removeEventListener("keydown", handleKey);
        };
    }, [open]);

    const phaseLabel =
        scoringPhase === "pre_scoring" ? "Pre-Scoring"
        : scoringPhase === "event_scoring" ? "Event Scoring"
        : "Both Phases";

    const popover = open
        ? createPortal(
            <div
                style={{
                    position: "absolute",
                    top: coords.top,
                    left: coords.left,
                    transform: "translate(-50%, -100%)",
                    zIndex: 9999,
                }}
                className="w-56 rounded-xl border border-gray-200 bg-white p-3 shadow-lg text-left"
            >
                <p className="text-xs font-bold text-[#004785] leading-snug">{name}</p>
                {description && (
                    <p className="mt-1 text-xs text-[#55616D] leading-snug">{description}</p>
                )}
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-[#00794C]">
                    {phaseLabel}
                </p>
                {/* caret pointing down */}
                <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-200" />
                <div className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-px border-4 border-transparent border-t-white" />
            </div>,
            document.body
        )
        : null;

    return (
        <span className="relative inline-flex items-center">
            <button
                ref={btnRef}
                type="button"
                onClick={handleOpen}
                className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#004785]/15 text-[#004785] text-[10px] font-bold hover:bg-[#004785]/30 focus:outline-none focus:ring-1 focus:ring-[#004785]/50"
                aria-label={`Info for ${name}`}
            >
                i
            </button>
            {popover}
        </span>
    );
}
