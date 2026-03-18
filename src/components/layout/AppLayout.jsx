import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";

export default function AppLayout() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="flex h-screen">

            {/* Sidebar */}
            <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col">

                {/* Top bar (mobile only) */}
                <div className="md:hidden p-4 border-b flex items-center">
                    <button
                        onClick={() => setIsOpen(true)}
                        className="text-xl"
                    >
                        ☰
                    </button>
                    
                </div>

                {/* Page content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    <Outlet />
                </div>

            </div>
        </div>
    );
}