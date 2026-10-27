import { useState, useEffect } from "react"
import { Navigation, Plus, CheckCircle, Activity, MapPin, Gauge, Truck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/AuthContext"
import type { Trip, TripStatus } from "@/types"

export function TripsPage() {
  const { user } = useAuth()
  const role = user?.role || "ADMIN"

  const [trips, setTrips] = useState<Trip[]>([])

  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [completeForm, setCompleteForm] = useState({
    endMileage: 0,
    notes: "",
  })

  const [dispatchForm, setDispatchForm] = useState({
    vehicleId: 10507651,
    vehiclePlate: "MP40ZC7182",
    driverId: 1,
    driverName: "Corridor Pilot",
    startLocation: "",
    endLocation: "",
    startMileage: 40110,
  })

  useEffect(() => {
    const fetchTrips = async () => {
      // If role is DRIVER, strictly fetch only trips assigned to this driver
      if (role === "DRIVER") {
        try {
          const res = await api.get("/trips")
          if (Array.isArray(res.data)) {
            const mapped: Trip[] = res.data.map((t: any) => ({
              id: t.id,
              vehicleId: t.vehicleId,
              vehiclePlate: t.vehiclePlate || "ASSIGNED-UNIT",
              vehicleModel: t.vehicleModel || "Commercial Hauler",
              driverId: t.driverId,
              driverName: t.driverName || user?.username || "Driver",
              startLocation: t.origin || t.startLocation || "Depot Logistics Hub",
              endLocation: t.destination || t.endLocation || "Destination Freight Hub",
              startTime: t.startTime ? new Date(t.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Active Run",
              startMileage: Math.round(t.startOdometer || t.startMileage || 0),
              distanceCovered: t.distance || t.distanceCovered || 0,
              status: t.status as any,
              notes: t.notes,
            }))
            setTrips(mapped)
          }
        } catch (e) {
          console.warn("Driver trips fetch error:", e)
        }
        return
      }

      // Admin & Dispatcher: Full fleet active runs & dispatches
      try {
        const res = await api.get("/map/intouch/overview")
        const ov = res.data
        if (ov && Array.isArray(ov.activeDispatches) && ov.activeDispatches.length > 0) {
            const mapped: Trip[] = ov.activeDispatches.map((d: any) => ({
              id: d.id,
              vehicleId: d.vehicleId,
              vehiclePlate: d.vehiclePlate,
              vehicleModel: d.vehicleType,
              driverId: d.id,
              driverName: "Corridor Pilot",
              startLocation: d.currentLocation || "Depot Logistics Hub",
              endLocation: "Central Logistics Corridor (NH-46)",
              startTime: d.timestamp ? new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Active Run",
              startMileage: Math.round(d.odometer),
              distanceCovered: d.todayKms,
              status: d.status as any,
            }))
            setTrips(mapped)
            return
          }
      } catch (e) {
        console.warn("InTouch trips error:", e)
      }

      api.get("/trips")
        .then((res) => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            setTrips(res.data)
          }
        })
        .catch(() => {})
    }
    fetchTrips()
  }, [role, user?.username])

  const handleStartTrip = async (e: React.FormEvent) => {
    e.preventDefault()
    const newTrip: Trip = {
      id: Date.now(),
      vehicleId: dispatchForm.vehicleId,
      vehiclePlate: dispatchForm.vehiclePlate,
      driverId: dispatchForm.driverId,
      driverName: dispatchForm.driverName,
      startLocation: dispatchForm.startLocation,
      endLocation: dispatchForm.endLocation,
      startTime: new Date().toISOString().replace("T", " ").substring(0, 16),
      startMileage: Number(dispatchForm.startMileage),
      status: "IN_PROGRESS",
    }

    try {
      const res = await api.post("/trips", {
        vehicleId: dispatchForm.vehicleId,
        driverId: dispatchForm.driverId,
        startLocation: dispatchForm.startLocation,
        endLocation: dispatchForm.endLocation,
        startMileage: dispatchForm.startMileage,
      })
      if (res.data) {
        setTrips([res.data, ...trips])
      } else {
        setTrips([newTrip, ...trips])
      }
    } catch {
      setTrips([newTrip, ...trips])
    }

    setIsDispatchModalOpen(false)
    setDispatchForm({
      vehicleId: 1,
      vehiclePlate: "DL-01-AX-1001",
      driverId: 1,
      driverName: "Rajesh Sharma",
      startLocation: "",
      endLocation: "",
      startMileage: 12450,
    })
  }

  const handleCompleteTrip = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTrip) return

    const distance = Math.max(0, completeForm.endMileage - selectedTrip.startMileage)
    const updatedTrips = trips.map((t) =>
      t.id === selectedTrip.id
        ? {
            ...t,
            endMileage: completeForm.endMileage,
            distanceCovered: distance,
            endTime: new Date().toISOString().replace("T", " ").substring(0, 16),
            status: "COMPLETED" as TripStatus,
            notes: completeForm.notes,
          }
        : t
    )

    try {
      await api.put(`/trips/${selectedTrip.id}/complete`, completeForm)
    } catch {
      // optimistic update
    }

    setTrips(updatedTrips)
    setIsCompleteModalOpen(false)
    setSelectedTrip(null)
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-[#e3effb] text-[#0078d4] border border-[#d1e2f2]">
              <Activity className="h-3 w-3 text-[#0078d4]" />
              {role === "DRIVER" ? "Driver Consignments" : "Active Consignments"}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900">
            {role === "DRIVER" ? "My Assigned Journeys" : "Trip Dispatch & Journey Control"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {role === "DRIVER"
              ? "Monitor route waypoints, record arrival mileage, and mark consignment completions."
              : "Monitor route trajectories, dispatch fresh cargo assignments, and reconcile mileage."}
          </p>
        </div>
        {role !== "DRIVER" && (
          <Button onClick={() => setIsDispatchModalOpen(true)} className="gap-2 bg-[#0078d4] hover:bg-[#0069ba] text-white shadow-sm shadow-[#0078d4]/25 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Dispatch New Journey
          </Button>
        )}
      </div>

      {/* Trips Table */}
      <div className="rounded-2xl bg-white border border-[#eef2f6] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        {/* Mobile View: Dedicated Responsive Cards (NO Side Scrolling) */}
        <div className="block md:hidden divide-y divide-slate-100 p-3 space-y-3">
          {trips.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs font-medium">
              No trips registered yet.
            </div>
          ) : (
            trips.map((trip) => (
              <div
                key={trip.id}
                className="rounded-xl border border-slate-200/90 bg-white p-3.5 space-y-2.5 shadow-xs transition-all hover:border-[#0078d4]/40"
              >
                {/* Header: ID + Status */}
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-[#0078d4] bg-[#e3effb] border border-[#d1e2f2] px-2 py-0.5 rounded-md">
                    #{trip.id}
                  </span>
                  {trip.status === "IN_PROGRESS" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                      In Progress
                    </span>
                  ) : trip.status === "COMPLETED" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle className="h-3 w-3 text-emerald-600" />
                      Delivered
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      Cancelled
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
                      <div className="text-[10px] text-slate-400">Assigned Driver</div>
                    </div>
                    <div className="h-7 w-7 rounded-full bg-[#e3effb] text-[#0078d4] font-bold flex items-center justify-center text-xs shrink-0">
                      {trip.driverName?.charAt(0) || "D"}
                    </div>
                  </div>
                </div>

                {/* Corridor */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="text-slate-600 truncate">{trip.startLocation}</span>
                    <span className="text-[#0078d4] font-bold shrink-0">➔</span>
                    <span className="text-slate-900 font-semibold truncate">{trip.endLocation}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                    <span>Departed: {trip.startTime}</span>
                    <span className="font-bold text-slate-700">
                      {trip.distanceCovered ? `${trip.distanceCovered} km` : "Tracking..."}
                    </span>
                  </div>
                </div>

                {/* Complete Trip Action for En Route */}
                {trip.status === "IN_PROGRESS" && (
                  <Button
                    size="sm"
                    className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedTrip(trip)
                      setCompleteForm({
                        endMileage: trip.startMileage + 50,
                        notes: "",
                      })
                      setIsCompleteModalOpen(true)
                    }}
                  >
                    Complete Trip
                  </Button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Wide Table (Hidden on mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-600 min-w-[700px]">
            <thead className="bg-[#f8fafc] text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-[#f1f5f9]">
              <tr>
                <th className="px-4 sm:px-6 py-3 sm:py-3.5">Trip ID</th>
                <th className="px-4 sm:px-6 py-3 sm:py-3.5">Vehicle</th>
                <th className="px-4 sm:px-6 py-3 sm:py-3.5">Driver</th>
                <th className="px-4 sm:px-6 py-3 sm:py-3.5">Route Corridor</th>
                <th className="px-4 sm:px-6 py-3 sm:py-3.5">Distance</th>
                <th className="px-4 sm:px-6 py-3 sm:py-3.5">Status</th>
                <th className="px-4 sm:px-6 py-3 sm:py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {trips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400 text-xs font-medium">
                    No trips registered yet.
                  </td>
                </tr>
              ) : (
                trips.map((trip) => (
                <tr key={trip.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="px-6 py-4 font-mono font-bold text-[#0078d4] group-hover:text-[#004578]">
                    #{trip.id}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 font-mono group-hover:text-[#0078d4] transition-colors">
                      {trip.vehiclePlate}
                    </div>
                    <div className="text-xs text-slate-400">{trip.vehicleModel}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">{trip.driverName}</td>
                  <td className="px-6 py-4">
                    <div className="text-xs flex items-center gap-1.5 font-medium">
                      <span className="text-slate-500">{trip.startLocation}</span>
                      <span className="text-[#0078d4] font-bold">➔</span>
                      <span className="text-slate-900 font-semibold">{trip.endLocation}</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      Departed: {trip.startTime}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">
                    {trip.distanceCovered ? (
                      <span className="font-bold text-emerald-600">
                        {trip.distanceCovered} km
                      </span>
                    ) : (
                      <span className="text-slate-400">Tracking...</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {trip.status === "IN_PROGRESS" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                        In Progress
                      </span>
                    ) : trip.status === "COMPLETED" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="h-3 w-3 text-emerald-600" />
                        Delivered
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        Cancelled
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {trip.status === "IN_PROGRESS" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs hover:border-emerald-500 hover:text-emerald-700"
                        onClick={() => {
                          setSelectedTrip(trip)
                          setCompleteForm({
                            endMileage: trip.startMileage + 50,
                            notes: "",
                          })
                          setIsCompleteModalOpen(true)
                        }}
                      >
                        Complete Trip
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Dispatch Modal */}
      <Modal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        title="Dispatch Consignment Journey"
        description="Select vehicle, assigned driver, and origin/destination waypoint."
      >
        <form onSubmit={handleStartTrip} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">Vehicle License Plate</label>
              <Input
                required
                value={dispatchForm.vehiclePlate}
                onChange={(e) => setDispatchForm({ ...dispatchForm, vehiclePlate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">Driver Name</label>
              <Input
                required
                value={dispatchForm.driverName}
                onChange={(e) => setDispatchForm({ ...dispatchForm, driverName: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">Origin Terminal</label>
              <Input
                required
                placeholder="e.g. Delhi IGI Cargo Terminal Hub"
                value={dispatchForm.startLocation}
                onChange={(e) => setDispatchForm({ ...dispatchForm, startLocation: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">Destination Waypoint</label>
              <Input
                required
                placeholder="e.g. Gurugram Manesar Freight Hub"
                value={dispatchForm.endLocation}
                onChange={(e) => setDispatchForm({ ...dispatchForm, endLocation: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">Departure Odometer (km)</label>
            <Input
              type="number"
              required
              value={dispatchForm.startMileage}
              onChange={(e) => setDispatchForm({ ...dispatchForm, startMileage: Number(e.target.value) })}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-5 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsDispatchModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#0078d4] hover:bg-[#0069ba] text-white font-semibold shadow-sm shadow-[#0078d4]/25">
              Authorize & Dispatch
            </Button>
          </div>
        </form>
      </Modal>

      {/* Complete Trip Modal */}
      <Modal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        title="Complete Trip & Close Route"
        description={`Record arrival mileage for trip #${selectedTrip?.id} (${selectedTrip?.vehiclePlate}).`}
      >
        <form onSubmit={handleCompleteTrip} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">Final Arrival Odometer (km)</label>
            <Input
              type="number"
              required
              min={selectedTrip?.startMileage || 0}
              value={completeForm.endMileage}
              onChange={(e) => setCompleteForm({ ...completeForm, endMileage: Number(e.target.value) })}
            />
            {selectedTrip && (
              <p className="text-[11px] text-slate-500 mt-1.5 font-mono">
                Start was: <span className="text-[#5542f6] font-bold">{selectedTrip.startMileage} km</span> • Computed Distance:{" "}
                <span className="text-emerald-600 font-bold">
                  {Math.max(0, completeForm.endMileage - selectedTrip.startMileage)} km
                </span>
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">Journey & Delivery Notes</label>
            <Input
              placeholder="e.g. Delivered on time without damage"
              value={completeForm.notes}
              onChange={(e) => setCompleteForm({ ...completeForm, notes: e.target.value })}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-5 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsCompleteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Reconcile & Close Journey
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
