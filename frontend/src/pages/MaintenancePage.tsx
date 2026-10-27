import { useState, useEffect } from "react"
import { Wrench, Plus, CheckCircle, Activity, IndianRupee, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { api } from "@/lib/api"
import type { MaintenanceRecord, MaintenanceType } from "@/types"

export function MaintenancePage() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([])

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newRecord, setNewRecord] = useState({
    vehiclePlate: "MP40ZC7182",
    serviceType: "OIL_CHANGE" as MaintenanceType,
    description: "",
    cost: 4500,
    scheduledDate: "2026-10-18",
  })

  useEffect(() => {
    api.get("/maintenance")
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          const mapped: MaintenanceRecord[] = res.data.map((r: any) => ({
            id: r.id,
            vehicleId: r.vehicleId || 1,
            vehiclePlate: r.vehiclePlate || "DL-01-AX-1001",
            serviceType: (r.type || r.serviceType || "ROUTINE_SERVICE") as MaintenanceType,
            type: (r.type || r.serviceType || "ROUTINE_SERVICE") as MaintenanceType,
            description: r.notes || r.description || "Preventative maintenance inspection.",
            notes: r.notes || r.description || "Preventative maintenance inspection.",
            cost: r.cost != null ? Number(r.cost) : 250,
            scheduledDate: r.scheduledDate ? String(r.scheduledDate) : "2026-10-20",
            completedDate: r.completedDate ? String(r.completedDate) : undefined,
            status: r.status || "SCHEDULED",
          }))
          setRecords(mapped)
        }
      })
      .catch(() => {})
  }, [])

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      vehicleId: 1,
      type: newRecord.serviceType,
      scheduledDate: newRecord.scheduledDate,
      notes: newRecord.description,
    }

    const localRecord: MaintenanceRecord = {
      id: Date.now(),
      vehicleId: 1,
      vehiclePlate: newRecord.vehiclePlate,
      serviceType: newRecord.serviceType,
      type: newRecord.serviceType,
      description: newRecord.description,
      notes: newRecord.description,
      cost: Number(newRecord.cost) || 250,
      scheduledDate: newRecord.scheduledDate,
      status: "SCHEDULED",
    }

    try {
      const res = await api.post("/maintenance", payload)
      if (res.data) {
        const created: MaintenanceRecord = {
          id: res.data.id || Date.now(),
          vehicleId: res.data.vehicleId || 1,
          vehiclePlate: res.data.vehiclePlate || newRecord.vehiclePlate,
          serviceType: (res.data.type || newRecord.serviceType) as MaintenanceType,
          type: (res.data.type || newRecord.serviceType) as MaintenanceType,
          description: res.data.notes || newRecord.description,
          notes: res.data.notes || newRecord.description,
          cost: res.data.cost != null ? Number(res.data.cost) : Number(newRecord.cost),
          scheduledDate: String(res.data.scheduledDate || newRecord.scheduledDate),
          status: res.data.status || "SCHEDULED",
        }
        setRecords([created, ...records])
      } else {
        setRecords([localRecord, ...records])
      }
    } catch {
      setRecords([localRecord, ...records])
    }
    setIsAddModalOpen(false)
  }

  const handleCompleteRecord = async (id: number) => {
    const updated = records.map((r) =>
      r.id === id
        ? {
            ...r,
            status: "COMPLETED" as const,
            completedDate: new Date().toISOString().substring(0, 10),
          }
        : r
    )
    try {
      await api.put(`/maintenance/${id}/complete`, {})
    } catch {}
    setRecords(updated)
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <Wrench className="h-3 w-3 text-amber-600" />
              Workshop & Overhaul Log
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900">
            Maintenance & Service Workshop
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Preventative maintenance scheduling, workshop service tickets, and garage expenditure telemetry.
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 bg-[#5542f6] hover:bg-[#4332d9] text-white w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Schedule Service
        </Button>
      </div>

      <div className="grid gap-3.5 sm:gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {records.map((record) => (
          <div
            key={record.id}
            className="rounded-2xl bg-white border border-[#eef2f6] p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between pb-3 gap-2">
                <div className="min-w-0">
                  <span className="inline-block mb-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 truncate">
                    {(record.serviceType || record.type || "ROUTINE_SERVICE").replace(/_/g, " ")}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 font-mono group-hover:text-[#0078d4] transition-colors truncate">
                    {record.vehiclePlate || `Unit #${record.vehicleId}`}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">Ticket #{record.id}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold shrink-0 ${
                    record.status === "COMPLETED"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : record.status === "IN_PROGRESS"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-sky-50 text-sky-700 border border-sky-200"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      record.status === "COMPLETED"
                        ? "bg-emerald-500"
                        : record.status === "IN_PROGRESS"
                        ? "bg-amber-500 animate-pulse"
                        : "bg-sky-500"
                    }`}
                  />
                  {(record.status || "SCHEDULED").replace(/_/g, " ")}
                </span>
              </div>

              <div className="space-y-2.5 sm:space-y-3 pt-1 text-xs">
                <p className="text-slate-600 line-clamp-2 leading-relaxed bg-[#f8fafc] p-2 sm:p-2.5 rounded-xl border border-slate-100">
                  {record.description || record.notes || "Preventative maintenance inspection."}
                </p>

                <div className="space-y-2 bg-[#f8fafc] p-2.5 sm:p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      Scheduled Date
                    </span>
                    <span className="font-mono text-slate-800 font-semibold">{record.scheduledDate}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <IndianRupee className="h-3 w-3 text-emerald-600" />
                      Workshop Cost
                    </span>
                    <span className="font-mono font-bold text-emerald-600 text-sm">
                      ₹{record.cost != null ? Number(record.cost).toLocaleString('en-IN') : "4,500"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-3 border-t border-slate-100">
              {record.status !== "COMPLETED" ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                  onClick={() => handleCompleteRecord(record.id)}
                >
                  Complete Service Ticket
                </Button>
              ) : (
                <div className="text-center text-[11px] text-emerald-700 font-semibold py-1.5 flex items-center justify-center gap-1.5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                  Completed on {record.completedDate}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Schedule Workshop Service"
        description="Book a vehicle for preventative maintenance or unscheduled overhaul."
      >
        <form onSubmit={handleCreateRecord} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">Vehicle License Plate</label>
              <Input
                required
                value={newRecord.vehiclePlate}
                onChange={(e) => setNewRecord({ ...newRecord, vehiclePlate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">Service Type</label>
              <select
                className="flex h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-1.5 text-sm text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0078d4]"
                value={newRecord.serviceType}
                onChange={(e) =>
                  setNewRecord({ ...newRecord, serviceType: e.target.value as MaintenanceType })
                }
              >
                <option value="OIL_CHANGE">Oil Change</option>
                <option value="TIRE_ROTATION">Tire Rotation</option>
                <option value="BRAKE_SERVICE">Brake Service</option>
                <option value="ENGINE_SERVICE">Engine Service</option>
                <option value="FULL_SERVICE">Full Service</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">Description of Work</label>
            <Input
              required
              placeholder="e.g. 15,000 km routine engine oil & filter service"
              value={newRecord.description}
              onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">Estimated Cost (₹)</label>
              <Input
                type="number"
                required
                value={newRecord.cost}
                onChange={(e) => setNewRecord({ ...newRecord, cost: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">Scheduled Date</label>
              <Input
                type="date"
                required
                value={newRecord.scheduledDate}
                onChange={(e) => setNewRecord({ ...newRecord, scheduledDate: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-5 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#0078d4] hover:bg-[#0069ba] text-white font-semibold shadow-sm shadow-[#0078d4]/25">
              Confirm & Book Service
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
