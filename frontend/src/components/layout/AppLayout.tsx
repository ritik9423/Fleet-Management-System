import { useState } from "react"
import { Outlet, Link, useLocation } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { Navbar } from "./Navbar"
import { LayoutDashboard, Truck, MapPin, Navigation, MoreHorizontal, X, Radio } from "lucide-react"
import { useAuth } from "@/lib/AuthContext"

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const { user } = useAuth()
  const role = user?.role || "ADMIN"

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#f4f6fa] text-slate-900 font-sans">
      {/* Desktop Sidebar (hidden on screens < lg) */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer content */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            <div className="absolute top-4 right-3 z-30">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Close Navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar onNavigate={() => setMobileMenuOpen(false)} isMobile />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onToggleMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-2.5 sm:p-5 lg:p-7 pb-20 lg:pb-7 bg-[#f4f6fa]">
          <div className="max-w-[1440px] mx-auto space-y-4 sm:space-y-5">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#e8ecf4] px-1 sm:px-2 py-1 flex items-center justify-around lg:hidden shadow-[0_-2px_12px_rgba(0,0,0,0.04)]">
          <Link
            to="/"
            className={`flex flex-col items-center gap-0.5 py-1 px-1.5 sm:px-3 rounded-xl text-[9px] sm:text-[10px] font-bold transition-colors ${
              location.pathname === "/" ? "text-[#0078d4]" : "text-slate-400 hover:text-slate-800"
            }`}
          >
            <LayoutDashboard className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/map"
            className={`flex flex-col items-center gap-0.5 py-1 px-1.5 sm:px-3 rounded-xl text-[9px] sm:text-[10px] font-bold transition-colors ${
              location.pathname === "/map" ? "text-[#0078d4]" : "text-slate-400 hover:text-slate-800"
            }`}
          >
            <MapPin className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            <span>Radar</span>
          </Link>
          <Link
            to="/trips"
            className={`flex flex-col items-center gap-0.5 py-1 px-1.5 sm:px-3 rounded-xl text-[9px] sm:text-[10px] font-bold transition-colors ${
              location.pathname === "/trips" ? "text-[#0078d4]" : "text-slate-400 hover:text-slate-800"
            }`}
          >
            <Navigation className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            <span>Trips</span>
          </Link>
          {role === "DRIVER" ? (
            <Link
              to="/duty"
              className={`flex flex-col items-center gap-0.5 py-1 px-1.5 sm:px-3 rounded-xl text-[9px] sm:text-[10px] font-bold transition-colors ${
                location.pathname === "/duty" ? "text-emerald-600 font-extrabold" : "text-slate-400 hover:text-slate-800"
              }`}
            >
              <Radio className={`h-4 w-4 sm:h-4.5 sm:w-4.5 ${location.pathname === "/duty" ? "text-emerald-600 animate-pulse" : ""}`} />
              <span>Duty</span>
            </Link>
          ) : (
            <Link
              to="/vehicles"
              className={`flex flex-col items-center gap-0.5 py-1 px-1.5 sm:px-3 rounded-xl text-[9px] sm:text-[10px] font-bold transition-colors ${
                location.pathname === "/vehicles" ? "text-[#0078d4]" : "text-slate-400 hover:text-slate-800"
              }`}
            >
              <Truck className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              <span>Fleet</span>
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-0.5 py-1 px-1.5 sm:px-3 rounded-xl text-[9px] sm:text-[10px] font-bold text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <MoreHorizontal className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            <span>More</span>
          </button>
        </nav>
      </div>
    </div>
  )
}
