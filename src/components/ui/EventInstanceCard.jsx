export default function EventInstanceCard({ event, onClick, action }) {
    return (
        <li
            onClick={onClick}
            className="cursor-pointer bg-[#FFFFFF] border border-[#00794C] rounded-2xl shadow-md hover:shadow-xl transition flex flex-col justify-between p-10 min-h-[260px]"
        >
            <div className="flex flex-col gap-3 flex-grow">
                
                {/* Title */}
                <h2 className="text-2xl md:text-3xl font-bold text-[#004785] leading-tight">
                    {event.name}
                </h2>

                {event.action_needed && (
                    <p className="inline-flex w-fit rounded bg-[#CCAB00]/15 px-2 py-1 text-xs font-semibold text-[#8A7400]">
                        Action Needed{event.missing_submission_count ? ` (${event.missing_submission_count})` : ""}
                    </p>
                )}

                {/* Date */}
                {event.start_at && (
                    <p className="text-md text-[#55616D]">
                        {new Date(event.start_at).toLocaleDateString()}
                        {event.end_at ? ` - ${new Date(event.end_at).toLocaleDateString()}` : ""}
                    </p>
                )}

                {/* Description */}
                {event.description && (
                    <p className="text-sm text-[#55616D] line-clamp-3 mt-2">
                        {event.description}
                    </p>
                )}
            </div>

            {/* Button */}
            {action && (
                <div className="mt-6">
                    {action}
                </div>
            )}
        </li>
    );
}