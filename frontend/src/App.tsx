import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "@/lib/AuthContext"
import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { DashboardPage } from "@/pages/DashboardPage"
import { VehiclesPage } from "@/pages/VehiclesPage"
import { LiveMapPage } from "@/pages/LiveMapPage"
import { DriversPage } from "@/pages/DriversPage"
import { TripsPage } from "@/pages/TripsPage"
import { MaintenancePage } from "@/pages/MaintenancePage"
import { AnalyticsPage } from "@/pages/AnalyticsPage"
import { DriverDutyPage } from "@/pages/DriverDutyPage"
import { LoginPage } from "@/pages/LoginPage"
import { RegisterPage } from "@/pages/RegisterPage"

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<RegisterPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Application Layout with Role-Based Access Control */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Common Routes - Available to all authenticated roles with customized views */}
            <Route path="/" element={<DashboardPage />} />
            <Route path="/map" element={<LiveMapPage />} />
            <Route path="/trips" element={<TripsPage />} />

            {/* Driver Only - Phone GPS Duty Console */}
            <Route
              path="/duty"
              element={
                <ProtectedRoute allowedRoles={["DRIVER"]}>
                  <DriverDutyPage />
                </ProtectedRoute>
              }
            />

            {/* Admin and Dispatcher Only */}
            <Route
              path="/vehicles"
              element={
                <ProtectedRoute allowedRoles={["ADMIN", "DISPATCHER"]}>
                  <VehiclesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/drivers"
              element={
                <ProtectedRoute allowedRoles={["ADMIN", "DISPATCHER"]}>
                  <DriversPage />
                </ProtectedRoute>
              }
            />

            {/* Admin and Dispatcher Only (Fleet Maintenance Records) */}
            <Route
              path="/maintenance"
              element={
                <ProtectedRoute allowedRoles={["ADMIN", "DISPATCHER"]}>
                  <MaintenancePage />
                </ProtectedRoute>
              }
            />

            {/* Admin Only - Executive Financial Analytics */}
            <Route
              path="/analytics"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback Catch-all Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
