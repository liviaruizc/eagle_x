import { useNavigate, useLocation } from "react-router-dom";
import { HiHome, HiPlus, HiClipboardList, HiLogout } from "react-icons/hi";
import FGCUlogo from "../../assets/FGCU logo.jpg";

export default function Sidebar({ isOpen, setIsOpen }) {
    const navigate = useNavigate();
    const location = useLocation();
    const role = sessionStorage.getItem("auth_role");

    function handleLogout() {
        sessionStorage.clear();
        navigate("/login", { replace: true });
    }

    const links = [
        ...(role === "student"
            ? [{ icon: HiHome, label: "Home", path: "/student" }]
            : []),
        ...(role === "admin"
            ? [
                  { icon: HiHome, label: "Home", path: "/admin" },
                  { icon: HiPlus, label: "Create Event", path: "/admin/create-event" },
              ]
            : []),
        ...(role === "judge"
            ? [{ icon: HiClipboardList, label: "Judge Panel", path: "/judge" }]
            : []),
    ];

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-40"
                    onClick={() => setIsOpen(false)}
                />
                
            )}

            {/* Sidebar */}
            <div
                className={`
                    fixed md:static top-0 left-0 h-full w-64 bg-[#F3F3F3] p-4
                    flex flex-col justify-between
                    transform transition-transform duration-300
                    z-50 text-white
                    ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
                `}
    >
                
                {/* Main content (fills space) */}
                <div className="flex flex-col flex-1 shadow-inner mb-6">

                    {/* Logo */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="w-full bg-white rounded-xl shadow-sm p-3 flex justify-center items-center">
                            <img
                                src={FGCUlogo}
                                alt="FGCU Logo"
                                className="w-full h-auto object-contain"
                            />
                        </div>

                        <button
                            className="md:hidden ml-2 text-[#004785] text-2xl"
                            onClick={() => setIsOpen(false)}
                        >
                            ✕
                        </button>
                    </div>

                    {/* White panel that stretches */}
                    <div className="flex flex-col flex-1 bg-white p-4 rounded-lg shadow-inner">

                        <nav className="space-y-2 flex-1">
                            {links.map(link => {
                                const isActive = location.pathname === link.path;

                                return (
                                    <button
                                        key={link.path}
                                        onClick={() => {
                                            navigate(link.path);
                                            setIsOpen(false);
                                        }}
                                        className={`
                                            w-full flex items-center gap-3 px-4 py-2 rounded transition text-gray-700
                                            ${isActive
                                                ? "bg-[#004785] text-white"
                                                : "hover:bg-[#55616D] hover:text-white"}
                                        `}
                                    >
                                        {link.icon && <link.icon className="w-5 h-5" />}
                                        <span>{link.label}</span>
                                    </button>
                                );
                            })}
                        </nav>

                    </div>

                </div>

                {/* Bottom logout */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 rounded bg-[#D62828] hover:bg-[#004785] text-[#FFFFFF] font-semibold transition"
                >
                    <HiLogout className="w-5 h-5" />
                    Logout
                </button>
            </div>
        </>
    );
}