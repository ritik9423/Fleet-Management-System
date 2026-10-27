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
import { api } from "@/lib/api";
import type { Role } from "@/types";

// ================= PIXEL-PERFECT FLEETOPS FAST TRUCK LOGO =================
export function FleetOpsTruckLogo({
  className = "w-10 h-7",
  color = "#0078d4",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 62 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 3 Horizontal Speed / Motion Streaks */}
      <line x1="2" y1="11" x2="15" y2="11" stroke={color} strokeWidth="3.2" strokeLinecap="round" />
      <line x1="0" y1="19" x2="19" y2="19" stroke={color} strokeWidth="3.2" strokeLinecap="round" />
      <line x1="3" y1="27" x2="14" y2="27" stroke={color} strokeWidth="3.2" strokeLinecap="round" />

      {/* Main Delivery Truck Outer Path */}
      <path
        d="M 21 8 C 21 6 22.5 4.5 24.5 4.5 L 42.5 4.5 C 44 4.5 44.5 5.5 44.5 7 L 44.5 13.5 L 53 13.5 C 55 13.5 57 15.5 58 17.5 L 60 22 C 60.5 23.5 60.5 25 60.5 26.5 L 60.5 30 C 60.5 31.5 59.5 32.5 58 32.5 L 55 32.5"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Cargo Rear & Floor Lines */}
      <path
        d="M 21 8 L 21 32.5 L 25 32.5"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="33" y1="32.5" x2="47" y2="32.5" stroke={color} strokeWidth="3.2" strokeLinecap="round" />

      {/* Front & Rear Wheels */}
      <circle cx="29" cy="32" r="3.8" stroke={color} strokeWidth="3.2" fill="none" />
      <circle cx="51" cy="32" r="3.8" stroke={color} strokeWidth="3.2" fill="none" />

      {/* Cab Divider */}
      <line x1="44.5" y1="13.5" x2="44.5" y2="26" stroke={color} strokeWidth="2.8" strokeLinecap="round" />

      {/* Inset Line on Cargo Container */}
      <line x1="26" y1="18.5" x2="38" y2="18.5" stroke={color} strokeWidth="2.8" strokeLinecap="round" />

      {/* Windshield Glass Tint */}
      <path
        d="M 47 15.5 L 53 15.5 C 54.5 15.5 55.5 16.5 56 18 L 57.5 21.5 L 47 21.5 Z"
        fill={color}
        opacity="0.3"
      />
    </svg>
  );
}

// Google Official Icon
function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

interface RoleOption {
  id: Role;
  label: string;
  username: string;
}

// Clean Role Names without person's name
const ROLES: RoleOption[] = [
  { id: "ADMIN", label: "Admin", username: "admin" },
  { id: "DISPATCHER", label: "Dispatcher", username: "dispatcher" },
  { id: "DRIVER", label: "Driver", username: "rajesh.sharma" },
];

interface LoginPageProps {
  initialMode?: "login" | "signup";
}

export function LoginPage({ initialMode = "login" }: LoginPageProps) {
  const navigate = useNavigate();
  const { login, register, quickSetDemoUser } = useAuth();

  // Mode: "login" or "signup"
  const [mode, setMode] = useState<"login" | "signup">(initialMode);

  // Form State
  const [selectedRole, setSelectedRole] = useState<Role>("ADMIN");
  const [username, setUsername] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [slowServerWarning, setSlowServerWarning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [touchedEmail, setTouchedEmail] = useState(false);
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

  // Proactively ping backend on mount and periodically to pre-warm the database connection pool
  useEffect(() => {
    api.get("/health").catch(() => {});
    const interval = setInterval(() => {
      api.get("/health").catch(() => {});
    }, 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Show cold-start message if request takes > 2.5s
  useEffect(() => {
    let timer: any;
    if (loading) {
      timer = setTimeout(() => {
        setSlowServerWarning(true);
      }, 2500);
    } else {
      setSlowServerWarning(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const triggerPreWarm = () => {
    api.get("/health").catch(() => {});
  };

  const handleRoleChange = (newRole: Role) => {
    setSelectedRole(newRole);
    const roleObj = ROLES.find((r) => r.id === newRole) || ROLES[0];
    if (mode === "login") {
      setUsername(roleObj.username);
      setPassword("password");
    }
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (mode === "login") {
      if (!username.trim() || !password) {
        setTouchedEmail(true);
        setErrorMsg("Required");
        return;
      }

      setLoading(true);
      const res = await login(username.trim(), password);
      setLoading(false);

      if (res.success) {
        navigate("/");
      } else {
        setErrorMsg(res.error || "Please check your login details!");
      }
    } else {
      // Signup Mode
      if (!username.trim()) {
        setErrorMsg("Username is required.");
        return;
      }
      if (!email.trim() || !email.includes("@")) {
        setErrorMsg("Please enter a valid email address.");
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
        setSuccessMsg("Account created successfully! Logging you in...");
        setTimeout(() => {
          navigate("/");
        }, 1200);
      } else {
        setErrorMsg(res.error || "Registration failed. Username may already exist.");
      }
    }
  };

  const handleDemoBypass = async () => {
    await quickSetDemoUser(selectedRole);
    navigate("/");
  };

  const isEmailError = touchedEmail && !username.trim();

  return (
    <div className="login-page-v2 min-h-screen relative overflow-x-hidden bg-[#e3effb] flex flex-col md:flex-row font-sans">
      {/* Fully Responsive CSS: Desktop → Tablet → Mobile */}
      <style>{`
        .login-page-v2 {
          background: #e3effb;
          min-height: 100vh;
          min-height: 100dvh;
          position: relative;
          overflow-x: hidden;
        }

        /* ===== VIDEO ===== */
        .login-page-v2__background-video {
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
        .login-page-v2__left {
          padding: 4.5rem 6.5rem;
          position: relative;
          z-index: 2;
        }

        /* ===== SUBTITLE ===== */
        .login-page-v2__left__subtitle {
          color: #004578 !important;
          font-size: 32px !important;
          line-height: 1.35;
          letter-spacing: -0.015em;
        }

        /* ===== RIGHT PANEL (FORM CARD) ===== */
        .login-page-v2__right {
          background: #fff;
          border-top-left-radius: 2rem;
          border-bottom-left-radius: 2rem;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 4rem 2rem;
          display: flex;
          position: relative;
          z-index: 2;
          box-shadow: -10px 0 35px rgba(0, 0, 0, 0.04);
        }
        .login-page-v2__right__logo {
          width: 60px;
          margin: auto auto 1.5rem;
        }
        .login-page-v2__right__header {
          flex-direction: column;
          justify-content: center;
          align-items: center;
          margin-bottom: 2rem;
          display: flex;
          color: #333 !important;
        }
        .login-page-v2__right__header__name {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 0 !important;
          color: #262626;
        }
        .login-page-v2__right__header__text {
          font-size: 16px;
          color: #595959;
          margin-top: 4px;
        }
        .login-page-v2__right__form {
          width: 72%;
          max-width: 460px;
        }

        /* ===== DESKTOP (min-width: 768px) ===== */
        @media (min-width: 768px) {
          .login-page-v2__right {
            min-height: 100vh;
          }
        }

        /* ===== TABLET (max-width: 1200px) ===== */
        @media (max-width: 1200px) {
          .login-page-v2__left {
            padding: 3.5rem 3rem;
          }
        }

        /* ===== MOBILE (max-width: 767px) ===== */
        @media (max-width: 767px) {
          .login-page-v2 {
            flex-direction: column !important;
          }

          /* Left panel: compact branding strip */
          .login-page-v2__left {
            padding: 1.75rem 1.25rem 0.75rem;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .login-page-v2__left__subtitle {
            font-size: 18px !important;
            line-height: 1.4;
          }

          /* Video: inline compact banner */
          .login-page-v2__background-video {
            position: relative;
            width: 100%;
            left: 0;
            max-height: 180px;
            border-radius: 0;
            object-fit: cover;
          }

          /* Right panel: top-rounded card that slides over the video */
          .login-page-v2__right {
            border-top-right-radius: 1.5rem;
            border-top-left-radius: 1.5rem;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
            margin-top: -1rem;
            padding: 2rem 1.25rem;
            padding-bottom: calc(2rem + env(safe-area-inset-bottom, 0px));
            box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.06);
          }
          .login-page-v2__right__logo {
            width: 48px;
            margin: auto auto 0.75rem;
          }
          .login-page-v2__right__header {
            margin-bottom: 1.25rem;
          }
          .login-page-v2__right__header__name {
            font-size: 20px;
          }
          .login-page-v2__right__header__text {
            font-size: 13px;
          }
          .login-page-v2__right__form {
            width: 100%;
          }
        }

        /* ===== VERY SMALL PHONES (max-width: 380px) ===== */
        @media (max-width: 380px) {
          .login-page-v2__left {
            padding: 1.25rem 1rem 0.5rem;
          }
          .login-page-v2__left__subtitle {
            font-size: 16px !important;
          }
          .login-page-v2__right {
            padding: 1.5rem 1rem;
            padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
          }
          .login-page-v2__right__header__name {
            font-size: 18px;
          }
          .login-page-v2__background-video {
            max-height: 140px;
          }
        }
      `}</style>

      {/* ================= FULL HD MOVING ROAD & TRUCK VIDEO (loginBg.mp4) ================= */}
      <video
        src="/loginBg.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className="login-page-v2__background-video"
      />

      {/* ================= LEFT HALF: BRANDING & TAGLINE ================= */}
      <div className="w-full md:w-[53%] flex flex-col justify-between md:min-h-screen relative z-10">
        <div className="login-page-v2__left">
          {/* Top Logo: FleetOps Truck Logo + Brand Name */}
          <Link to="/" className="inline-flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6 group cursor-pointer">
            <FleetOpsTruckLogo className="h-7 w-11 sm:h-9 sm:w-14 drop-shadow-sm" color="#0078d4" />
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#004578]">
              fleet<span className="text-[#0078d4]">ops</span>
            </span>
          </Link>

          {/* Subtitle / Value Proposition Text */}
          <div className="login-page-v2__left__subtitle">
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

      {/* ================= RIGHT HALF: LOGIN FORM CARD ================= */}
      <div className="w-full md:w-[47%] login-page-v2__right">
        {/* Card Header */}
        <div className="login-page-v2__right__header text-center">
          <FleetOpsTruckLogo className="login-page-v2__right__logo" color="#0078d4" />
          <h2 className="login-page-v2__right__header__name">
            {mode === "login" ? "Sign in" : "Create Account"}
          </h2>
          <p className="login-page-v2__right__header__text">
            {mode === "login"
              ? "to access fleetops portal"
              : "to get started with fleetops"}
          </p>
        </div>

        {/* Form Container */}
        <div className="login-page-v2__right__form">
          {/* Success Message Banner */}
          {successMsg && (
            <div className="mb-3 sm:mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Message Box */}
          {errorMsg && errorMsg !== "Required" && (
            <div className="mb-3 sm:mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{errorMsg}</span>
                {mode === "login" && (
                  <div className="mt-1">
                    <button
                      type="button"
                      onClick={handleDemoBypass}
                      className="text-[#0078d4] underline font-bold cursor-pointer hover:text-[#005a9e]"
                    >
                      Bypass login as {selectedRole} (Demo)
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= LOGIN FORM FIELDS ================= */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
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
                          handleRoleChange(role.id);
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

            {/* Email / Username Field */}
            <div>
              <label className="block text-[13px] font-normal text-[#262626] mb-1">
                {mode === "login" ? "Email / Username" : "Username"}
              </label>
              <input
                type="text"
                value={username}
                onFocus={triggerPreWarm}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setTouchedEmail(true);
                }}
                onBlur={() => setTouchedEmail(true)}
                placeholder="Enter your Email / Username"
                className={`h-11 sm:h-10 w-full rounded-lg sm:rounded border px-3 text-sm text-[#262626] outline-none transition placeholder:text-slate-400 ${isEmailError
                    ? "border-[#ff4d4f] focus:border-[#ff4d4f] focus:ring-2 focus:ring-[#ff4d4f]/20"
                    : "border-[#d9d9d9] focus:border-[#0078d4] focus:ring-2 focus:ring-[#0078d4]/20 hover:border-[#40a9ff]"
                  }`}
                required
              />
              {isEmailError && (
                <div className="text-[12px] text-[#ff4d4f] mt-1">
                  Required
                </div>
              )}
            </div>

            {/* Work Email Field (in Signup Mode) */}
            {mode === "signup" && (
              <div>
                <label className="block text-[13px] font-normal text-[#262626] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onFocus={triggerPreWarm}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your work email"
                  className="h-11 sm:h-10 w-full rounded-lg sm:rounded border border-[#d9d9d9] px-3 text-sm text-[#262626] outline-none transition focus:border-[#0078d4] focus:ring-2 focus:ring-[#0078d4]/20 hover:border-[#40a9ff] placeholder:text-slate-400"
                  required
                />
              </div>
            )}

            {/* Password Field */}
            <div>
              <label className="block text-[13px] font-normal text-[#262626] mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onFocus={triggerPreWarm}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
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

            {/* Confirm Password Field (in Signup Mode) */}
            {mode === "signup" && (
              <div>
                <label className="block text-[13px] font-normal text-[#262626] mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="h-11 sm:h-10 w-full rounded-lg sm:rounded border border-[#d9d9d9] px-3 pr-11 text-sm text-[#262626] outline-none transition focus:border-[#0078d4] focus:ring-2 focus:ring-[#0078d4]/20 hover:border-[#40a9ff] placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            <div className="pt-1.5 sm:pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 sm:h-10 rounded-lg sm:rounded bg-[#0078d4] hover:bg-[#0069ba] active:bg-[#005a9e] text-white text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center disabled:opacity-60 shadow-sm active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    {mode === "login" ? "Logging In..." : "Creating..."}
                  </span>
                ) : mode === "login" ? (
                  <span>Log In</span>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
              {slowServerWarning && loading && (
                <div className="mt-2 text-center text-[12px] text-amber-700 bg-amber-50 border border-amber-200/80 rounded-md py-1.5 px-2.5 animate-pulse flex items-center justify-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>Connecting cloud server &amp; database... (warming up from sleep)</span>
                </div>
              )}
            </div>

            {/* Secondary Buttons Row — stacks on very small screens */}
            {mode === "login" && (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleDemoBypass}
                  className="h-11 sm:h-10 rounded-lg sm:rounded border border-[#0078d4] text-[#0078d4] bg-white hover:bg-[#0078d4]/5 active:bg-[#0078d4]/10 text-sm font-medium transition-colors cursor-pointer flex items-center justify-center active:scale-[0.98]"
                >
                  Login with OTP
                </button>

                <button
                  type="button"
                  onClick={handleDemoBypass}
                  className="h-11 sm:h-10 rounded-lg sm:rounded border border-[#d9d9d9] text-[#262626] bg-white hover:bg-slate-50 active:bg-slate-100 text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <GoogleIcon className="w-4 h-4 shrink-0" />
                  <span className="truncate">Continue with Google</span>
                </button>
              </div>
            )}

            {/* Links Row */}
            <div className="flex items-center justify-between pt-1 text-xs text-[#0078d4] gap-2">
              <button
                type="button"
                onClick={() => {
                  alert("Transporter & Driver portal ready!\nSelect 'Driver' in the Role dropdown above.");
                }}
                className="hover:underline cursor-pointer text-left"
              >
                Switch to Transporter Login
              </button>

              <button
                type="button"
                onClick={() => {
                  alert("Demo Credentials:\nPassword is: 'password'\nOr click 'Login with OTP' / 'Log In' directly.");
                }}
                className="text-[#595959] hover:text-[#0078d4] hover:underline cursor-pointer text-right whitespace-nowrap"
              >
                Forgot Password?
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

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-[#595959]">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-[#0078d4] font-medium hover:underline cursor-pointer"
              >
                Request a demo
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export both named LoginPage and default FleetLogin for complete compatibility
export { LoginPage as FleetLogin };
export default LoginPage;