import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts"
import { BarChart3, TrendingUp, IndianRupee, Fuel } from "lucide-react"

const monthlyMetrics = [
  { month: "May", mileage: 24500, fuelCost: 89000, maintenanceCost: 21000 },
  { month: "Jun", mileage: 29800, fuelCost: 104000, maintenanceCost: 18000 },
  { month: "Jul", mileage: 33200, fuelCost: 121000, maintenanceCost: 34000 },
  { month: "Aug", mileage: 31000, fuelCost: 112000, maintenanceCost: 26000 },
  { month: "Sep", mileage: 35600, fuelCost: 130000, maintenanceCost: 19000 },
  { month: "Oct", mileage: 38400, fuelCost: 142000, maintenanceCost: 22000 },
]

export function AnalyticsPage() {
  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-[#e3effb] text-[#0078d4] border border-[#d1e2f2]">
              <BarChart3 className="h-3 w-3 text-[#0078d4]" />
              Telematics Intelligence
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900">
            Fleet Intelligence & Financial Metrics
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Historical trends for fuel economy, workshop maintenance overhead, and total kilometers traversed.
          </p>
        </div>
      </div>

      {/* Highlights Grid */}
      <div className="grid gap-3.5 sm:gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <div className="rounded-2xl bg-white border border-[#eef2f6] p-3.5 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Avg Fuel Cost / KM
            </span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Fuel className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-sans mt-2">₹32.40 / km</div>
            <p className="text-xs text-emerald-600 mt-1 font-semibold flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              -3.8% efficiency improvement
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-[#eef2f6] p-3.5 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
              YTD Fleet Mileage
            </span>
            <div className="h-8 w-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-sans mt-2">192,500 km</div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Across 885 MapmyIndia InTouch IoT fleet units</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-[#eef2f6] p-3.5 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between sm:col-span-2 md:col-span-1">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Maintenance Cost / Asset
            </span>
            <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-sans mt-2">₹42,500</div>
            <p className="text-xs text-emerald-600 mt-1 font-semibold">12% below industry benchmark</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        {/* Monthly Mileage Chart */}
        <div className="rounded-2xl bg-white border border-[#eef2f6] p-3.5 sm:p-5 lg:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="pb-3 sm:pb-4">
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Monthly Distance Traveled (km)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cumulative distance recorded by active fleet across corridors
            </p>
          </div>
          <div className="h-60 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={6} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
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
                />
                <Bar
                  dataKey="mileage"
                  fill="#0078d4"
                  radius={[6, 6, 0, 0]}
                  name="Distance (km)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operating Costs vs Maintenance */}
        <div className="rounded-2xl bg-white border border-[#eef2f6] p-3.5 sm:p-5 lg:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="pb-3 sm:pb-4">
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Operating Expenditure (₹)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Fuel consumption spend vs workshop maintenance expenses
            </p>
          </div>
          <div className="h-60 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={6} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
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
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Line
                  type="monotone"
                  dataKey="fuelCost"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ fill: "#10b981", r: 4 }}
                  name="Fuel Spend (₹)"
                />
                <Line
                  type="monotone"
                  dataKey="maintenanceCost"
                  stroke="#0078d4"
                  strokeWidth={2.5}
                  dot={{ fill: "#0078d4", r: 4 }}
                  name="Maintenance (₹)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
