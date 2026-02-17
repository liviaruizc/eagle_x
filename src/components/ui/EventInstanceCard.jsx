export default function EventInstanceCard({
    event,
    onClick,
    action,
}) {
    return (
        <li
            onClick={onClick}
            className="cursor-pointer border p-4 rounded hover:bg-gray-100 transition"
        >
            <div className="flex items-start justify-between gap-3">
                <p className="font-semibold">{event.name}</p>
                {action ?? null}
            </div>
            <p className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString()}</p>
            <p className="text-sm text-gray-500">{event.umbrellaName} · {event.status}</p>
            <p className="text-sm text-gray-500">{event.description}</p>
        </li>
    );
}
