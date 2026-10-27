import React, { useState, useRef, useEffect } from "react";
import {
  Eye,
  EyeOff,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Check,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import type { Role } from "@/types";
import { FleetOpsTruckLogo } from "@/pages/LoginPage";

interface RoleOption {
  id: Role;
  label: string;
}

const ROLES: RoleOption[] = [
  { id: "ADMIN", label: "Admin" },
  { id: "DISPATCHER", label: "Dispatcher" },
  { id: "DRIVER", label: "Driver" },
];

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [selectedRole, setSelectedRole] = useState<Role>("DISPATCHER");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  // Close role dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!username.trim() || username.trim().length < 3) {
      setErrorMsg("Username must be at least 3 characters.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid work email address.");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    const res = await register({
      username: username.trim(),
      email: email.trim(),
      password,
      role: selectedRole,
    });
    setLoading(false);

    if (res.success) {
      setSuccessMsg("Account created successfully! Redirecting to command center...");
      setTimeout(() => {
        navigate("/");
      }, 1200);
    } else {
      setErrorMsg(res.error || "Registration failed. Username may already exist.");
    }
  };

  return (
    <div className="register-page-v2 min-h-screen relative overflow-x-hidden bg-[#e3effb] flex flex-col md:flex-row font-sans">
      {/* Fully Responsive CSS: Desktop → Tablet → Mobile */}
      <style>{`
        .register-page-v2 {
          background: #e3effb;
          min-height: 100vh;
          min-height: 100dvh;
          position: relative;
          overflow-x: hidden;
        }

        /* ===== VIDEO ===== */
        .register-page-v2__background-video {
          z-index: 0;
          width: 53%;
          position: absolute;
          bottom: 0;
          left: -3px;
          pointer-events: none;
          object-fit: cover;
          image-rendering: -webkit-optimize-contrast;
          transform: translateZ(0);
        }

        /* ===== LEFT PANEL ===== */
        .register-page-v2__left {
          padding: 5rem 7rem;
          position: relative;
          z-index: 2;
        }

        /* ===== SUBTITLE ===== */
        .register-page-v2__left__subtitle {
          color: #004578 !important;
          font-size: 32px !important;
          line-height: 1.35;
          letter-spacing: -0.015em;
        }

        /* ===== RIGHT PANEL (FORM CARD) ===== */
        .register-page-v2__right {
          background: #fff;
          border-top-left-radius: 2rem;
          border-bottom-left-radius: 2rem;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 3.5rem 2rem;
          display: flex;
          position: relative;
          z-index: 2;
          box-shadow: -10px 0 35px rgba(0, 0, 0, 0.04);
        }
        .register-page-v2__right__logo {
          width: 60px;
          margin: auto auto 1.5rem;
        }
        .register-page-v2__right__header {
          flex-direction: column;
          justify-content: center;
          align-items: center;
          margin-bottom: 1.75rem;
          display: flex;
          color: #333 !important;
        }
        .register-page-v2__right__header__name {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 0 !important;
          color: #262626;
        }
        .register-page-v2__right__header__text {
          font-size: 16px;
          color: #595959;
          margin-top: 4px;
        }
        .register-page-v2__right__form {
          width: 72%;
          max-width: 460px;
        }

        /* ===== DESKTOP (min-width: 768px) ===== */
        @media (min-width: 768px) {
          .register-page-v2__right {
            min-height: 100vh;
          }
        }

        /* ===== TABLET (max-width: 1200px) ===== */
        @media (max-width: 1200px) {
          .register-page-v2__left {
            padding: 4rem 3.5rem;
          }
        }

        /* ===== MOBILE (max-width: 767px) ===== */
        @media (max-width: 767px) {
          .register-page-v2 {
            flex-direction: column !important;
          }

          /* Left panel: compact branding strip */
          .register-page-v2__left {
            padding: 1.75rem 1.25rem 0.75rem;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .register-page-v2__left__subtitle {
            font-size: 18px !important;
            line-height: 1.4;
          }

          /* Video: inline compact banner */
          .register-page-v2__background-video {
            position: relative;
            width: 100%;
            left: 0;
            max-height: 160px;
            border-radius: 0;
            object-fit: cover;
          }

          /* Right panel: top-rounded card that slides over the video */
          .register-page-v2__right {
            border-top-right-radius: 1.5rem;
            border-top-left-radius: 1.5rem;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
            margin-top: -1rem;
            padding: 2rem 1.25rem;
            padding-bottom: calc(2rem + env(safe-area-inset-bottom, 0px));
            box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.06);
          }
          .register-page-v2__right__logo {
            width: 48px;
            margin: auto auto 0.75rem;
          }
          .register-page-v2__right__header {
            margin-bottom: 1.25rem;
          }
          .register-page-v2__right__header__name {
            font-size: 20px;
          }
          .register-page-v2__right__header__text {
            font-size: 13px;
          }
          .register-page-v2__right__form {
            width: 100%;
          }
        }

        /* ===== VERY SMALL PHONES (max-width: 380px) ===== */
        @media (max-width: 380px) {
          .register-page-v2__left {
            padding: 1.25rem 1rem 0.5rem;
          }
          .register-page-v2__left__subtitle {
            font-size: 16px !important;
          }
          .register-page-v2__right {
            padding: 1.5rem 1rem;
            padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
          }
          .register-page-v2__right__header__name {
            font-size: 18px;
          }
          .register-page-v2__background-video {
            max-height: 120px;
          }
        }
      `}</style>

      {/* ================= FULL HD MOVING ROAD VIDEO BACKGROUND ================= */}
      <video
        src="/loginBg.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="register-page-v2__background-video"
      />

      {/* ================= LEFT HALF: BRANDING & TAGLINE ================= */}
      <div className="w-full md:w-[53%] flex flex-col justify-between md:min-h-screen relative z-10">
        <div className="register-page-v2__left">
          {/* Top Logo: FleetOps Truck Logo + Brand Name */}
          <Link to="/" className="inline-flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6 group cursor-pointer">
            <FleetOpsTruckLogo className="h-7 w-11 sm:h-9 sm:w-14 drop-shadow-sm" color="#0078d4" />
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#004578]">
              fleet<span className="text-[#0078d4]">ops</span>
            </span>
          </Link>

          {/* Subtitle / Value Proposition Text */}
          <div className="register-page-v2__left__subtitle">
            <span className="font-bold text-[#004578]">Command your entire fleet</span>
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            with real-time visibility,
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            safety, and control.
          </div>
        </div>

        {/* Spacer for desktop above video */}
        <div className="hidden md:block h-64" />
      </div>

      {/* ================= RIGHT HALF: CREATE ACCOUNT CARD ================= */}
      <div className="w-full md:w-[47%] register-page-v2__right">
        {/* Card Header */}
        <div className="register-page-v2__right__header text-center">
          <FleetOpsTruckLogo className="register-page-v2__right__logo" color="#0078d4" />
          <h2 className="register-page-v2__right__header__name">
            Create Account
          </h2>
          <p className="register-page-v2__right__header__text">
            to get started with fleetops portal
          </p>
        </div>

        {/* Form Container */}
        <div className="register-page-v2__right__form">
          {/* Success Message Banner */}
          {successMsg && (
            <div className="mb-3 sm:mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Message Box */}
          {errorMsg && (
            <div className="mb-3 sm:mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5">
            {/* Role Dropdown */}
            <div ref={roleDropdownRef} className="relative z-20">
              <label className="block text-[13px] font-normal text-[#262626] mb-1">
                Select Role
              </label>
              <button
                type="button"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className={`h-11 sm:h-10 w-full rounded-lg sm:rounded border bg-white px-3 pr-9 text-sm text-left flex items-center justify-between outline-none transition cursor-pointer select-none ${
                  roleDropdownOpen
                    ? "border-[#0078d4] ring-2 ring-[#0078d4]/20"
                    : "border-[#d9d9d9] hover:border-[#40a9ff]"
                }`}
              >
                <span className="text-[#262626] font-medium">
                  {ROLES.find((r) => r.id === selectedRole)?.label || "Select Role"}
                </span>
                <span
                  className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform duration-200 ${
                    roleDropdownOpen ? "rotate-180 text-[#0078d4]" : ""
                  }`}
                >
                  <ChevronDown size={16} />
                </span>
              </button>

              {/* Fully Responsive Dropdown Menu (100% matches input width, never overflows card) */}
              {roleDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 w-full bg-white rounded-lg sm:rounded-md border border-[#d9d9d9] shadow-xl py-1 z-30 overflow-hidden">
                  {ROLES.map((role) => {
                    const isSelected = selectedRole === role.id;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => {
                          setSelectedRole(role.id);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full px-3.5 py-2.5 text-sm text-left flex items-center justify-between transition cursor-pointer ${
                          isSelected
                            ? "bg-[#e3effb] text-[#004578] font-semibold"
                            : "text-[#262626] hover:bg-slate-50"
                        }`}
                      >
                        <span>{role.label}</span>
                        {isSelected && <Check size={16} className="text-[#0078d4] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Username Field */}
            <div>
              <label className="block text-[13px] font-normal text-[#262626] mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose your username"
                className="h-11 sm:h-10 w-full rounded-lg sm:rounded border border-[#d9d9d9] px-3 text-sm text-[#262626] outline-none transition focus:border-[#0078d4] focus:ring-2 focus:ring-[#0078d4]/20 hover:border-[#40a9ff] placeholder:text-slate-400"
                required
              />
            </div>

            {/* Work Email Address Field */}
            <div>
              <label className="block text-[13px] font-normal text-[#262626] mb-1">
                Work Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="h-11 sm:h-10 w-full rounded-lg sm:rounded border border-[#d9d9d9] px-3 text-sm text-[#262626] outline-none transition focus:border-[#0078d4] focus:ring-2 focus:ring-[#0078d4]/20 hover:border-[#40a9ff] placeholder:text-slate-400"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[13px] font-normal text-[#262626] mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="h-11 sm:h-10 w-full rounded-lg sm:rounded border border-[#d9d9d9] px-3 pr-11 text-sm text-[#262626] outline-none transition focus:border-[#0078d4] focus:ring-2 focus:ring-[#0078d4]/20 hover:border-[#40a9ff] placeholder:text-slate-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer p-1.5 rounded-md active:bg-slate-100"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-[13px] font-normal text-[#262626] mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="h-11 sm:h-10 w-full rounded-lg sm:rounded border border-[#d9d9d9] px-3 pr-11 text-sm text-[#262626] outline-none transition focus:border-[#0078d4] focus:ring-2 focus:ring-[#0078d4]/20 hover:border-[#40a9ff] placeholder:text-slate-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer p-1.5 rounded-md active:bg-slate-100"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Primary Action Button: "Create Account" */}
            <div className="pt-1.5 sm:pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 sm:h-10 rounded-lg sm:rounded bg-[#0078d4] hover:bg-[#0069ba] active:bg-[#005a9e] text-white text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center disabled:opacity-60 shadow-sm active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Creating Account...
                  </span>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </div>
          </form>

          {/* Divider: "or" */}
          <div className="relative my-5 sm:my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#f0f0f0]" />
            </div>
            <div className="relative inline-block bg-white px-3 text-xs text-[#bfbfbf]">
              or
            </div>
          </div>

          {/* Footer: Already have an account? Sign in here */}
          <div className="text-center">
            <p className="text-xs text-[#595959]">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-[#0078d4] font-medium hover:underline cursor-pointer"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
