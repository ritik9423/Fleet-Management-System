import type { ReactNode } from "react"
import { Navigate, Link } from "react-router-dom"
import { useAuth } from "@/lib/AuthContext"
import { ShieldAlert, ArrowLeft, Lock } from "lucide-react"
import type { Role } from "@/types"

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: Role[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth()

  // 1. If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  // 2. If role is not allowed for this route, show enterprise access restricted page
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl bg-white border border-[#eef2f6] shadow-xl p-8 text-center space-y-5">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-[#e3effb] border border-[#d1e2f2] flex items-center justify-center text-[#0078d4] shadow-sm">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 mb-2">
              <Lock className="h-3 w-3" />
              ACCESS RESTRICTED (ROLE: {user.role})
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Permission Required
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              Your account with role <span className="font-bold text-slate-800">{user.role}</span> does not have authorization to view this module.
              Please switch to an authorized role or contact your Fleet Administrator.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0078d4] hover:bg-[#0069ba] text-white text-xs font-bold shadow-md shadow-[#0078d4]/25 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to My Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
