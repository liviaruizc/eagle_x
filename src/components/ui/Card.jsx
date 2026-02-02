export function Card({children, className = ""}) {
    return (
        <div className={`rounded-2x1 border border-gray-200 bg-white p-5 shadow-sm ${className}`}>
            {children}
        </div>
    );
}

export function CardTitle({ children }) {
    return <h2 className="text-lg font-semibold">{children}</h2>;
}

export function CardBody({ children }) {
    return <div className="mt-2 text-sm text-gray-600">{children}</div>;
}
