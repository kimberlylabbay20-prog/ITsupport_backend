import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronDown, Settings, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const profileName = user?.full_name ?? "System Admin";
  const profileEmail = user?.email ?? "admin@support.edu";
  const initials =
    profileName
      .split(" ")
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase() || "SA";

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search ticket ID, user..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-text-dark placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-5">
        {/* Status Dropdown */}
        <div className="relative">
          <select className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 pr-8 text-[13px] text-text-dark cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300">
            <option>All Statuses</option>
            <option>Open</option>
            <option>Pending</option>
            <option>Resolved</option>
            <option>Closed</option>
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
        </div>

        {/* Notification Bell */}
        <NotificationBell />

        {/* Date */}
        <span className="text-[13px] text-text-muted hidden lg:block">
          {today}
        </span>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-200"></div>

        {/* Admin Profile Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-3 cursor-pointer rounded-lg p-1 -m-1 hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-white text-[12px] font-semibold">
                {initials}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-[13px] font-medium text-text-dark leading-tight">
                {profileName}
              </p>
              <p className="text-[11px] text-text-muted leading-tight">
                {profileEmail}
              </p>
            </div>
            <ChevronDown
              size={14}
              className={`text-text-muted transition-transform ${
                menuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/settings");
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-text-dark hover:bg-gray-50 transition-colors"
              >
                <Settings size={15} className="text-text-muted" />
                Settings
              </button>
              <div className="mx-3 my-1 border-t border-gray-100" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}