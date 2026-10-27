import { useState, useEffect, useRef } from "react"
import {
  Radio,
  Play,
  Square,
  Compass,
  Gauge,
  Clock,
  Battery,
  AlertTriangle,
  MapPin,
  Truck,
  ExternalLink,
  RotateCcw,
  Coffee,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Sparkles,
} from "lucide-react"
import { useAuth } from "@/lib/AuthContext"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Link } from "react-router-dom"
import L from "leaflet"

// Global Mappls SDK declaration
declare global {
  interface Window {
    mappls?: any
    MapmyIndia?: any
  }
}

interface DutySessionState {
  driverUsername: string
  driverName: string
  vehiclePlate: string
  lastLatitude: number | null
  lastLongitude: number | null
  lastSpeed: number
  lastHeading: number
  accuracy: number | null
  batteryLevel: number
  dutyStartTime: number | null
  lastPingTimestamp: number | null
  totalDistanceKm: number
  status: "OFF_DUTY" | "ON_DUTY" | "DRIVING" | "STOPPED" | "TRAFFIC_DELAY" | "REST_BREAK" | "EMERGENCY_SOS"
  notes?: string
}

// Sample route coordinates for simulation mode (Indore - Ujjain Highway corridor)
const SIMULATION_WAYPOINTS = [
  { lat: 22.7196, lng: 75.8577, speed: 0 },
  { lat: 22.7285, lng: 75.8642, speed: 28 },
  { lat: 22.7412, lng: 75.8731, speed: 45 },
  { lat: 22.7598, lng: 75.8824, speed: 58 },
  { lat: 22.7815, lng: 75.8912, speed: 64 },
  { lat: 22.8052, lng: 75.9015, speed: 72 },
  { lat: 22.8310, lng: 75.9124, speed: 68 },
  { lat: 22.8564, lng: 75.9231, speed: 55 },
  { lat: 22.8790, lng: 75.9340, speed: 40 },
  { lat: 22.9012, lng: 75.9450, speed: 25 },
  { lat: 22.9234, lng: 75.9567, speed: 60 },
  { lat: 22.9510, lng: 75.9702, speed: 65 },
  { lat: 22.9801, lng: 75.9845, speed: 52 },
  { lat: 23.0112, lng: 76.0012, speed: 48 },
]

// Global Haversine distance calculator in KM
function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function DriverDutyPage() {
  const { user } = useAuth()
  const driverUsername = user?.username || "rajesh.sharma"
  const defaultDriverName = user?.username ? (user.username.charAt(0).toUpperCase() + user.username.slice(1)) : "Rajesh Sharma"

  const [isOnDuty, setIsOnDuty] = useState(false)
  const [vehiclePlate, setVehiclePlate] = useState("MP09AB1234")
  const [isPlateDropdownOpen, setIsPlateDropdownOpen] = useState(false)
  const [driverName, setDriverName] = useState(defaultDriverName)
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [speedKmh, setSpeedKmh] = useState(0)
  const [heading, setHeading] = useState(0)
  const [accuracyM, setAccuracyM] = useState<number | null>(null)
  const [batteryLevel, setBatteryLevel] = useState(92)
  const [distanceKm, setDistanceKm] = useState(0)
  const [statusNote, setStatusNote] = useState<string>("Normal Route")
  const [currentDutyStatus, setCurrentDutyStatus] = useState<DutySessionState["status"]>("OFF_DUTY")
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isSimulating, setIsSimulating] = useState(false)
  const [lastBroadcastTime, setLastBroadcastTime] = useState<Date | null>(null)
  const [isBroadcasting, setIsBroadcasting] = useState(false)
  const [quickAlertToast, setQuickAlertToast] = useState<string | null>(null)
  const [gpsBlockedNotice, setGpsBlockedNotice] = useState<string | null>(null)
  const [availablePlates] = useState([
    "MP09AB1234",
    "MP40ZC7182",
    "DL01AB9876",
    "MH12CD4321",
    "KA05EF6543",
    "HR26MN8765",
  ])

  // Map Engine & Mappls SDK State
  const [mapEngine, setMapEngine] = useState<"mappls" | "leaflet">("mappls")
  const [accessToken, setAccessToken] = useState<string>("")
  const [isSdkLoaded, setIsSdkLoaded] = useState<boolean>(Boolean(window.mappls))
  const [isSdkLoading, setIsSdkLoading] = useState<boolean>(false)

  // Map DOM & Instance Refs
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapplsMapRef = useRef<any>(null)
  const mapplsMarkerRef = useRef<any>(null)
  const mapplsPolylineRef = useRef<any>(null)
  const mapplsTrailRef = useRef<{ lat: number; lng: number }[]>([])

  const leafletMapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const polylineRef = useRef<L.Polyline | null>(null)
  const trailCoordsRef = useRef<[number, number][]>([])

  // Watch Position ID ref & Distance Tracking Refs
  const watchIdRef = useRef<number | null>(null)
  const simIndexRef = useRef(0)
  const simTimerRef = useRef<any>(null)
  const dutyStartTimeRef = useRef<number | null>(null)
  const lastTrackedCoordRef = useRef<{ lat: number; lng: number } | null>(null)
  const totalClientDistanceRef = useRef<number>(0)

  // Battery API check
  useEffect(() => {
    if ("getBattery" in navigator) {
      ;(navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100))
        battery.addEventListener("levelchange", () => {
          setBatteryLevel(Math.round(battery.level * 100))
        })
      }).catch(() => {})
    }
  }, [])

  // Timer for duty duration
  useEffect(() => {
    let timer: any = null
    if (isOnDuty) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      setElapsedSeconds(0)
    }
    return () => clearInterval(timer)
  }, [isOnDuty])

  // Load fresh Mappls Access Token and Driver Profile from backend
  useEffect(() => {
    // 1. Fetch authenticated driver's assigned vehicle plate
    api.get("/drivers/me")
      .then((res) => {
        if (res.data?.assignedVehiclePlate) {
          setVehiclePlate(res.data.assignedVehiclePlate)
        }
        if (res.data?.firstName) {
          setDriverName(`${res.data.firstName} ${res.data.lastName}`)
        }
      })
      .catch((e) => console.warn("Driver profile fetch warning:", e))

    // 2. Fetch Mappls access token
    const fetchToken = async () => {
      try {
        const res = await api.post("/map/token", {})
        if (res.data?.access_token) {
          setAccessToken(res.data.access_token)
        }
      } catch (err) {
        console.warn("Mappls token fetch error, defaulting to Leaflet:", err)
      }
    }
    fetchToken()
  }, [])

  // Ingest MapmyIndia (Mappls) Vector SDK script dynamically
  useEffect(() => {
    if (!accessToken) return
    if (window.mappls) {
      setIsSdkLoaded(true)
      return
    }

    setIsSdkLoading(true)
    const scriptId = "mappls-vector-sdk-script"
    let script = document.getElementById(scriptId) as HTMLScriptElement

    const timeoutId = setTimeout(() => {
      if (!window.mappls) {
        console.warn("Mappls script load timeout, switching to fast logistics engine.")
        setIsSdkLoading(false)
        setIsSdkLoaded(false)
        setMapEngine("leaflet")
      }
    }, 3000)

    if (!script) {
      script = document.createElement("script")
      script.id = scriptId
      script.src = `https://apis.mappls.com/advancedmaps/api/${accessToken}/map_sdk?layer=vector&v=3.0`
      script.async = true
      document.head.appendChild(script)
    }

    script.onload = () => {
      clearTimeout(timeoutId)
      setIsSdkLoaded(true)
      setIsSdkLoading(false)
    }
    script.onerror = () => {
      clearTimeout(timeoutId)
      console.warn("Mappls Vector SDK script load failed, falling back to Leaflet.")
      setIsSdkLoading(false)
      setIsSdkLoaded(false)
      setMapEngine("leaflet")
    }
  }, [accessToken])

  // Check existing session from backend on mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await api.get(`/driver/duty/session?driverUsername=${encodeURIComponent(driverUsername)}`)
        const data: DutySessionState = res.data
        if (data && data.status && data.status !== "OFF_DUTY") {
          setIsOnDuty(true)
          setCurrentDutyStatus(data.status)
          if (data.vehiclePlate) setVehiclePlate(data.vehiclePlate)
          if (data.driverName) setDriverName(data.driverName)
          if (data.totalDistanceKm) setDistanceKm(data.totalDistanceKm)
          if (data.lastLatitude && data.lastLongitude) {
            setCurrentCoords({ lat: data.lastLatitude, lng: data.lastLongitude })
          }
          if (data.dutyStartTime) {
            dutyStartTimeRef.current = data.dutyStartTime
            const diffSec = Math.floor((Date.now() - data.dutyStartTime) / 1000)
            if (diffSec > 0) setElapsedSeconds(diffSec)
          }
        }
      } catch (e) {
        console.warn("Could not retrieve initial driver duty session:", e)
      }
    }
    fetchSession()
  }, [driverUsername])

  // Initialize Map Engine (Mappls or Leaflet)
  useEffect(() => {
    if (!mapContainerRef.current) return

    // Safe teardown helper for MapmyIndia vector map to prevent:
    // TypeError: Cannot read properties of undefined (reading 'destroy')
    const safeRemoveMappls = (m: any) => {
      if (!m) return
      try {
        if (m._loaded || m.style) {
          if (typeof m.remove === "function") {
            m.remove()
          }
        }
      } catch (e) {
        // Silently catch SDK race teardown errors
      }
    }

    // Clean up previous map instances
    if (leafletMapRef.current) {
      try {
        leafletMapRef.current.remove()
      } catch (e) {}
      leafletMapRef.current = null
      markerRef.current = null
      polylineRef.current = null
    }
    if (mapplsMapRef.current) {
      safeRemoveMappls(mapplsMapRef.current)
      mapplsMapRef.current = null
      mapplsMarkerRef.current = null
      mapplsPolylineRef.current = null
    }

    mapContainerRef.current.innerHTML = ""

    const defaultLat = currentCoords?.lat || 22.7196
    const defaultLng = currentCoords?.lng || 75.8577

    // Strategy 1: MapmyIndia (Mappls) Vector Map Engine
    if (mapEngine === "mappls" && isSdkLoaded && window.mappls) {
      try {
        // Safely purge stale instances from Mappls global registry to prevent auto-remove collisions
        if ((window as any).mappls?.maps) {
          const registry = (window as any).mappls.maps
          for (const key of Object.keys(registry)) {
            try {
              const prev = registry[key]
              if (prev && (prev._loaded || prev.style)) {
                prev.remove()
              }
            } catch (_) {}
            delete registry[key]
          }
        }

        const uniqueDutyCanvasId = `mappls-duty-canvas-${Math.random().toString(36).substring(2, 9)}`
        const mapDiv = document.createElement("div")
        mapDiv.id = uniqueDutyCanvasId
        mapDiv.style.width = "100%"
        mapDiv.style.height = "100%"
        mapContainerRef.current.appendChild(mapDiv)

        const map = new window.mappls.Map(uniqueDutyCanvasId, {
          center: [defaultLat, defaultLng],
          zoom: 15,
          zoomControl: true,
          fullscreenControl: false,
          location: false,
          hybrid: false,
        })
        mapplsMapRef.current = map

        // Create Mappls Marker
        try {
          const marker = new window.mappls.Marker({
            map,
            position: { lat: defaultLat, lng: defaultLng },
            popupHtml: `
              <div style="font-family: inherit; font-size: 12px; padding: 4px; line-height: 1.4;">
                <b style="color: #0078d4; font-size: 13px;">${vehiclePlate}</b> [Mappls Live]<br/>
                Driver: <b>${driverName}</b><br/>
                Status: <b>${currentDutyStatus}</b>
              </div>
            `,
          })
          mapplsMarkerRef.current = marker
        } catch (mErr) {
          console.warn("Mappls marker creation error:", mErr)
        }

        // Restore breadcrumbs if any
        if (mapplsTrailRef.current.length > 1 && window.mappls?.Polyline) {
          try {
            mapplsPolylineRef.current = new window.mappls.Polyline({
              map,
              path: mapplsTrailRef.current,
              strokeColor: "#0078d4",
              strokeWeight: 4,
              strokeOpacity: 0.85,
            })
          } catch (pErr) {}
        }
        return
      } catch (err) {
        console.warn("Mappls mini-map native initialization error, falling back to Leaflet:", err)
        mapplsMapRef.current = null
      }
    }

    // If Mappls is still downloading, wait for it without mounting and destroying Leaflet
    if (mapEngine === "mappls" && isSdkLoading && !window.mappls) {
      return
    }

    // Strategy 2: Leaflet Fallback Engine
    try {
      const mapDiv = document.createElement("div")
      mapDiv.id = "leaflet-mini-canvas"
      mapDiv.style.width = "100%"
      mapDiv.style.height = "100%"
      mapContainerRef.current.appendChild(mapDiv)

      const map = L.map(mapDiv, {
        center: [defaultLat, defaultLng],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      })

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map)

      L.control.zoom({ position: "bottomright" }).addTo(map)

      // Pulsing Driver Beacon
      const pulsingIcon = L.divIcon({
        className: "driver-duty-marker",
        html: `
          <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: rgba(16, 185, 129, 0.25); animation: pulse 2s infinite;"></div>
            <div style="position: absolute; width: 26px; height: 26px; border-radius: 50%; background: rgba(16, 185, 129, 0.4); border: 2px solid white;"></div>
            <div style="position: relative; width: 18px; height: 18px; border-radius: 50%; background: #10b981; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
              <div style="width: 5px; height: 5px; border-radius: 50%; background: white;"></div>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      })

      const marker = L.marker([defaultLat, defaultLng], { icon: pulsingIcon }).addTo(map)
      markerRef.current = marker

      const polyline = L.polyline(trailCoordsRef.current, {
        color: "#0078d4",
        weight: 4,
        opacity: 0.85,
        smoothFactor: 1,
      }).addTo(map)
      polylineRef.current = polyline

      leafletMapRef.current = map
    } catch (lErr) {
      console.error("Leaflet initialization error:", lErr)
    }

    return () => {
      if (leafletMapRef.current) {
        try {
          leafletMapRef.current.remove()
        } catch (e) {}
        leafletMapRef.current = null
      }
      if (mapplsMapRef.current) {
        safeRemoveMappls(mapplsMapRef.current)
        mapplsMapRef.current = null
      }
    }
  }, [mapEngine, isSdkLoaded])

  // Send GPS coordinate payload to backend & update Map
  const broadcastLocation = async (lat: number, lng: number, speed: number, head: number, acc: number | null, customStatus?: DutySessionState["status"], notes?: string) => {
    setIsBroadcasting(true)
    const effectiveStatus = customStatus || (speed > 2 ? "DRIVING" : "ON_DUTY")

    // 1. Calculate live client-side distance progression immediately
    if (lastTrackedCoordRef.current) {
      const hop = haversineDistanceKm(lastTrackedCoordRef.current.lat, lastTrackedCoordRef.current.lng, lat, lng)
      if (hop >= 0.005 && hop < 15.0) {
        totalClientDistanceRef.current += hop
        setDistanceKm(Math.round(totalClientDistanceRef.current * 10) / 10)
      }
    }
    lastTrackedCoordRef.current = { lat, lng }

    try {
      const payload = {
        driverUsername,
        driverName,
        vehiclePlate,
        latitude: lat,
        longitude: lng,
        speed: Math.round(speed * 10) / 10,
        heading: Math.round(head),
        accuracy: acc ? Math.round(acc) : 5,
        batteryLevel,
        status: effectiveStatus,
        notes: notes || statusNote,
      }

      const res = await api.post("/driver/duty/location", payload)
      const data: DutySessionState = res.data
      setLastBroadcastTime(new Date())
      if (data.totalDistanceKm !== undefined && data.totalDistanceKm !== null) {
        if (data.totalDistanceKm > 0 || totalClientDistanceRef.current === 0) {
          totalClientDistanceRef.current = data.totalDistanceKm
          setDistanceKm(data.totalDistanceKm)
        }
      }
      setCurrentDutyStatus(effectiveStatus)
    } catch (err) {
      console.warn("Failed to broadcast location ping:", err)
    } finally {
      setIsBroadcasting(false)
    }

    // 1. Update Mappls Map instance
    if (mapplsMapRef.current && window.mappls) {
      try {
        if (typeof mapplsMapRef.current.setCenter === "function") {
          mapplsMapRef.current.setCenter({ lat, lng })
        }

        if (mapplsMarkerRef.current && typeof mapplsMarkerRef.current.setPosition === "function") {
          mapplsMarkerRef.current.setPosition({ lat, lng })
        } else {
          try {
            if (mapplsMarkerRef.current?.remove) mapplsMarkerRef.current.remove()
            mapplsMarkerRef.current = new window.mappls.Marker({
              map: mapplsMapRef.current,
              position: { lat, lng },
              popupHtml: `
                <div style="font-family: inherit; font-size: 12px; padding: 4px; line-height: 1.4;">
                  <b style="color: #0078d4; font-size: 13px;">${vehiclePlate}</b> [Mappls Live]<br/>
                  Driver: <b>${driverName}</b><br/>
                  Speed: <b>${Math.round(speed)} km/h</b>
                </div>
              `,
            })
          } catch (e) {}
        }

        mapplsTrailRef.current.push({ lat, lng })
        if (mapplsPolylineRef.current && typeof mapplsPolylineRef.current.setPath === "function") {
          mapplsPolylineRef.current.setPath(mapplsTrailRef.current)
        } else if (mapplsTrailRef.current.length > 1 && window.mappls?.Polyline) {
          try {
            mapplsPolylineRef.current = new window.mappls.Polyline({
              map: mapplsMapRef.current,
              path: mapplsTrailRef.current,
              strokeColor: "#0078d4",
              strokeWeight: 4,
              strokeOpacity: 0.85,
            })
          } catch (pe) {}
        }
      } catch (mUpdateErr) {
        console.warn("Mappls live position update error:", mUpdateErr)
      }
    }

    // 2. Update Leaflet Map instance
    if (leafletMapRef.current && markerRef.current) {
      const latLng: [number, number] = [lat, lng]
      markerRef.current.setLatLng(latLng)
      leafletMapRef.current.panTo(latLng, { animate: true })

      trailCoordsRef.current.push(latLng)
      if (polylineRef.current) {
        polylineRef.current.setLatLngs(trailCoordsRef.current)
      }
    }
  }

  // Start Real Hardware Phone GPS tracking
  const startHardwareGps = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.")
      return
    }

    setGpsBlockedNotice(null)

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }

    const handleGpsSuccess = (pos: GeolocationPosition) => {
      setGpsBlockedNotice(null)
      const { latitude, longitude, speed, heading: posHeading, accuracy } = pos.coords
      setCurrentCoords({ lat: latitude, lng: longitude })
      setAccuracyM(accuracy)
      const spd = speed !== null && speed >= 0 ? speed * 3.6 : 0
      setSpeedKmh(Math.round(spd))
      if (posHeading !== null && !isNaN(posHeading)) setHeading(posHeading)
      broadcastLocation(latitude, longitude, spd, posHeading || 0, accuracy)
    }

    const handleGpsError = (err: GeolocationPositionError) => {
      console.warn("Hardware GPS error or policy restriction:", err.message)
      const isBlocked =
        err.code === 1 || // PERMISSION_DENIED
        err.message?.toLowerCase().includes("permission") ||
        err.message?.toLowerCase().includes("policy") ||
        err.message?.toLowerCase().includes("denied")

      if (isBlocked) {
        if (watchIdRef.current !== null) {
          try {
            navigator.geolocation.clearWatch(watchIdRef.current)
          } catch (_) {}
          watchIdRef.current = null
        }
        setGpsBlockedNotice(
          "Device GPS blocked by browser Permissions Policy (common in web previews or ungranted permissions). NH-48 Telematics Highway Simulator has been automatically activated so your duty session works smoothly!"
        )
        // Automatically start simulator drive if not already running
        if (!simTimerRef.current) {
          startSimulatorDrive()
        }
      }
    }

    try {
      navigator.geolocation.getCurrentPosition(handleGpsSuccess, handleGpsError, options)
      const id = navigator.geolocation.watchPosition(handleGpsSuccess, handleGpsError, options)
      watchIdRef.current = id
    } catch (e: any) {
      console.warn("navigator.geolocation invocation error:", e)
      handleGpsError({ code: 1, message: e?.message || "Permissions policy blocked" } as any)
    }
  }

  // Simulator Drive (Indore Highway)
  const startSimulatorDrive = () => {
    setIsSimulating(true)
    simIndexRef.current = 0

    const step = () => {
      const point = SIMULATION_WAYPOINTS[simIndexRef.current % SIMULATION_WAYPOINTS.length]
      setCurrentCoords({ lat: point.lat, lng: point.lng })
      setSpeedKmh(point.speed)
      setAccuracyM(3.5)
      setHeading(Math.floor(Math.random() * 40) + 70)

      broadcastLocation(
        point.lat,
        point.lng,
        point.speed,
        85,
        3.5,
        point.speed > 0 ? "DRIVING" : "STOPPED"
      )

      simIndexRef.current = (simIndexRef.current + 1) % SIMULATION_WAYPOINTS.length
    }

    step()
    simTimerRef.current = setInterval(step, 3500)
  }

  // Handle Start Duty Toggle
  const handleStartDuty = (simulate = false) => {
    setIsOnDuty(true)
    dutyStartTimeRef.current = Date.now()
    setCurrentDutyStatus("ON_DUTY")
    trailCoordsRef.current = []
    mapplsTrailRef.current = []
    lastTrackedCoordRef.current = null
    totalClientDistanceRef.current = 0
    setDistanceKm(0)

    if (simulate) {
      startSimulatorDrive()
    } else {
      startHardwareGps()
    }
  }

  // Handle Stop Duty
  const handleStopDuty = async () => {
    if (watchIdRef.current !== null) {
      try {
        navigator.geolocation.clearWatch(watchIdRef.current)
      } catch (_) {}
      watchIdRef.current = null
    }
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current)
      simTimerRef.current = null
    }

    lastTrackedCoordRef.current = null
    setIsOnDuty(false)
    setIsSimulating(false)
    setSpeedKmh(0)
    setCurrentDutyStatus("OFF_DUTY")
    setGpsBlockedNotice(null)

    try {
      await api.post("/driver/duty/stop", { driverUsername })
    } catch (e) {
      console.warn("Failed to stop duty on backend:", e)
    }
  }

  // Quick Action Buttons
  const triggerQuickEvent = (status: DutySessionState["status"], label: string) => {
    setCurrentDutyStatus(status)
    setStatusNote(label)
    setQuickAlertToast(`Status: ${label}`)
    setTimeout(() => setQuickAlertToast(null), 3000)

    if (currentCoords) {
      broadcastLocation(
        currentCoords.lat,
        currentCoords.lng,
        status === "DRIVING" ? 45 : 0,
        heading,
        accuracyM,
        status,
        label
      )
    }
  }

  // Format Elapsed Time
  const formatTime = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600)
    const minutes = Math.floor((totalSec % 3600) / 60)
    const seconds = totalSec % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  // Recenter map on driver
  const handleRecenter = () => {
    if (!currentCoords) return

    if (mapEngine === "mappls" && mapplsMapRef.current) {
      try {
        if (typeof mapplsMapRef.current.setCenter === "function") {
          mapplsMapRef.current.setCenter({ lat: currentCoords.lat, lng: currentCoords.lng })
        }
        if (typeof mapplsMapRef.current.setZoom === "function") {
          mapplsMapRef.current.setZoom(16)
        }
      } catch (e) {}
    } else if (mapEngine === "leaflet" && leafletMapRef.current) {
      leafletMapRef.current.setView([currentCoords.lat, currentCoords.lng], 15)
    }
  }

  return (
    <div className="min-h-full bg-[#f8fafc] pb-10 sm:pb-16 -mx-1 sm:mx-0">
      {/* Toast Alert */}
      {quickAlertToast && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-3 max-w-[90vw] truncate">
          <Sparkles size={14} className="text-[#0078d4] shrink-0" />
          <span className="truncate">{quickAlertToast}</span>
        </div>
      )}

      {/* Top Mobile Header Banner */}
      <div className="bg-white border-b border-[#e2e8f0] px-3.5 py-3 sm:px-6 sm:py-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 transition-colors shadow-sm ${
              isOnDuty ? "bg-emerald-500 shadow-emerald-500/20 text-white" : "bg-slate-800 text-slate-300"
            }`}>
              <Radio size={20} className={isOnDuty ? "animate-pulse" : ""} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                  Driver Duty Console
                </h1>
                <Badge className={
                  isOnDuty
                    ? "bg-emerald-500/15 text-emerald-700 border-emerald-300 font-bold px-2 py-0 text-[10px] sm:text-xs"
                    : "bg-slate-200 text-slate-700 font-bold px-2 py-0 text-[10px] sm:text-xs"
                }>
                  {isOnDuty ? "● LIVE" : "OFF DUTY"}
                </Badge>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
                Smartphone GPS telematics live link
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Link to="/map" className="w-full sm:w-auto">
              <Button variant="outline" size="sm" className="w-full sm:w-auto rounded-xl border-slate-200 text-slate-700 font-semibold gap-1.5 h-8 sm:h-9 text-xs">
                <MapPin size={13} className="text-[#0078d4]" />
                View On Fleet Map
                <ExternalLink size={11} className="opacity-60" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-2.5 sm:px-4 md:px-8 py-3.5 sm:py-6 space-y-3.5 sm:space-y-5">
        {/* GPS Permissions Policy Notice Banner */}
        {gpsBlockedNotice && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 sm:p-4 flex items-start gap-3 shadow-sm animate-in fade-in">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                Browser Geolocation Policy Restriction
              </h4>
              <p className="text-[11px] sm:text-xs text-amber-800 mt-0.5 leading-relaxed">
                {gpsBlockedNotice}
              </p>
            </div>
          </div>
        )}

        {/* Main Duty Control Center Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-6">
          {/* Left Column: Big Control & Telematics */}
          <div className="lg:col-span-1 space-y-3.5 sm:space-y-5">
            {/* Big Action Toggle Card */}
            <Card className="border border-[#e2e8f0] shadow-sm rounded-xl sm:rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-3.5 sm:p-5 space-y-3.5 sm:space-y-4">
                {/* Vehicle & Driver Selector */}
                <div className="space-y-2.5">
                  {/* Custom Mobile-Friendly Vehicle Dropdown (Replaces native browser gray popup) */}
                  <div className="relative">
                    <label className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Assigned Vehicle
                    </label>
                    <button
                      type="button"
                      disabled={isOnDuty}
                      onClick={() => setIsPlateDropdownOpen(!isPlateDropdownOpen)}
                      className="w-full pl-3 pr-3 py-2 sm:py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-left text-xs sm:text-sm font-bold text-slate-800 flex items-center justify-between transition-colors disabled:opacity-60 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Truck size={15} className="text-[#0078d4] shrink-0" />
                        <span className="truncate">{vehiclePlate}</span>
                        <span className="text-[10px] text-slate-400 font-normal hidden xs:inline">(Unit)</span>
                      </div>
                      <ChevronDown size={15} className={`text-slate-400 transition-transform ${isPlateDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    {/* Clean In-Card Dropdown Popup */}
                    {isPlateDropdownOpen && !isOnDuty && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-xl p-1 max-h-48 overflow-y-auto space-y-0.5 animate-in fade-in slide-in-from-top-2">
                        {availablePlates.map((plate) => (
                          <button
                            key={plate}
                            type="button"
                            onClick={() => {
                              setVehiclePlate(plate)
                              setIsPlateDropdownOpen(false)
                            }}
                            className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                              vehiclePlate === plate
                                ? "bg-[#e3effb] text-[#0078d4] border border-[#d1e2f2]"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <span>{plate}</span>
                            <span className="text-[10px] text-slate-400 font-normal">Commercial Unit</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Driver Identity
                    </label>
                    <input
                      disabled={isOnDuty}
                      type="text"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="Enter Driver Name"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0078d4]/30 disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Primary Go Live / End Duty Button */}
                {!isOnDuty ? (
                  <div className="space-y-2 pt-1">
                    <button
                      onClick={() => handleStartDuty(false)}
                      className="w-full py-3.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base rounded-xl sm:rounded-2xl shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] cursor-pointer"
                    >
                      <Play size={18} fill="currentColor" />
                      <span>START DUTY & GO LIVE</span>
                    </button>

                    <button
                      onClick={() => handleStartDuty(true)}
                      className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] sm:text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Sparkles size={13} className="text-[#0078d4]" />
                      <span>Simulate Highway Drive</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <button
                      onClick={handleStopDuty}
                      className="w-full py-3.5 px-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm sm:text-base rounded-xl sm:rounded-2xl shadow-md shadow-rose-600/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] cursor-pointer"
                    >
                      <Square size={16} fill="currentColor" />
                      <span>END DUTY & STOP LIVE GPS</span>
                    </button>

                    {isSimulating && (
                      <p className="text-[10px] text-center text-amber-700 font-semibold bg-amber-50 py-1 px-2 rounded-lg border border-amber-200/60">
                        ⚡ Highway Demo Drive Running
                      </p>
                    )}
                  </div>
                )}

                {/* Status indicator note */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isOnDuty ? "bg-emerald-500 animate-ping" : "bg-slate-300"}`} />
                    {isOnDuty ? "Streaming 3s" : "GPS Inactive"}
                  </span>
                  <span>
                    {lastBroadcastTime ? `Ping: ${lastBroadcastTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : "No pings"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Status Buttons for Driver */}
            {isOnDuty && (
              <Card className="border border-[#e2e8f0] shadow-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 bg-white space-y-2.5">
                <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Quick Driver Status
                </h3>
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  <button
                    onClick={() => triggerQuickEvent("DRIVING", "Driving Normally")}
                    className={`p-2 sm:p-2.5 rounded-xl border text-left text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      currentDutyStatus === "DRIVING"
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <span>Driving</span>
                  </button>

                  <button
                    onClick={() => triggerQuickEvent("TRAFFIC_DELAY", "Heavy Highway Traffic")}
                    className={`p-2 sm:p-2.5 rounded-xl border text-left text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      currentDutyStatus === "TRAFFIC_DELAY"
                        ? "bg-amber-50 border-amber-300 text-amber-800"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                    <span>Traffic</span>
                  </button>

                  <button
                    onClick={() => triggerQuickEvent("REST_BREAK", "Rest & Meal Break")}
                    className={`p-2 sm:p-2.5 rounded-xl border text-left text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      currentDutyStatus === "REST_BREAK"
                        ? "bg-indigo-50 border-indigo-300 text-indigo-800"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Coffee size={14} className="text-indigo-500 shrink-0" />
                    <span>Rest Break</span>
                  </button>

                  <button
                    onClick={() => triggerQuickEvent("EMERGENCY_SOS", "EMERGENCY SOS - NEED ASSISTANCE")}
                    className="p-2 sm:p-2.5 rounded-xl border border-red-300 bg-red-50 text-red-700 text-left text-[11px] sm:text-xs font-extrabold flex items-center gap-1.5 hover:bg-red-100 transition-all cursor-pointer"
                  >
                    <AlertTriangle size={14} className="text-red-600 shrink-0" />
                    <span>🚨 SOS Help</span>
                  </button>
                </div>
              </Card>
            )}
          </div>

          {/* Right Column: Telematics HUD and Interactive Mini Map */}
          <div className="lg:col-span-2 space-y-3.5 sm:space-y-5">
            {/* 4 Telematics HUD Cards (2x2 on mobile, 4 in row on tablet/desktop) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3.5">
              {/* Digital Speedometer */}
              <div className="bg-white border border-[#e2e8f0] rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Speed</span>
                  <Gauge size={15} className="text-[#0078d4]" />
                </div>
                <div className="mt-2 sm:mt-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                      {speedKmh}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400">km/h</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 mt-1 block truncate">
                    {speedKmh > 0 ? "In Motion" : "Stopped"}
                  </span>
                </div>
              </div>

              {/* Duty Duration Clock */}
              <div className="bg-white border border-[#e2e8f0] rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Duty Time</span>
                  <Clock size={15} className="text-emerald-500" />
                </div>
                <div className="mt-2 sm:mt-3">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight block leading-none">
                    {formatTime(elapsedSeconds)}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 mt-1 block truncate">
                    {isOnDuty ? "Active" : "Paused"}
                  </span>
                </div>
              </div>

              {/* Trip Odometer */}
              <div className="bg-white border border-[#e2e8f0] rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Distance</span>
                  <Compass size={15} className="text-blue-500" />
                </div>
                <div className="mt-2 sm:mt-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                      {(Number(distanceKm) || 0).toFixed(1)}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400">km</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 mt-1 block truncate">
                    Total Covered
                  </span>
                </div>
              </div>

              {/* GPS Signal & Battery */}
              <div className="bg-white border border-[#e2e8f0] rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Phone / GPS</span>
                  <Battery size={15} className="text-slate-600" />
                </div>
                <div className="mt-2 sm:mt-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                      {accuracyM !== null ? `±${accuracyM}m` : "Ready"}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 mt-1 block truncate">
                    Battery {batteryLevel}%
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Live Mini Map with MapmyIndia InTouch */}
            <Card className="border border-[#e2e8f0] shadow-sm rounded-xl sm:rounded-2xl overflow-hidden bg-white">
              <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin size={15} className="text-[#0078d4] shrink-0" />
                  <span className="text-[11px] sm:text-xs font-black text-slate-800 uppercase tracking-wider truncate">
                    Live Telematics Map
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-lg bg-[#e3effb] border border-[#d1e2f2]">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[#0078d4] font-black text-[10px] sm:text-xs tracking-wide">MAPPLS</span>
                    <span className="text-slate-400 text-[9px]">•</span>
                    <span className="text-slate-800 font-bold text-[10px] sm:text-[11px]">MapmyIndia InTouch</span>
                  </div>

                  {currentCoords && (
                    <span className="hidden md:inline text-[10px] sm:text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {currentCoords.lat.toFixed(4)}, {currentCoords.lng.toFixed(4)}
                    </span>
                  )}
                </div>
              </div>

              <div className="relative w-full h-[280px] sm:h-[360px] md:h-[420px]">
                <div ref={mapContainerRef} className="w-full h-full" />

                {/* Instant Map Loading Overlay */}
                {isSdkLoading && !window.mappls && (
                  <div className="absolute inset-0 z-[500] bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-500">
                    <div className="w-7 h-7 rounded-full border-2 border-[#0078d4] border-t-transparent animate-spin" />
                    <span className="text-[11px] font-bold text-slate-600">
                      Loading MapmyIndia Live Radar...
                    </span>
                  </div>
                )}

                {/* Recenter Button */}
                {currentCoords && (
                  <button
                    onClick={handleRecenter}
                    className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md text-slate-800 font-bold text-[11px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl shadow-lg border border-slate-200 flex items-center gap-1.5 hover:bg-white cursor-pointer active:scale-95 transition-transform"
                  >
                    <RotateCcw size={12} className="text-[#0078d4]" />
                    <span>Recenter</span>
                  </button>
                )}
              </div>
            </Card>

            {/* Seamless Driver-to-Dispatcher Communication Card */}
            <div className="bg-gradient-to-r from-blue-500/10 via-sky-500/5 to-transparent border border-blue-200/60 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0078d4] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#0078d4]/20">
                  <Radio size={18} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                    Mappls Telematics Live Link
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
                    Live GPS directly broadcasts to the admin fleet radar with zero hardware.
                  </p>
                </div>
              </div>
              <Link to="/map" className="shrink-0 w-full sm:w-auto">
                <Button size="sm" className="w-full sm:w-auto bg-[#0078d4] hover:bg-[#0069ba] text-white font-bold rounded-xl text-xs gap-1.5 h-8 sm:h-9">
                  Open Live Map
                  <ChevronRight size={13} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
