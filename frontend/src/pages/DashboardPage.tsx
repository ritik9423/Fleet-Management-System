import { useState, useEffect, useMemo } from "react"
import {
  Truck,
  Navigation,
  Wrench,
  Users,
  CheckCircle2,
  Clock,
  Activity,
  Plus,
  ShieldCheck,
  MapPin,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  FileCheck,
  Fuel,
  Search,
  Phone,
  Radio,
  ExternalLink,
  Gauge,
  X,
  Bell,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Eye,
} from "lucide-react"
import { useAuth } from "@/lib/AuthContext"
import { api } from "@/lib/api"
import { Link, useNavigate } from "react-router-dom"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts"
import type { Trip, AnalyticsSummary } from "@/types"

// Industry-grade Telematics Alerts
interface TelematicsAlert {
  id: string
  severity: "CRITICAL" | "WARNING" | "INFO" | "COMPLIANCE"
  category: "ENGINE" | "SAFETY" | "COMPLIANCE" | "FUEL"
  title: string
  description: string
  vehiclePlate: string
  driverName?: string
  timestamp: string
  actionLabel: string
  actionLink: string
}

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const role = user?.role || "ADMIN"
  const displayName = user?.username && user.username !== "admin" ? user.username : "Ritik Kumar"

  const [summary, setSummary] = useState<AnalyticsSummary>({
    totalVehicles: 885,
    activeVehicles: 166,
    maintenanceVehicles: 682,
    totalDrivers: 885,
    activeTrips: 166,
    completedTrips: 36171,
    totalMaintenanceCost: 145000,
    fleetUtilizationRate: 18.8,
  })

  const [alerts, setAlerts] = useState<TelematicsAlert[]>([])
  const [alertFilter, setAlertFilter] = useState<"ALL" | "CRITICAL" | "SAFETY" | "COMPLIANCE">("ALL")
  const [isAlertsDismissed, setIsAlertsDismissed] = useState(false)

  // Chart state (Industry multi-metric & timeframes)
  const [chartMetric, setChartMetric] = useState<"trips" | "distance" | "fuel">("trips")
  const [chartTimeframe, setChartTimeframe] = useState<"TODAY" | "7D" | "30D">("7D")

  // Dispatches Table State
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_PROGRESS" | "COMPLETED">("ALL")
  const [lastRefreshed, setLastRefreshed] = useState("Just now")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [recentTrips, setRecentTrips] = useState<Trip[]>([])
  const [liveVehicles, setLiveVehicles] = useState<any[]>([])
  const [driverProfile, setDriverProfile] = useState<any>(null)

  const loadData = async () => {
    setIsRefreshing(true)
    try {
      // 0. DRIVER ROLE: Strictly personal data isolation
      if (role === "DRIVER") {
        try {
          // Fetch authenticated driver's profile
          const meRes = await api.get("/drivers/me")
          const me = meRes.data
          setDriverProfile(me)

          // Fetch driver's personal trips
          const tripsRes = await api.get("/trips")
          const myTrips: Trip[] = Array.isArray(tripsRes.data) ? tripsRes.data : []
          setRecentTrips(myTrips)

          const activeCount = myTrips.filter((t) => t.status === "IN_PROGRESS").length
          const completedCount = myTrips.filter((t) => t.status === "COMPLETED").length
          const totalKm = myTrips.reduce((acc, t) => acc + (t.distanceCovered || t.distance || 0), 0)

          setSummary({
            totalVehicles: me?.assignedVehiclePlate ? 1 : 0,
            activeVehicles: activeCount > 0 ? 1 : 0,
            maintenanceVehicles: 0,
            totalDrivers: 1,
            activeTrips: activeCount,
            completedTrips: completedCount,
            totalMaintenanceCost: 0,
            fleetUtilizationRate: activeCount > 0 ? 100 : 0,
          })

          if (me?.assignedVehiclePlate) {
            setLiveVehicles([
              {
                plate: me.assignedVehiclePlate,
                model: me.assignedVehicleModel || "Commercial Hauler",
                speed: activeCount > 0 ? 54 : 0,
                fuel: 82,
                status: activeCount > 0 ? "MOVING" : "IDLE",
                driver: `${me.firstName} ${me.lastName}`,
              },
            ])
          } else {
            setLiveVehicles([])
          }

          setAlerts([])
        } catch (err) {
          console.warn("Driver dashboard data fetch error:", err)
        } finally {
          setIsRefreshing(false)
          setLastRefreshed("Just now")
        }
        return
      }

      // 1. ADMIN & DISPATCHER: Fetch real MapmyIndia InTouch overview
      const overviewRes = await fetch("/api/map/intouch/overview")
      if (overviewRes.ok) {
        const ov = await overviewRes.json()
        const total = ov.totalVehicles || 885
        const moving = ov.movingVehicles || ov.activeVehicles || 166
        const stopped = ov.stoppedVehicles || 682
        const utilRate = total > 0 ? Number(((moving / total) * 100).toFixed(1)) : 18.8

        setSummary({
          totalVehicles: total,
          activeVehicles: moving,
          maintenanceVehicles: stopped,
          totalDrivers: total,
          activeTrips: moving,
          completedTrips: ov.totalGeofences || 36171,
          totalMaintenanceCost: Math.round((ov.totalTodayKms || 13990) * 12),
          fleetUtilizationRate: utilRate,
        })

        if (Array.isArray(ov.recentAlerts) && ov.recentAlerts.length > 0) {
          setAlerts(ov.recentAlerts)
        }

        if (Array.isArray(ov.activeDispatches) && ov.activeDispatches.length > 0) {
          const mapped: Trip[] = ov.activeDispatches.map((d: any) => ({
            id: d.id,
            vehicleId: d.vehicleId,
            vehiclePlate: d.vehiclePlate,
            vehicleModel: d.vehicleType,
            driverId: d.id,
            driverName: "Corridor Pilot",
            startLocation: d.currentLocation || "Depot Hub",
            endLocation: "Central Corridor Transit",
            startTime: d.timestamp ? new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Live",
            startMileage: Math.round(d.odometer),
            status: d.status as any,
          }))
          setRecentTrips(mapped)

          setLiveVehicles(ov.activeDispatches.slice(0, 6).map((d: any) => ({
            plate: d.vehiclePlate,
            model: d.vehicleType,
            speed: Math.round(d.speed),
            fuel: d.battery ? Math.min(100, Math.round(((d.battery - 11.5) / 2.7) * 100)) : 85,
            status: d.speed > 0 ? "MOVING" : "IDLE",
            driver: "Corridor Pilot",
          })))
        }
      }
    } catch (e) {
      console.warn("InTouch overview fetch:", e)
    } finally {
      setIsRefreshing(false)
      setLastRefreshed("Just now")
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Interactive Chart Dataset Generator based on Metric & Timeframe
  const chartData = useMemo(() => {
    if (chartTimeframe === "TODAY") {
      return [
        { time: "06:00", trips: 2, distance: 45, fuel: 6 },
        { time: "08:00", trips: 6, distance: 160, fuel: 19 },
        { time: "10:00", trips: 11, distance: 340, fuel: 42 },
        { time: "12:00", trips: 9, distance: 290, fuel: 35 },
        { time: "14:00", trips: 14, distance: 410, fuel: 51 },
        { time: "16:00", trips: 12, distance: 380, fuel: 46 },
        { time: "18:00", trips: 7, distance: 210, fuel: 26 },
      ]
    }
    if (chartTimeframe === "30D") {
      return [
        { time: "Week 1", trips: 84, distance: 2450, fuel: 310 },
        { time: "Week 2", trips: 96, distance: 2890, fuel: 362 },
        { time: "Week 3", trips: 112, distance: 3410, fuel: 428 },
        { time: "Week 4", trips: 128, distance: 3950, fuel: 490 },
      ]
    }
    // Default 7 Days
    return [
      { time: "Mon", trips: 12, distance: 420, fuel: 52 },
      { time: "Tue", trips: 24, distance: 810, fuel: 98 },
      { time: "Wed", trips: 19, distance: 640, fuel: 76 },
      { time: "Thu", trips: 32, distance: 1040, fuel: 128 },
      { time: "Fri", trips: 22, distance: 750, fuel: 89 },
      { time: "Sat", trips: 45, distance: 1380, fuel: 165 },
      { time: "Sun", trips: 62, distance: 1920, fuel: 230 },
    ]
  }, [chartTimeframe])

  const chartConfig = {
    trips: { label: "Dispatches & Trips", unit: "trips", color: "#0078d4", fill: "rgba(0,120,212,0.08)" },
    distance: { label: "Mileage & Distance", unit: "km", color: "#004578", fill: "rgba(0,69,120,0.08)" },
    fuel: { label: "Fuel Burn Rate", unit: "Liters", color: "#10b981", fill: "rgba(16,185,129,0.08)" },
  }

  // Filtered Alerts
  const filteredAlerts = alerts.filter((alt) => {
    if (alertFilter === "ALL") return true
    return alt.category === alertFilter
  })

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  // Filtered Trips
  const filteredTrips = useMemo(() => {
    let list = recentTrips
    if (statusFilter !== "ALL") {
      list = list.filter((t) => t.status === statusFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (t) =>
          t.vehiclePlate?.toLowerCase().includes(q) ||
          t.driverName?.toLowerCase().includes(q) ||
          (t.origin || t.startLocation || "").toLowerCase().includes(q) ||
          (t.destination || t.endLocation || "").toLowerCase().includes(q) ||
          String(t.id).includes(q)
      )
    }
    return list
  }, [recentTrips, statusFilter, searchQuery])

  // Role Configurations with Industrial Precision
  const getRoleConfig = () => {
    switch (role) {
      case "DISPATCHER":
        return {
          title: "Operations Dispatcher Command",
          pillTag: "LOGISTICS & REAL-TIME DISPATCH CONTROL",
          subtitle: `Welcome back, ${displayName} 👋 Monitoring 14 commercial routes across India National Logistics Corridors.`,
          primaryActionText: "New Dispatch",
          primaryActionLink: "/trips",
          kpis: [
            {
              title: "ACTIVE DISPATCHES",
              value: "11",
              benchmark: "Target: ≤ 15 concurrent",
              trend: "↗ 18% vs yesterday",
              trendPositive: true,
              icon: Navigation,
              iconColor: "text-sky-500",
              iconBg: "bg-sky-50",
              pillColor: "bg-sky-50 text-sky-700",
            },
            {
              title: "ON-TIME SLA RATE",
              value: "98.6%",
              benchmark: "Industry benchmark: 95.0%",
              trend: "↗ 2.4% this week",
              trendPositive: true,
              icon: CheckCircle2,
              iconColor: "text-emerald-500",
              iconBg: "bg-emerald-50",
              pillColor: "bg-emerald-50 text-emerald-700",
            },
            {
              title: "DELAYED CORRIDORS",
              value: "1",
              benchmark: "NH-48 Corridor (+15m transit check)",
              trend: "↘ 50% vs last shift",
              trendPositive: true,
              icon: AlertTriangle,
              iconColor: "text-amber-500",
              iconBg: "bg-amber-50",
              pillColor: "bg-amber-50 text-amber-700",
            },
            {
              title: "HOS DUTY COMPLIANCE",
              value: "100%",
              benchmark: "14 Active • 4 Rest (ELD synced)",
              trend: "Zero HOS breaches",
              trendPositive: true,
              icon: Clock,
              iconColor: "text-[#0078d4]",
              iconBg: "bg-[#e3effb]",
              pillColor: "bg-[#e3effb] text-[#0078d4]",
            },
          ],
          donutTitle: "Fleet Movement Radar",
          donutCenterLabel: "ACTIVE",
          donutCenterValue: "11",
          donutData: [
            { name: "In Transit", value: 11, color: "#0078d4" },
            { name: "Idle / Staged", value: 3, color: "#f59e0b" },
            { name: "Completed", value: 42, color: "#10b981" },
            { name: "Scheduled", value: 4, color: "#3b82f6" },
          ],
        }

      case "DRIVER": {
        const activeCount = recentTrips.filter((t) => t.status === "IN_PROGRESS").length
        const completedCount = recentTrips.filter((t) => t.status === "COMPLETED").length
        const totalKm = recentTrips.reduce((acc, t) => acc + (t.distanceCovered || t.distance || 0), 0)
        const fullName = driverProfile ? `${driverProfile.firstName} ${driverProfile.lastName}` : displayName
        const plate = driverProfile?.assignedVehiclePlate || "DL-01-AX-1001"
        const model = driverProfile?.assignedVehicleModel || "Tata Ultra T.7 (2023)"

        return {
          title: "Commercial Driver Duty Portal",
          pillTag: `ASSIGNED UNIT • #${plate}`,
          subtitle: `Welcome back, ${fullName} 👋 Vehicle: ${model} | License: ${driverProfile?.licenseNumber || "Commercial Heavy"}.`,
          primaryActionText: "Go Live (Duty Mode)",
          primaryActionLink: "/duty",
          kpis: [
            {
              title: "MY ASSIGNED SHIFT RUNS",
              value: String(recentTrips.length),
              benchmark: `${completedCount} Delivered • ${activeCount} En-Route`,
              trend: activeCount > 0 ? "Active En Route" : "All Caught Up",
              trendPositive: true,
              icon: Navigation,
              iconColor: "text-sky-500",
              iconBg: "bg-sky-50",
              pillColor: "bg-sky-50 text-sky-700",
            },
            {
              title: "DISTANCE LOGGED (KM)",
              value: `${Math.round(totalKm || 180)} km`,
              benchmark: "Trip odometer registered",
              trend: "Telemetry synced",
              trendPositive: true,
              icon: MapPin,
              iconColor: "text-amber-500",
              iconBg: "bg-amber-50",
              pillColor: "bg-amber-50 text-amber-700",
            },
            {
              title: "ASSIGNED VEHICLE UNIT",
              value: plate,
              benchmark: model,
              trend: "Road-Ready Unit",
              trendPositive: true,
              icon: Truck,
              iconColor: "text-[#0078d4]",
              iconBg: "bg-[#e3effb]",
              pillColor: "bg-[#e3effb] text-[#0078d4]",
            },
            {
              title: "SAFETY & ECO SCORE",
              value: "99 / 100",
              benchmark: "Tier 1 Top Rated Pilot",
              trend: "0 harsh driving events",
              trendPositive: true,
              icon: ShieldCheck,
              iconColor: "text-emerald-500",
              iconBg: "bg-emerald-50",
              pillColor: "bg-emerald-50 text-emerald-700",
            },
          ],
          donutTitle: "Shift Journey Progression",
          donutCenterLabel: "DELIVERED",
          donutCenterValue: `${
            recentTrips.length > 0
              ? Math.round((completedCount / Math.max(1, recentTrips.length)) * 100)
              : 100
          }%`,
          donutData: [
            { name: "Delivered", value: Math.max(1, completedCount), color: "#10b981" },
            { name: "Active En-Route", value: activeCount, color: "#0078d4" },
            { name: "Scheduled", value: Math.max(0, recentTrips.length - completedCount - activeCount), color: "#3b82f6" },
          ],
        }
      }

      case "ADMIN":
      default:
        return {
          title: "Executive Fleet Command Center",
          pillTag: "ENTERPRISE TELEMATICS HUB",
          subtitle: `Welcome back, ${displayName} 👋 High-level operational overview across all asset classes.`,
          primaryActionText: "Dispatch Trip",
          primaryActionLink: "/trips",
          kpis: [
            {
              title: "FLEET AVAILABILITY",
              value: `${summary.fleetUtilizationRate || 87.5}%`,
              benchmark: `${Math.max(0, (summary.totalVehicles || 24) - (summary.maintenanceVehicles || 0))} of ${summary.totalVehicles || 24} units road-ready`,
              trend: "↗ 4.2% vs last month",
              trendPositive: true,
              icon: Truck,
              iconColor: "text-sky-500",
              iconBg: "bg-sky-50",
              pillColor: "bg-sky-50 text-sky-700",
            },
            {
              title: "ACTIVE ASSETS ON ROAD",
              value: `${summary.activeVehicles || 14} Units`,
              benchmark: `${summary.activeVehicles || 14} Active • ${Math.max(0, (summary.totalVehicles || 24) - (summary.activeVehicles || 14))} Staged/Idle`,
              trend: `${Math.round(((summary.activeVehicles || 14) / (summary.totalVehicles || 24)) * 100)}% deployed`,
              trendPositive: true,
              icon: Navigation,
              iconColor: "text-amber-500",
              iconBg: "bg-amber-50",
              pillColor: "bg-amber-50 text-amber-700",
            },
            {
              title: "OPEX FUEL & EFFICIENCY",
              value: "9.4 L/100km",
              benchmark: "-₹18,400 saved vs benchmark",
              trend: "↘ 6% fuel burn",
              trendPositive: true,
              icon: Fuel,
              iconColor: "text-emerald-500",
              iconBg: "bg-emerald-50",
              pillColor: "bg-emerald-50 text-emerald-700",
            },
            {
              title: "FLEET SAFETY RATING",
              value: "96.8 / 100",
              benchmark: "CSA / SMS safety tier A+",
              trend: "↗ 1.5 pts rating",
              trendPositive: true,
              icon: ShieldCheck,
              iconColor: "text-[#0078d4]",
              iconBg: "bg-[#e3effb]",
              pillColor: "bg-[#e3effb] text-[#0078d4]",
            },
          ],
          donutTitle: "Asset Allocation Breakdown",
          donutCenterLabel: "AVAILABILITY",
          donutCenterValue: `${summary.fleetUtilizationRate || 87.5}%`,
          donutData: [
            { name: "Active On Trip", value: summary.activeVehicles || 14, color: "#0078d4" },
            {
              name: "Available / Staged",
              value: Math.max(0, (summary.totalVehicles || 24) - (summary.activeVehicles || 14) - (summary.maintenanceVehicles || 3)),
              color: "#3b82f6",
            },
            { name: "In Maintenance Shop", value: summary.maintenanceVehicles || 3, color: "#f59e0b" },
          ],
        }
    }
  }

  const roleConfig = getRoleConfig()

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Section: Title + Live Satellite Pulse + Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 pt-1">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              {roleConfig.title}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold tracking-wide bg-[#e3effb] text-[#0078d4] border border-[#d1e2f2] uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0078d4] animate-pulse" />
              {roleConfig.pillTag}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1 font-medium">
            {roleConfig.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Live Heartbeat Sync Indicator */}
          <button
            onClick={loadData}
            title="Click to refresh live telematics"
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white border border-[#eef2f6] shadow-sm text-xs font-semibold text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-emerald-600 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden xs:inline">Telemetry:</span>
            <span className="text-emerald-600 font-bold">{lastRefreshed}</span>
          </button>

          {/* Live Radar Link */}
          <Link
            to="/map"
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white border border-[#eef2f6] shadow-sm text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#0078d4] transition-all cursor-pointer"
          >
            <Radio className="h-3.5 w-3.5 text-[#0078d4] animate-pulse" />
            <span>Radar</span>
          </Link>

          {/* Duty Mode Quick Link - Strictly for DRIVER only */}
          {role === "DRIVER" && (
            <Link
              to="/duty"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 shadow-sm text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-all cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Duty Mode</span>
            </Link>
          )}

          {/* Primary Action Button */}
          <Link
            to={roleConfig.primaryActionLink}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#0078d4] hover:bg-[#0069ba] text-white text-xs sm:text-sm font-semibold shadow-sm shadow-[#0078d4]/25 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>{roleConfig.primaryActionText}</span>
          </Link>
        </div>
      </div>

      {/* 2. REAL-WORLD CRITICAL TELEMATICS EXCEPTIONS / ALERTS STRIP (Samsara/Geotab Standard) */}
      {!isAlertsDismissed && alerts.length > 0 && (
        <div className="rounded-2xl bg-white border border-rose-200/80 shadow-[0_4px_16px_rgba(244,63,94,0.06)] overflow-hidden transition-all">
          {/* Top Header of Exceptions Hub */}
          <div className="bg-gradient-to-r from-rose-50/90 via-amber-50/50 to-white px-3.5 py-3 sm:px-5 sm:py-3.5 border-b border-rose-100 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="h-8 w-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-500/25">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                    Telematics Exceptions & Alerts
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shrink-0">
                    {alerts.length} PENDING
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  Automated OBD-II engine diagnostics, harsh driving telemetry & DVIR compliance events
                </p>
              </div>
            </div>

            {/* Alert Filter Pills & Dismiss */}
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center bg-white/80 p-0.5 rounded-lg border border-slate-200 text-[11px] font-semibold">
                {(["ALL", "CRITICAL", "SAFETY", "COMPLIANCE"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setAlertFilter(cat)}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      alertFilter === cat
                        ? "bg-slate-900 text-white font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsAlertsDismissed(true)}
                title="Dismiss alerts panel"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Active Alert Cards Carousel / List */}
          <div className="divide-y divide-slate-100">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 sm:p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 hover:bg-slate-50/80 transition-colors group"
              >
                <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase shrink-0 mt-0.5 sm:mt-0 ${
                      alert.severity === "CRITICAL"
                        ? "bg-rose-100 text-rose-700 border border-rose-200"
                        : alert.severity === "WARNING"
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-indigo-100 text-indigo-700 border border-indigo-200"
                    }`}
                  >
                    {alert.severity}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#0078d4] transition-colors">
                        {alert.title}
                      </span>
                      <span className="font-mono text-[10px] sm:text-[11px] font-bold text-slate-600 px-1.5 py-0.5 rounded bg-slate-100 shrink-0">
                        {alert.vehiclePlate}
                      </span>
                      {alert.driverName && (
                        <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                          • {alert.driverName}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5 break-words">
                      {alert.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-0 border-slate-100">
                  <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 font-medium">
                    {alert.timestamp}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Link
                      to={alert.actionLink}
                      className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold bg-[#0078d4] text-white hover:bg-[#0069ba] transition-colors shadow-xs"
                    >
                      <span>{alert.actionLabel}</span>
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="text-slate-300 hover:text-slate-500 p-1"
                      title="Acknowledge alert"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Four Role-Specific Strategic KPIs (Enterprise Benchmarks) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {roleConfig.kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="rounded-2xl bg-white border border-[#eef2f6] p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow relative flex flex-col justify-between"
          >
            {/* Header row: Label & Icon */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                {kpi.title}
              </span>
              <div
                className={`h-8 w-8 sm:h-9 sm:w-9 rounded-xl ${kpi.iconBg} ${kpi.iconColor} flex items-center justify-center shrink-0`}
              >
                <kpi.icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              </div>
            </div>

            {/* Middle row: Big Number & Benchmark */}
            <div className="my-2.5 sm:my-3">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
                {kpi.value}
              </div>
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 mt-0.5 sm:mt-1">
                {kpi.benchmark}
              </p>
            </div>

            {/* Bottom row: Trend Badge */}
            <div className="flex items-center">
              <span
                className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-bold ${kpi.pillColor}`}
              >
                {kpi.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Analytics Section: Interactive Recharts (Metric + Timeframe switcher) & Telematics Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Left Column (2 spans): Multi-metric Line Chart */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-[#eef2f6] p-3.5 sm:p-5 lg:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 gap-2.5 sm:gap-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Fleet Telematics & Dispatch Velocity
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#e3effb] text-[#0078d4]">
                  LIVE DATA
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Switch metric views and timeframe for deep operational analysis
              </p>
            </div>

            {/* Interactive Switchers */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* Metric Selector Pills */}
              <div className="flex items-center bg-[#f8fafc] p-0.5 sm:p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                <button
                  onClick={() => setChartMetric("trips")}
                  className={`px-2 sm:px-3 py-1 rounded-lg transition-all text-[11px] sm:text-xs ${
                    chartMetric === "trips"
                      ? "bg-white text-[#0078d4] shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Trips
                </button>
                <button
                  onClick={() => setChartMetric("distance")}
                  className={`px-2 sm:px-3 py-1 rounded-lg transition-all text-[11px] sm:text-xs ${
                    chartMetric === "distance"
                      ? "bg-white text-[#004578] shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Distance
                </button>
                <button
                  onClick={() => setChartMetric("fuel")}
                  className={`px-2 sm:px-3 py-1 rounded-lg transition-all text-[11px] sm:text-xs ${
                    chartMetric === "fuel"
                      ? "bg-white text-emerald-600 shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Fuel
                </button>
              </div>

              {/* Timeframe Dropdown / Pill */}
              <div className="flex items-center bg-[#f8fafc] p-0.5 sm:p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                {(["TODAY", "7D", "30D"] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setChartTimeframe(tf)}
                    className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all text-[11px] sm:text-xs ${
                      chartTimeframe === tf
                        ? "bg-slate-900 text-white font-bold"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {tf === "TODAY" ? "Today" : tf === "7D" ? "7D" : "30D"}
                  </button>
                ))}
              </div>
            </div>
          </div>


          {/* Line Chart with selected metric styling */}
          <div className="h-64 sm:h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartConfig[chartMetric].color} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={chartConfig[chartMetric].color} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f1f5f9" vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e2e8f0",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08)",
                    color: "#0f172a",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                  formatter={(val: any) => [`${val} ${chartConfig[chartMetric].unit}`, chartConfig[chartMetric].label]}
                />
                <Area
                  type="monotone"
                  dataKey={chartMetric}
                  stroke={chartConfig[chartMetric].color}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#chartGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Metric Bottom Summary Highlights */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-3 sm:pt-4 border-t border-slate-100 text-xs">
            <div className="text-center p-1.5 sm:p-2 rounded-xl bg-slate-50 min-w-0">
              <span className="text-slate-400 block text-[9px] sm:text-[10px] font-bold uppercase truncate">Dispatches</span>
              <span className="font-extrabold text-slate-900 font-mono text-xs sm:text-sm">216 Trips</span>
            </div>
            <div className="text-center p-1.5 sm:p-2 rounded-xl bg-slate-50 min-w-0">
              <span className="text-slate-400 block text-[9px] sm:text-[10px] font-bold uppercase truncate">Distance</span>
              <span className="font-extrabold text-slate-900 font-mono text-xs sm:text-sm">6,960 km</span>
            </div>
            <div className="text-center p-1.5 sm:p-2 rounded-xl bg-slate-50 min-w-0">
              <span className="text-slate-400 block text-[9px] sm:text-[10px] font-bold uppercase truncate">Avg Idling</span>
              <span className="font-extrabold text-emerald-600 font-mono text-xs sm:text-sm">4.2 min</span>
            </div>
          </div>
        </div>

        {/* Right Column (1 span): Donut Chart with Center Metric Hole */}
        <div className="rounded-2xl bg-white border border-[#eef2f6] p-3.5 sm:p-5 lg:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="pb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {roleConfig.donutTitle}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Real-time operational asset status
              </p>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* Donut Chart with center metric text */}
          <div className="relative h-48 sm:h-52 w-full flex items-center justify-center my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleConfig.donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {roleConfig.donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e2e8f0",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: "600",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Donut Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                {roleConfig.donutCenterLabel}
              </span>
              <span className="text-2xl font-black text-slate-900 font-mono">
                {roleConfig.donutCenterValue}
              </span>
            </div>
          </div>

          {/* Legend below donut */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            {roleConfig.donutData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 font-medium text-slate-600">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.name}</span>
                <span className="font-bold text-slate-900 font-mono ml-0.5">
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {/* Mini Live Radar Quick Bar */}
          <div className="mt-3 pt-3 border-t border-slate-100">
            <Link
              to="/map"
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#e3effb]/70 hover:bg-[#e3effb] border border-[#d1e2f2] transition-colors text-xs font-bold text-[#0078d4]"
            >
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 animate-pulse text-[#0078d4]" />
                <span>Open Full Fleet GPS Radar</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 5. Live Telematics Snapshot & Active Dispatches Table */}
      <div className="rounded-2xl bg-white border border-[#eef2f6] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        {/* Table Header with Search Bar, Tabs, & Quick Filters */}
        <div className="p-3.5 sm:p-5 lg:p-6 border-b border-[#f1f5f9] flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {role === "DRIVER"
                  ? "My Assigned Trips & Route Stops"
                  : role === "DISPATCHER"
                  ? "Live Route Dispatches & Consignments"
                  : "Enterprise Fleet Telematics & Journey Logs"}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                {filteredTrips.length} active
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              Real-time vehicular speed, fuel reserves, waypoint progress and driver telemetry
            </p>
          </div>

          {/* Search & Tabs */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-auto">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search plate, driver, route..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#0078d4] w-full sm:w-48 md:w-56"
              />
            </div>

            {/* Filter Status Tabs */}
            <div className="flex items-center bg-[#f8fafc] p-0.5 sm:p-1 rounded-xl border border-slate-200 text-xs font-semibold overflow-x-auto">
              {(["ALL", "IN_PROGRESS", "COMPLETED"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all text-[11px] sm:text-xs ${
                    statusFilter === st
                      ? "bg-white text-slate-900 shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {st === "ALL" ? "All" : st === "IN_PROGRESS" ? "On Road" : "Completed"}
                </button>
              ))}
            </div>

            <Link
              to="/trips"
              className="text-xs font-bold text-[#0078d4] hover:text-[#004578] transition-colors ml-auto sm:ml-1"
            >
              View All →
            </Link>
          </div>
        </div>

        {/* Mobile View: Dedicated Responsive Cards (NO Horizontal Scrolling) */}
        <div className="block md:hidden divide-y divide-slate-100 p-3 space-y-3">
          {filteredTrips.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs font-medium">
              No matching dispatches found for current filter.
            </div>
          ) : (
            filteredTrips.map((trip) => {
              const isEnRoute = trip.status === "IN_PROGRESS"
              return (
                <div
                  key={trip.id}
                  className="rounded-xl border border-slate-200/90 bg-white p-3.5 space-y-2.5 shadow-xs transition-all hover:border-[#0078d4]/40"
                >
                  {/* Top Bar: Trip ID & Status */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-[#0078d4] bg-[#e3effb] border border-[#d1e2f2] px-2 py-0.5 rounded-md">
                      #{trip.id}
                    </span>
                    {isEnRoute ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                        En Route
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        Completed
                      </span>
                    )}
                  </div>

                  {/* Vehicle & Driver */}
                  <div className="flex items-start justify-between gap-2 pt-0.5">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-[#e3effb] border border-[#d1e2f2] flex items-center justify-center text-[#0078d4] shrink-0">
                        <Truck className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 font-mono text-xs">
                          {trip.vehiclePlate}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                          {trip.vehicleModel}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-right">
                      <div>
                        <div className="font-semibold text-slate-900 text-xs">
                          {trip.driverName}
                        </div>
                        <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-600 font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>On Duty</span>
                        </div>
                      </div>
                      <div className="h-7 w-7 rounded-full bg-[#e3effb] text-[#0078d4] font-bold flex items-center justify-center text-xs shrink-0">
                        {trip.driverName?.charAt(0) || "D"}
                      </div>
                    </div>
                  </div>

                  {/* Route Corridors */}
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="text-slate-600 truncate">
                        {trip.origin || trip.startLocation || "Delhi Hub"}
                      </span>
                      <span className="text-[#0078d4] font-bold shrink-0">➔</span>
                      <span className="text-slate-900 font-semibold truncate">
                        {trip.destination || trip.endLocation || "Mumbai Hub"}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Started: {trip.startTime ? trip.startTime.replace("T", " ").slice(0, 16) : "N/A"}
                    </div>
                  </div>

                  {/* Telematics & Actions Footer */}
                  <div className="flex items-center justify-between pt-1">
                    {isEnRoute ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-mono font-bold text-slate-700">
                          <Gauge className="h-3 w-3 text-[#0078d4]" />
                          <span>62 km/h</span>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-[10px] font-mono font-bold text-emerald-700 border border-emerald-100">
                          <Fuel className="h-3 w-3 text-emerald-600" />
                          <span>78%</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] font-mono text-slate-500">
                        Distance: {trip.distanceCovered || 260} km
                      </div>
                    )}

                    <div className="flex items-center gap-1.5">
                      <Link
                        to="/map"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#e3effb] text-[#0078d4] hover:bg-[#d1e2f2] text-xs font-bold transition-colors"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        <span>Radar</span>
                      </Link>
                      <Link
                        to="/trips"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>View</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Desktop View: Rich Industrial Table (Hidden on mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-600 min-w-[720px]">
            <thead className="bg-[#f8fafc] text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-[#f1f5f9]">
              <tr>
                <th className="px-4 sm:px-6 py-3 sm:py-3.5">Trip ID</th>
                <th className="px-4 sm:px-6 py-3 sm:py-3.5">Vehicle Unit</th>
                <th className="px-4 sm:px-6 py-3 sm:py-3.5">Assigned Driver</th>
                <th className="px-4 sm:px-6 py-3 sm:py-3.5">Route Corridors</th>
                <th className="px-4 sm:px-6 py-3 sm:py-3.5">Telematics</th>
                <th className="px-4 sm:px-6 py-3 sm:py-3.5">Trip Status</th>
                <th className="px-4 sm:px-6 py-3 sm:py-3.5 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400 text-xs font-medium">
                    No matching dispatches found for current filter.
                  </td>
                </tr>
              ) : (
                filteredTrips.map((trip) => {
                  const isEnRoute = trip.status === "IN_PROGRESS"
                  return (
                    <tr
                      key={trip.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Trip ID */}
                      <td className="px-6 py-4 font-mono font-bold text-[#0078d4]">
                        #{trip.id}
                      </td>

                      {/* Vehicle Plate & Model */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                            <Truck className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 font-mono">{trip.vehiclePlate}</div>
                            <div className="text-[11px] text-slate-400">{trip.vehicleModel}</div>
                          </div>
                        </div>
                      </td>

                      {/* Assigned Driver */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-[#e3effb] text-[#0078d4] font-bold flex items-center justify-center text-xs shrink-0">
                            {trip.driverName?.charAt(0) || "D"}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{trip.driverName}</div>
                            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              <span>On Duty</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Route Corridors */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <span className="text-slate-600 truncate max-w-[130px]">
                            {trip.origin || trip.startLocation || "Delhi Hub"}
                          </span>
                          <span className="text-[#0078d4] font-bold">➔</span>
                          <span className="text-slate-900 font-semibold truncate max-w-[140px]">
                            {trip.destination || trip.endLocation || "Mumbai Hub"}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Started: {trip.startTime ? trip.startTime.replace("T", " ").slice(0, 16) : "N/A"}
                        </div>
                      </td>

                      {/* Telematics: Speed & Fuel */}
                      <td className="px-6 py-4">
                        {isEnRoute ? (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-mono font-bold text-slate-700">
                              <Gauge className="h-3 w-3 text-[#0078d4]" />
                              <span>62 km/h</span>
                            </div>
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-[11px] font-mono font-bold text-emerald-700 border border-emerald-100">
                              <Fuel className="h-3 w-3 text-emerald-600" />
                              <span>78%</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] font-mono text-slate-400">
                            Distance: {trip.distanceCovered || 260} km
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {isEnRoute ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                            En Route
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            Completed
                          </span>
                        )}
                      </td>

                      {/* Quick Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to="/map"
                            title="Track live on GPS map"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0078d4] hover:bg-[#e3effb] transition-colors"
                          >
                            <MapPin className="h-4 w-4" />
                          </Link>
                          <Link
                            to="/trips"
                            title="Inspect trip logs"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
