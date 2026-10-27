import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Truck,
  Users,
  Navigation,
  Wrench,
  BarChart3,
  MapPin,
  Radio,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/AuthContext"

import type { Role } from "@/types"

interface NavItem {
  name: string
  href: string
  icon: any
  roles: Role[]
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["ADMIN", "DISPATCHER", "DRIVER"] },
  { name: "Duty Mode (Phone GPS)", href: "/duty", icon: Radio, roles: ["DRIVER"] },
  { name: "Vehicles", href: "/vehicles", icon: Truck, roles: ["ADMIN", "DISPATCHER"] },
  { name: "Drivers", href: "/drivers", icon: Users, roles: ["ADMIN", "DISPATCHER"] },
  { name: "Trips", href: "/trips", icon: Navigation, roles: ["ADMIN", "DISPATCHER", "DRIVER"] },
  { name: "Maintenance", href: "/maintenance", icon: Wrench, roles: ["ADMIN", "DISPATCHER"] },
  { name: "Live Fleet Map", href: "/map", icon: MapPin, roles: ["ADMIN", "DISPATCHER", "DRIVER"] },
  { name: "Analytics", href: "/analytics", icon: BarChart3, roles: ["ADMIN"] },
]

interface SidebarProps {
  onNavigate?: () => void
  isMobile?: boolean
}

export function Sidebar({ onNavigate, isMobile }: SidebarProps = {}) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const activeRole: Role = user?.role || "ADMIN"
  const visibleNavigation = navigation.filter((item) => item.roles.includes(activeRole))

  const handleLogout = () => {
    onNavigate?.()
    logout()
    navigate("/login")
  }

  const getRoleDisplay = () => {
    switch (user?.role) {
      case "ADMIN":
        return "COMPANY ADMIN"
      case "DISPATCHER":
        return "OPERATIONS DISPATCHER"
      case "DRIVER":
        return "FIELD DRIVER"
      default:
        return "FLEET OPERATOR"
    }
  }

  const isCollapsed = isMobile ? false : collapsed

  return (
    <aside
      className={cn(
        "border-r border-[#e8ecf4] bg-white flex flex-col shrink-0 z-20 transition-all duration-300 h-full",
        isMobile ? "w-full" : isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header matching Login Page */}
      <div className="h-20 flex items-center px-4.5 gap-3 border-b border-[#f1f5f9]">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-3 overflow-hidden group">
          <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#0078d4] shadow-[0_4px_16px_rgba(0,120,212,0.35)] shrink-0 group-hover:scale-105 transition-transform">
            <Truck size={20} strokeWidth={2.4} className="text-white" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">
                Fleet<span className="text-[#0078d4]">Ops</span>
              </h1>
              <p className="mt-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase truncate">
                {getRoleDisplay()}
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Links (Filtered by Role) */}
      <div className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto">
        {visibleNavigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-[13px] font-semibold transition-all duration-200",
                isActive
                  ? "bg-[#0078d4] text-white shadow-lg shadow-[#0078d4]/30"
                  : "text-[#475569] hover:bg-[#e3effb]/70 hover:text-[#0078d4]"
              )}
            >
              <item.icon
                className={cn(
                  "h-4.5 w-4.5 shrink-0 transition-transform duration-200",
                  isActive ? "text-white" : "text-[#64748b] group-hover:text-[#0078d4]"
                )}
              />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </Link>
          )
        })}
      </div>

      {/* Footer Navigation */}
      <div className="p-3 border-t border-[#f1f5f9] space-y-1">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold text-[#64748b] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>

        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-3.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold text-slate-400 hover:text-slate-700 hover:bg-[#f8fafc] transition-colors cursor-pointer"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 shrink-0 mx-auto" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span>Collapse</span>
              </>
            )}
          </button>
        )}
      </div>
    </aside>
  )
}
