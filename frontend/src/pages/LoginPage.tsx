import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, Headphones, Loader2, Lock, User } from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { login as apiLogin, getCurrentUser } from "../services/authService";
import { logout as clearSession } from "../services/authService";

export default function LoginPage() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/dashboard";
  const initialError = (location.state as { error?: string })?.error;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const auth = await apiLogin({ username: username.trim(), password });

      await getCurrentUser();

      if (auth.user.role !== "admin") {
        clearSession();
        logout();
        setError("Access denied. Admin account required to use this dashboard.");
        setSubmitting(false);
        return;
      }

      login(auth.user);
      navigate(from, { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        if (err.response?.status === 401) {
          setError("Invalid username or password.");
        } else if (err.response?.status === 403) {
          setError("Account is disabled. Contact your administrator.");
        } else if (detail) {
          setError(String(detail));
        } else if (!err.response) {
          setError("Cannot reach the server. Please try again.");
        } else {
          setError("Login failed. Please try again.");
        }
      } else {
        setError("Login failed. Please try again.");
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-page-bg">
      {/* Brand Panel */}
      <div className="hidden lg:flex w-[420px] bg-navy-800 flex-col justify-between p-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
            <Headphones size={20} className="text-white" />
          </div>
          <span className="text-white font-semibold text-[16px] tracking-wide">
            IT SUPPORT DESK
          </span>
        </div>

        <div>
          <h1 className="text-white text-[22px] font-bold leading-snug">
            Admin Dashboard
          </h1>
          <p className="text-primary-300 text-[13px] mt-2 leading-relaxed">
            Manage tickets, staff, users and system reports from one place.
          </p>
        </div>

        <p className="text-[11px] text-gray-500">
          © {new Date().getFullYear()} IT Support Desk
        </p>
      </div>

      {/* Login Card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm w-full max-w-[400px] p-8">
          {/* Mobile Brand */}
          <div className="flex items-center gap-3 lg:hidden mb-6">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Headphones size={18} className="text-white" />
            </div>
            <span className="text-navy-800 font-semibold text-[14px] tracking-wide">
              IT SUPPORT DESK
            </span>
          </div>

          <h2 className="text-[22px] font-bold text-text-dark">Admin Login</h2>
          <p className="text-[13px] text-text-muted mt-1 mb-6">
            Sign in to access the admin dashboard.
          </p>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
              <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-red-600 leading-snug">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Username */}
            <label className="block mb-4">
              <span className="block text-[12px] font-medium text-text-dark mb-1.5">
                Username
              </span>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-text-dark placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300"
                />
              </div>
            </label>

            {/* Password */}
            <label className="block mb-5">
              <span className="block text-[12px] font-medium text-text-dark mb-1.5">
                Password
              </span>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full pl-9 pr-9 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-text-dark placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-dark"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white text-[13px] font-medium py-2 rounded-lg transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}