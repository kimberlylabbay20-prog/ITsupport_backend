import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Ticket,
  Users,
  UserCog,
  FolderTree,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  Headphones,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  children?: { label: string; path: string }[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: <LayoutDashboard size={18} />,
    path: "/dashboard",
  },
  {
    label: "Tickets",
    icon: <Ticket size={18} />,
    path: "/tickets",
    children: [
      { label: "All Tickets", path: "/tickets/all" },
      { label: "Pending Requests", path: "/tickets/pending" },
      { label: "Ticket History", path: "/tickets/history" },
    ],
  },
  { label: "Staff", icon: <UserCog size={18} />, path: "/staff" },
  { label: "Users", icon: <Users size={18} />, path: "/users" },
  {
    label: "Categories",
    icon: <FolderTree size={18} />,
    path: "/categories",
  },
  { label: "Reports", icon: <BarChart3 size={18} />, path: "/reports" },
  {
    label: "Notifications",
    icon: <Bell size={18} />,
    path: "/notifications",
  },
  { label: "Settings", icon: <Settings size={18} />, path: "/settings" },
];

const baseItemClass =
  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors";
const activeItemClass = "bg-primary-500 text-white";
const inactiveItemClass = "text-gray-300 hover:bg-navy-700 hover:text-white";

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(["/tickets"]);

  const toggleExpand = (path: string) => {
    setExpandedItems((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-navy-800 flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
          <Headphones size={18} className="text-white" />
        </div>
        <span className="text-white font-semibold text-[15px] tracking-wide">
          IT SUPPORT DESK
        </span>
      </div>

      {/* Admin Management Label */}
      <div className="px-5 py-2">
        <span className="text-[11px] font-medium text-primary-300 uppercase tracking-wider">
          Admin Management
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-1 overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.path}>
              {item.children ? (
                <>
                  <button
                    onClick={() => toggleExpand(item.path)}
                    className={`w-full ${baseItemClass} ${
                      isActive(item.path) ? activeItemClass : inactiveItemClass
                    }`}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown
                      size={14}
                      className={`flex-shrink-0 transition-transform ${
                        expandedItems.includes(item.path) ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {expandedItems.includes(item.path) && (
                    <ul className="ml-4 mt-0.5 space-y-0.5">
                      {item.children.map((child) => (
                        <li key={child.path}>
                          <Link
                            to={child.path}
                            className={`block px-3 py-2 text-[12px] rounded-lg transition-colors ${
                              isActive(child.path)
                                ? "text-white bg-navy-700"
                                : "text-gray-400 hover:text-white hover:bg-navy-700"
                            }`}
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <Link
                  to={item.path}
                  className={`${baseItemClass} ${
                    isActive(item.path) ? activeItemClass : inactiveItemClass
                  }`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          onClick={handleLogout}
          className={`w-full ${baseItemClass} text-gray-400 hover:bg-navy-700 hover:text-white`}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}