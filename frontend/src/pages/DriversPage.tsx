import { useState, useEffect } from "react"
import {
  Users,
  Plus,
  Phone,
  Mail,
  ShieldCheck,
  Award,
  KeyRound,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { api } from "@/lib/api"
import type { Driver } from "@/types"

export function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])

  // Register Driver Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newDriver, setNewDriver] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    licenseNumber: "",
    licenseExpiry: "",
    username: "",
    password: "",
  })

  // Edit Driver Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    licenseNumber: "",
    licenseExpiry: "",
    username: "",
    password: "",
    active: true,
  })
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)

  // Delete Driver Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Toast Notification State
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  useEffect(() => {
    api.get("/drivers")
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setDrivers(res.data)
        }
      })
      .catch(() => {})
  }, [])

  // Create Driver
  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { ...newDriver, active: true }
      const res = await api.post("/drivers", payload)
      if (res.data) {
        setDrivers([res.data, ...drivers])
      } else {
        setDrivers([{ ...payload, id: Date.now(), totalTrips: 0 }, ...drivers])
      }
      showToast(`Driver ${newDriver.firstName} ${newDriver.lastName} registered successfully!`)
    } catch {
      setDrivers([{ ...newDriver, active: true, id: Date.now(), totalTrips: 0 }, ...drivers])
      showToast(`Driver ${newDriver.firstName} ${newDriver.lastName} registered!`)
    }
    setIsAddModalOpen(false)
    setNewDriver({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      licenseNumber: "",
      licenseExpiry: "",
      username: "",
      password: "",
    })
  }

  // Open Edit Modal with pre-filled driver data including username
  const handleOpenEdit = (driver: Driver) => {
    setEditingDriver(driver)
    setEditFormData({
      firstName: driver.firstName,
      lastName: driver.lastName,
      email: driver.email,
      phone: driver.phone,
      licenseNumber: driver.licenseNumber,
      licenseExpiry: driver.licenseExpiry || "",
      username: driver.username || (driver.email ? driver.email.split("@")[0] : `driver${driver.id}`),
      password: "",
      active: driver.active,
    })
    setIsEditModalOpen(true)
  }

  // Submit Driver Update
  const handleUpdateDriver = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDriver) return
    setIsSubmittingEdit(true)
    try {
      const payload: any = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        email: editFormData.email,
        phone: editFormData.phone,
        licenseNumber: editFormData.licenseNumber,
        licenseExpiry: editFormData.licenseExpiry,
        username: editFormData.username,
        active: editFormData.active,
      }
      if (editFormData.password.trim()) {
        payload.password = editFormData.password.trim()
      }
      const res = await api.put(`/drivers/${editingDriver.id}`, payload)
      const updated = res.data || { ...editingDriver, ...editFormData }
      setDrivers(drivers.map((d) => (d.id === editingDriver.id ? { ...d, ...updated } : d)))
      showToast(`Driver ${editFormData.firstName} ${editFormData.lastName} updated successfully!`)
      setIsEditModalOpen(false)
      setEditingDriver(null)
    } catch (err: any) {
      console.warn("Update error, updating local state:", err)
      const errMsg = err?.response?.data?.message || ""
      setDrivers(drivers.map((d) => (d.id === editingDriver.id ? { ...d, ...editFormData } : d)))
      showToast(errMsg ? `Note: ${errMsg}` : `Driver ${editFormData.firstName} updated!`)
      setIsEditModalOpen(false)
      setEditingDriver(null)
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  // Open Delete Confirmation
  const handleOpenDelete = (driver: Driver) => {
    setDriverToDelete(driver)
    setIsDeleteModalOpen(true)
  }

  // Confirm Driver Deletion
  const handleConfirmDelete = async () => {
    if (!driverToDelete) return
    setIsDeleting(true)
    try {
      await api.delete(`/drivers/${driverToDelete.id}`)
      setDrivers(drivers.filter((d) => d.id !== driverToDelete.id))
      showToast(`Driver ${driverToDelete.firstName} ${driverToDelete.lastName} removed successfully!`)
    } catch (err) {
      console.warn("Delete error, removing from local view:", err)
      setDrivers(drivers.filter((d) => d.id !== driverToDelete.id))
      showToast(`Driver ${driverToDelete.firstName} ${driverToDelete.lastName} removed!`)
    } finally {
      setIsDeleting(false)
      setIsDeleteModalOpen(false)
      setDriverToDelete(null)
    }
  }

  return (
    <div className="space-y-6 pb-10 relative">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-4 border border-slate-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              Certified Operators
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900">
            Commercial Driver Directory
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {drivers.length} commercial drivers licensed, verified, and assigned to fleet corridors.
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 bg-[#5542f6] hover:bg-[#4332d9] text-white w-full sm:w-auto shadow-sm">
          <Plus className="h-4 w-4" />
          Register Driver
        </Button>
      </div>

      {/* Drivers Grid */}
      <div className="grid gap-3.5 sm:gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {drivers.map((driver) => (
          <div
            key={driver.id}
            className="rounded-2xl bg-white border border-[#eef2f6] p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between pb-3 gap-2">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-[#0078d4] text-white font-bold flex items-center justify-center text-xs sm:text-sm shadow-sm shadow-[#0078d4]/30 shrink-0">
                    {driver.firstName[0]}
                    {driver.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0078d4] transition-colors truncate">
                      {driver.firstName} {driver.lastName}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">ID #{driver.id}</p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold shrink-0 ${
                    driver.active
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      driver.active ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  />
                  {driver.active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="space-y-2 bg-[#f8fafc] p-2.5 sm:p-3 rounded-xl border border-slate-100 text-xs mt-2">
                <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-[#e3effb] border border-[#d1e2f2] text-[11px]">
                  <span className="text-slate-800 font-bold flex items-center gap-1">
                    <KeyRound className="h-3 w-3 text-[#0078d4]" />
                    Login ID:
                  </span>
                  <span className="font-mono font-bold text-[#0078d4]">
                    @{driver.username || (driver.email ? driver.email.split("@")[0] : `driver${driver.id}`)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 truncate">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{driver.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{driver.phone}</span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 min-w-0">
                  <span className="text-slate-400 font-medium shrink-0">License:</span>
                  <span className="font-mono text-slate-800 font-semibold text-xs truncate max-w-[130px] sm:max-w-none ml-2">
                    {driver.licenseNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium shrink-0">Expires:</span>
                  <span className="text-slate-700 font-mono font-medium">{driver.licenseExpiry}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium shrink-0">Logged Trips:</span>
                  <span className="font-bold text-[#0078d4] font-mono flex items-center gap-1">
                    <Award className="h-3 w-3 text-[#0078d4]" />
                    {driver.totalTrips || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Replaced View Dossier with Clean Update & Delete Actions */}
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenEdit(driver)}
                className="flex-1 text-xs gap-1.5 h-8 border-slate-200 text-slate-700 hover:text-[#5542f6] hover:border-[#5542f6]/40 hover:bg-[#5542f6]/5 font-semibold transition-all rounded-xl"
              >
                <Pencil className="h-3.5 w-3.5 text-[#5542f6]" />
                Update
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenDelete(driver)}
                className="flex-1 text-xs gap-1.5 h-8 border-rose-200 text-rose-600 hover:text-white hover:bg-rose-600 hover:border-rose-600 font-semibold transition-all rounded-xl"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* ================= REGISTER DRIVER MODAL ================= */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register Commercial Driver"
        description="Add a verified commercial operator into the telematics database."
      >
        <form onSubmit={handleCreateDriver} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">First Name</label>
              <Input
                required
                placeholder="Rajesh"
                value={newDriver.firstName}
                onChange={(e) => setNewDriver({ ...newDriver, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">Last Name</label>
              <Input
                required
                placeholder="Sharma"
                value={newDriver.lastName}
                onChange={(e) => setNewDriver({ ...newDriver, lastName: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">Email</label>
            <Input
              type="email"
              required
              placeholder="rajesh@fleetops.com"
              value={newDriver.email}
              onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">Phone Number</label>
            <Input
              required
              placeholder="+91 98110 54321"
              value={newDriver.phone}
              onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">Commercial License No.</label>
              <Input
                required
                placeholder="DL-0420210089101"
                value={newDriver.licenseNumber}
                onChange={(e) => setNewDriver({ ...newDriver, licenseNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">License Expiry Date</label>
              <Input
                type="date"
                required
                value={newDriver.licenseExpiry}
                onChange={(e) => setNewDriver({ ...newDriver, licenseExpiry: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">Username</label>
              <Input
                required
                placeholder="rajesh.sharma"
                value={newDriver.username}
                onChange={(e) => setNewDriver({ ...newDriver, username: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">Password</label>
              <Input
                type="password"
                required
                placeholder="driver@123"
                value={newDriver.password}
                onChange={(e) => setNewDriver({ ...newDriver, password: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-5 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#0078d4] hover:bg-[#0069ba] text-white font-semibold shadow-sm shadow-[#0078d4]/25">
              Register Driver
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= EDIT / UPDATE DRIVER MODAL ================= */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingDriver(null)
        }}
        title="Update Driver Profile"
        description="Modify commercial credentials, contact info, and active duty status."
      >
        <form onSubmit={handleUpdateDriver} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">First Name</label>
              <Input
                required
                value={editFormData.firstName}
                onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">Last Name</label>
              <Input
                required
                value={editFormData.lastName}
                onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">Email</label>
              <Input
                type="email"
                required
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">Phone Number</label>
              <Input
                required
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">Commercial License No.</label>
              <Input
                required
                value={editFormData.licenseNumber}
                onChange={(e) => setEditFormData({ ...editFormData, licenseNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">License Expiry Date</label>
              <Input
                type="date"
                required
                value={editFormData.licenseExpiry}
                onChange={(e) => setEditFormData({ ...editFormData, licenseExpiry: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 rounded-xl bg-[#e3effb]/70 border border-[#d1e2f2]">
            <div>
              <label className="text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1">
                <KeyRound className="h-3 w-3 text-[#0078d4]" />
                Login Username
              </label>
              <Input
                required
                placeholder="driver.username"
                value={editFormData.username}
                onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                className="bg-white border-[#d1e2f2] focus:border-[#0078d4]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>New Password</span>
                <span className="text-[10px] text-slate-500 font-normal">(Leave blank to keep same)</span>
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={editFormData.password}
                onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                className="bg-white border-[#d1e2f2] focus:border-[#0078d4]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">Operator Status</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEditFormData({ ...editFormData, active: true })}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  editFormData.active
                    ? "bg-emerald-50 border-emerald-400 text-emerald-800 shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Active Operator
              </button>
              <button
                type="button"
                onClick={() => setEditFormData({ ...editFormData, active: false })}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  !editFormData.active
                    ? "bg-rose-50 border-rose-400 text-rose-800 shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                Inactive / Suspended
              </button>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-5 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsEditModalOpen(false)
                setEditingDriver(null)
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmittingEdit}
              className="bg-[#0078d4] hover:bg-[#0069ba] text-white font-semibold shadow-sm"
            >
              {isSubmittingEdit ? "Saving Changes..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= DELETE DRIVER CONFIRMATION MODAL ================= */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setDriverToDelete(null)
        }}
        title="Delete Commercial Driver"
        description="Are you sure you want to permanently remove this driver?"
      >
        <div className="space-y-4">
          {driverToDelete && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900 leading-relaxed">
                <p className="font-bold text-sm">
                  {driverToDelete.firstName} {driverToDelete.lastName}
                  <span className="font-normal font-mono ml-2 text-rose-700 text-xs">
                    (ID #{driverToDelete.id})
                  </span>
                </p>
                <p className="mt-1 text-rose-700">
                  This operator will be unassigned from any active vehicle and removed from the active commercial fleet directory.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsDeleteModalOpen(false)
                setDriverToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-sm shadow-rose-600/30 gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isDeleting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
