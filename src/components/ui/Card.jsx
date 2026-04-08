export function Card({children, className = ""}) {
    return (
        <div className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-md ${className}`}>
            {children}
        </div>
    );
}

export function CardTitle({ children }) {
    return <h2 className="text-2xl font-bold text-[#004785] mb-1">{children}</h2>;
}

export function CardBody({ children }) {
    return <div className="mt-3 text-sm text-[#55616D]">{children}</div>;
}
