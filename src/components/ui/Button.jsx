export default function Button({
    children,
    variant = "primary",
    className = "",
    ...props
}) {
    const base =
        "inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm";

    const variants = {
        primary: "bg-[#00794C] text-white hover:bg-[#004785] focus:ring-2 focus:ring-[#00794C]/50",
        secondary: "bg-[#55616D] text-white hover:bg-[#404b52] focus:ring-2 focus:ring-[#55616D]/50",
        outline: "border border-[#00794C] text-[#00794C] hover:bg-[#00794C]/10 focus:ring-2 focus:ring-[#00794C]/50",
    };

    return (
        <button className={`${base} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
}