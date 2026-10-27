import { useState } from "react"
import { Bell, Search, LogOut, ChevronDown, KeyRound, UserCheck, CheckCircle2, Menu, Truck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/AuthContext"
import { Link, useNavigate } from "react-router-dom"

interface NavbarProps {
  onSearch?: (query: string) => void
  onToggleMobileMenu?: () => void
}

export function Navbar({ onSearch, onToggleMobileMenu }: NavbarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return "COMPANY ADMIN"
      case "DISPATCHER":
        return "OPERATIONS DISPATCHER"
      case "DRIVER":
        return "FIELD DRIVER"
      default:
        return "COMPANY ADMIN"
    }
  }

  const displayName = user?.username && user.username !== "admin" ? user.username : "Ritik Kumar"

  return (
    <header className="h-16 border-b border-[#eef2f6] bg-white px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Left controls: Hamburger on mobile + Brand */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-[#f8fafc] transition-colors cursor-pointer shrink-0"
          title="Open Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0078d4] text-white shadow-sm shadow-[#0078d4]/30 shrink-0">
            <Truck size={17} strokeWidth={2.4} />
          </div>
          <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 shrink-0">
            Fleet<span className="text-[#0078d4]">Ops</span>
          </span>
        </Link>

        {/* Search Input (Hidden on mobile < sm, visible on desktop) */}
        <div className="relative hidden sm:block w-56 md:w-80 ml-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search fleet assets, routes, drivers..."
            className="pl-9 h-9 rounded-xl bg-[#f8fafc] border-[#e2e8f0] text-slate-800 placeholder:text-slate-400 focus-visible:border-[#0078d4] focus-visible:ring-[#0078d4]/15 text-xs transition-all shadow-none"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Telemetry Alert Ping */}
        <button
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-[#f8fafc] transition-colors cursor-pointer"
          title="Telematics & Maintenance Alerts"
        >
          <Bell className="h-4.5 w-4.5 text-slate-600" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#0078d4] ring-2 ring-white" />
        </button>

        <div className="h-5 w-px bg-slate-200 hidden xs:block" />

        {/* User Profile */}
        <div className="relative">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#f8fafc] transition-all cursor-pointer"
            >
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-[#0078d4] text-white font-bold flex items-center justify-center text-xs sm:text-sm shadow-sm shadow-[#0078d4]/30 shrink-0">
                {displayName.charAt(0).toUpperCase() || "R"}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {displayName}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  {getRoleLabel(user?.role)}
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden md:block" />
            </button>

            {/* Direct Logout Icon button (Desktop only, mobile has it in dropdown & drawer) */}
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer hidden sm:block"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {/* User Menu Dropdown */}
          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div
                className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-24px)] rounded-2xl bg-white border border-[#e2e8f0] shadow-xl shadow-slate-200/50 p-2 z-50 text-xs"
                onMouseLeave={() => setDropdownOpen(false)}
              >
              <div className="px-3 py-2.5 border-b border-slate-100">
                <div className="font-bold text-slate-900 capitalize">{displayName}</div>
                <div className="text-[11px] text-slate-400 truncate">{user?.email || "ritik@fleetops.com"}</div>
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0078d4]/10 text-[#0078d4] font-bold text-[10px]">
                  <CheckCircle2 className="h-3 w-3" />
                  {user?.role || "ADMIN"} ACCESS
                </div>
              </div>

              <div className="py-1.5">
                <Link
                  to="/login"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-slate-600 hover:text-[#0078d4] hover:bg-slate-50 rounded-xl transition-colors font-medium"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Switch Account / Login</span>
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-slate-600 hover:text-[#0078d4] hover:bg-slate-50 rounded-xl transition-colors font-medium"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Register New Operator</span>
                </Link>
              </div>

              <div className="pt-1.5 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-semibold cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </>
        )}
        </div>
      </div>
    </header>
  )
}

