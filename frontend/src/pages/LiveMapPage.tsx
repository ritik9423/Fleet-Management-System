import { useEffect, useMemo, useRef, useState } from "react"
import {
  Navigation,
  Compass,
  Radio,
  MapPin,
  Fuel,
  Gauge,
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
  Warehouse,
  Truck,
  Phone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/AuthContext"
import { api } from "@/lib/api"
import { Link } from "react-router-dom"
import L from "leaflet"
import "leaflet.markercluster"
import "leaflet.markercluster/dist/MarkerCluster.css"
import Supercluster, { type PointFeature } from "supercluster"

// Global Mappls SDK declaration
declare global {
  interface Window {
    mappls?: any
    MapmyIndia?: any
  }
}

interface MapVehicle {
  id: number
  plate: string
  model: string
  driver: string
  lat: number
  lng: number
  speed: number
  fuel: number
  status: "ACTIVE" | "IDLE" | "MAINTENANCE"
  destination: string
  battery?: number
  deviceId?: string
}

export function LiveMapPage() {
  const { user } = useAuth()
  const role = user?.role || "ADMIN"

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapplsMapRef = useRef<any>(null)
  const mapplsMarkersRef = useRef<any[]>([])
  const superclusterRef = useRef<Supercluster | null>(null)
  const mapplsZoomListenerRef = useRef<any>(null)

  const leafletMapRef = useRef<L.Map | null>(null)
  const leafletMarkersRef = useRef<L.Marker[]>([])
  const leafletClusterGroupRef = useRef<L.MarkerClusterGroup | null>(null)
  const leafletGeofencesRef = useRef<(L.Marker | L.Circle)[]>([])
  const [clusteringEnabled, setClusteringEnabled] = useState<boolean>(true)

  const [mapEngine, setMapEngine] = useState<"mappls" | "leaflet">("leaflet")
  const [vehicles, setVehicles] = useState<MapVehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<MapVehicle | null>(null)
  const [isLoadingVehicles, setIsLoadingVehicles] = useState<boolean>(true)

  // Poll real-time InTouch fleet telematics from backend (scoped automatically if DRIVER)
  useEffect(() => {
    let isMounted = true
    const fetchLiveVehicles = async () => {
      try {
        const res = await api.get("/map/intouch/live")
        const liveData = res.data
        if (Array.isArray(liveData) && liveData.length > 0) {
          const validVehicles: MapVehicle[] = liveData
            .filter((d: any) => typeof d.latitude === "number" && typeof d.longitude === "number")
            .map((d: any, idx: number) => ({
              id: idx + 1,
              plate: d.vehicleNumber || d.vehicleName || d.deviceId || `Vehicle-${idx + 1}`,
              model: d.vehicleName || "Commercial Fleet Unit",
              driver: d.driverName || (role === "DRIVER" ? (user?.username || "You") : "Corridor Pilot"),
              lat: d.latitude,
              lng: d.longitude,
              speed: Math.round(d.speed || 0),
              fuel: d.battery ? Math.round(d.battery) : 85,
              battery: d.battery ? Math.round(d.battery * 10) / 10 : undefined,
              status: d.ignitionOn ? (d.speed > 0 ? "ACTIVE" : "IDLE") : "IDLE",
              destination: d.address || "Active Indian Corridor",
              deviceId: d.deviceId,
            }))

          if (isMounted && validVehicles.length > 0) {
            setVehicles(validVehicles)
            setSelectedVehicle((prev) => {
              if (!prev) return validVehicles[0]
              const found = validVehicles.find((v) => v.plate === prev?.plate)
              return found || validVehicles[0]
            })
            setIsLoadingVehicles(false)

            // If DRIVER, auto-center on their vehicle immediately
            if (role === "DRIVER" && leafletMapRef.current && validVehicles[0]) {
              leafletMapRef.current.setView([validVehicles[0].lat, validVehicles[0].lng], 13, { animate: true })
            }
          }
        } else if (isMounted && role === "DRIVER") {
          // If no GPS yet, default to assigned vehicle
          setIsLoadingVehicles(false)
        }
      } catch (err) {
        console.warn("InTouch live telematics polling:", err)
      } finally {
        if (isMounted) setIsLoadingVehicles(false)
      }
    }

    fetchLiveVehicles()
    const interval = setInterval(fetchLiveVehicles, 10000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [role, user?.username])

  // Fresh OAuth Token loaded from backend
  const [accessToken, setAccessToken] = useState<string>("")
  const [isSdkLoaded, setIsSdkLoaded] = useState<boolean>(Boolean(window.mappls))
  const [isSdkLoading, setIsSdkLoading] = useState<boolean>(false)

  useEffect(() => {
    const fetchTokenFromBackend = async () => {
      try {
        const res = await fetch("/api/map/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        })
        if (res.ok) {
          const data = await res.json()
          if (data && data.access_token) {
            setAccessToken(data.access_token)
          }
        }
      } catch (err) {
        console.warn("Mappls token fetch failed, defaulting to reliable map engine:", err)
      }
    }
    fetchTokenFromBackend()
  }, [])

  // Search, filter & pagination state
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "IDLE">("ALL")
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 6

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        v.plate.toLowerCase().includes(q) ||
        v.driver.toLowerCase().includes(q) ||
        v.destination.toLowerCase().includes(q)
      const matchesStatus =
        statusFilter === "ALL" || v.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [vehicles, searchQuery, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / pageSize))
  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredVehicles.slice(start, start + pageSize)
  }, [filteredVehicles, currentPage, pageSize])

  // Real InTouch Geofences / Hubs
  const [showGeofences, setShowGeofences] = useState(false)
  const [geofences, setGeofences] = useState<any[]>([])
  const geofenceMarkersRef = useRef<any[]>([])

  // Load real geofences from InTouch
  useEffect(() => {
    const fetchGeofences = async () => {
      try {
        const res = await fetch("/api/map/intouch/geofences")
        if (res.ok) {
          const raw = await res.json()
          const data = typeof raw === "string" ? JSON.parse(raw) : raw
          if (data && Array.isArray(data.data)) {
            setGeofences(data.data)
          }
        }
      } catch (e) {
        console.warn("Geofences load error:", e)
      }
    }
    fetchGeofences()
  }, [])

  const movingCount = useMemo(() => vehicles.filter((v) => v.status === "ACTIVE").length, [vehicles])
  const idleCount = useMemo(() => vehicles.filter((v) => v.status !== "ACTIVE").length, [vehicles])

  // Try loading MapmyIndia SDK once fresh token arrives
  useEffect(() => {
    if (!accessToken) return
    if (window.mappls) {
      setIsSdkLoaded(true)
      return
    }

    setIsSdkLoading(true)
    const scriptId = "mappls-vector-sdk-script"
    const existing = document.getElementById(scriptId)
    if (existing) existing.remove()

    const script = document.createElement("script")
    script.id = scriptId
    script.src = `https://apis.mappls.com/advancedmaps/api/${accessToken}/map_sdk?layer=vector&v=3.0`
    script.async = true
    script.onload = () => {
      setIsSdkLoaded(true)
      setIsSdkLoading(false)
    }
    script.onerror = () => {
      console.warn("MapmyIndia Vector SDK script load failed, using reliable Leaflet engine.")
      setIsSdkLoading(false)
      setIsSdkLoaded(false)
      setMapEngine("leaflet")
    }

    document.head.appendChild(script)
  }, [accessToken])

  // 1. Initialize Map ONCE
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

    // Clean up any prior map elements
    if (leafletMapRef.current) {
      try {
        leafletMapRef.current.remove()
      } catch (e) {}
      leafletMapRef.current = null
      leafletMarkersRef.current = []
    }
    if (mapplsMapRef.current) {
      safeRemoveMappls(mapplsMapRef.current)
      mapplsMapRef.current = null
      mapplsMarkersRef.current = []
    }

    mapContainerRef.current.innerHTML = ""

    // Strategy A: If MapmyIndia SDK is loaded, initialize with unique canvas ID
    if (isSdkLoaded && window.mappls) {
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

        const uniqueCanvasId = `mappls-map-canvas-${Math.random().toString(36).substring(2, 9)}`
        const mapDiv = document.createElement("div")
        mapDiv.id = uniqueCanvasId
        mapDiv.style.width = "100%"
        mapDiv.style.height = "100%"
        mapContainerRef.current.appendChild(mapDiv)

        const center = [23.5, 77.4]
        const map = new window.mappls.Map(uniqueCanvasId, {
          center,
          zoom: 7,
          zoomControl: true,
          fullscreenControl: false, // Prevents "This device does not support fullscreen mode" and crash
          location: false,
          hybrid: false,
        })
        mapplsMapRef.current = map
        setMapEngine("mappls")
        return
      } catch (err) {
        console.warn("MapmyIndia native initialization error, gracefully switching to Leaflet:", err)
        mapplsMapRef.current = null
      }
    }

    // Strategy B: Rock-solid Leaflet Map with Indian logistics tiles
    try {
      const mapDiv = document.createElement("div")
      mapDiv.id = "leaflet-map-canvas"
      mapDiv.style.width = "100%"
      mapDiv.style.height = "100%"
      mapContainerRef.current.appendChild(mapDiv)

      const center: [number, number] = [23.5, 77.4]
      const lMap = L.map(mapDiv, {
        center,
        zoom: 7,
        zoomControl: true,
      })

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; MapmyIndia InTouch Telematics | CARTO',
        maxZoom: 19,
      }).addTo(lMap)

      leafletMapRef.current = lMap
      setMapEngine("leaflet")
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
  }, [isSdkLoaded])

  // 2. Render Vehicle Markers with clustering support
  useEffect(() => {
    if (vehicles.length === 0) return

    if (mapEngine === "leaflet" && leafletMapRef.current) {
      // Remove existing cluster group or individual markers
      if (leafletClusterGroupRef.current) {
        leafletMapRef.current.removeLayer(leafletClusterGroupRef.current)
        leafletClusterGroupRef.current = null
      }
      leafletMarkersRef.current.forEach((m) => m.remove())
      leafletMarkersRef.current = []

      // Build markers array
      const markers: L.Marker[] = []
      vehicles.forEach((v) => {
        const isMoving = v.status === "ACTIVE"
        const isPhoneGps = v.deviceId?.startsWith("PHONE-")
        const markerBg = isPhoneGps ? "#0ea5e9" : (isMoving ? "#10b981" : "#f59e0b")
        const iconGlyph = isPhoneGps ? "📱" : "🚚"

        const markerHtml = `
          <div style="
            background: ${markerBg};
            border: 2px solid white;
            border-radius: 50%;
            width: ${isPhoneGps ? "36px" : "32px"};
            height: ${isPhoneGps ? "36px" : "32px"};
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px ${isPhoneGps ? "rgba(14,165,233,0.5)" : "rgba(0,0,0,0.3)"};
            font-size: ${isPhoneGps ? "16px" : "14px"};
            cursor: pointer;
            transition: transform 0.2s;
            ${isPhoneGps ? "animation: pulse 2s infinite;" : ""}
          ">
            ${iconGlyph}
          </div>
        `
        const customIcon = L.divIcon({
          className: "custom-truck-marker",
          html: markerHtml,
          iconSize: isPhoneGps ? [36, 36] : [32, 32],
          iconAnchor: isPhoneGps ? [18, 18] : [16, 16],
          popupAnchor: [0, -18],
        })

        const popupContent = `
          <div style="font-family: inherit; font-size: 12px; padding: 4px; line-height: 1.4;">
            ${isPhoneGps ? '<span style="background: #e0f2fe; color: #0284c7; padding: 2px 7px; border-radius: 4px; font-weight: 800; font-size: 10px; display: inline-block; margin-bottom: 4px;">📱 LIVE MOBILE PHONE GPS</span><br/>' : ''}
            <b style="color: #0078d4; font-size: 13px;">${v.plate}</b> — ${v.model}<br/>
            Driver: <b>${v.driver}</b><br/>
            Speed: <b>${v.speed} km/h</b> | Battery: <b>${v.battery ? `${v.battery}%` : "N/A"}</b><br/>
            Location: <b>${v.destination}</b>
          </div>
        `

        const marker = L.marker([v.lat, v.lng], { icon: customIcon })
          .bindPopup(popupContent)

        marker.on("click", () => {
          setSelectedVehicle(v)
        })

        markers.push(marker)
      })

      if (clusteringEnabled) {
        // Create MarkerClusterGroup with custom styling
        const clusterGroup = L.markerClusterGroup({
          maxClusterRadius: 60,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          disableClusteringAtZoom: 15,
          chunkedLoading: true,
          iconCreateFunction: (cluster) => {
            const count = cluster.getChildCount()
            let size = "small"
            let dimensions = 40
            if (count >= 100) {
              size = "large"
              dimensions = 56
            } else if (count >= 20) {
              size = "medium"
              dimensions = 48
            }
            return L.divIcon({
              html: `<div class="fleet-cluster fleet-cluster-${size}"><span>${count}</span></div>`,
              className: "fleet-cluster-icon",
              iconSize: L.point(dimensions, dimensions),
            })
          },
        })

        clusterGroup.addLayers(markers)
        leafletMapRef.current.addLayer(clusterGroup)
        leafletClusterGroupRef.current = clusterGroup
      } else {
        // No clustering — add markers directly
        markers.forEach((m) => {
          m.addTo(leafletMapRef.current!)
        })
        leafletMarkersRef.current = markers
      }
    } else if (mapEngine === "mappls" && mapplsMapRef.current && window.mappls) {
      // --- Supercluster-based clustering for Mappls ---

      // Build GeoJSON features for Supercluster
      const geoFeatures: PointFeature<{ vehicleIndex: number }>[] = vehicles.map((v, idx) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [v.lng, v.lat] },
        properties: { vehicleIndex: idx },
      }))

      const sc = new Supercluster({
        radius: 60,
        maxZoom: 16,
        minZoom: 0,
      })
      sc.load(geoFeatures)
      superclusterRef.current = sc

      // Function to render clusters at current zoom/bounds
      const renderMapplsClusters = () => {
        const map = mapplsMapRef.current
        if (!map || !superclusterRef.current) return

        // Clear existing markers
        mapplsMarkersRef.current.forEach((m) => {
          try {
            if (typeof m.remove === "function") m.remove()
          } catch (e) {}
        })
        mapplsMarkersRef.current = []

        if (!clusteringEnabled) {
          // No clustering — render all markers individually
          vehicles.forEach((v) => {
            try {
              const marker = new window.mappls.Marker({
                map,
                position: { lat: v.lat, lng: v.lng },
                fitbounds: false,
                popupHtml: `
                  <div style="font-family: inherit; font-size: 12px; padding: 6px; line-height: 1.4;">
                    <b style="color: #0078d4; font-size: 13px;">${v.plate}</b> — ${v.model}<br/>
                    Driver: <b>${v.driver}</b><br/>
                    Speed: <b>${v.speed} km/h</b> | Battery: <b>${v.battery ? `${v.battery}V` : "N/A (No Sensor)"}</b><br/>
                    Destination: <b>${v.destination}</b>
                  </div>
                `,
              })
              if (marker && typeof marker.addListener === "function") {
                marker.addListener("click", () => setSelectedVehicle(v))
              }
              mapplsMarkersRef.current.push(marker)
            } catch (e) {}
          })
          return
        }

        // Get current zoom and bounds
        let zoom = 7
        try {
          zoom = Math.round(typeof map.getZoom === "function" ? map.getZoom() : 7)
        } catch (e) {}

        // Use world bounds as fallback; Mappls getBounds may not be available
        let bbox: [number, number, number, number] = [-180, -90, 180, 90]
        try {
          if (typeof map.getBounds === "function") {
            const b = map.getBounds()
            if (b) {
              const sw = b.getSouthWest()
              const ne = b.getNorthEast()
              bbox = [sw.lng, sw.lat, ne.lng, ne.lat]
            }
          }
        } catch (e) {}

        const clusters = superclusterRef.current.getClusters(bbox, zoom)

        clusters.forEach((feature) => {
          const [lng, lat] = feature.geometry.coordinates
          const props = feature.properties as any

          if (props.cluster) {
            // Render cluster marker using custom HTML
            const count = props.point_count
            let size = 40
            let fontSize = 12
            if (count >= 100) { size = 56; fontSize = 15 }
            else if (count >= 20) { size = 48; fontSize = 13 }

            const sizeClass = count >= 100 ? 'large' : count >= 20 ? 'medium' : 'small'
            const clusterHtml = `<div class="fleet-cluster fleet-cluster-${sizeClass}" style="width:${size}px;height:${size}px;font-size:${fontSize}px"><span>${count}</span></div>`

            try {
              const marker = new window.mappls.Marker({
                map,
                position: { lat, lng },
                fitbounds: false,
                html: clusterHtml,
                width: size,
                height: size,
                offset: [0, 0],
              })
              // Zoom into the cluster on click
              if (marker && typeof marker.addListener === "function") {
                marker.addListener("click", () => {
                  const expansionZoom = Math.min(
                    superclusterRef.current?.getClusterExpansionZoom(props.cluster_id) ?? zoom + 2,
                    18
                  )
                  try {
                    if (typeof map.setCenter === "function") map.setCenter({ lat, lng })
                    if (typeof map.setZoom === "function") map.setZoom(expansionZoom)
                  } catch (e) {}
                })
              }
              mapplsMarkersRef.current.push(marker)
            } catch (e) {}
          } else {
            // Individual vehicle marker
            const v = vehicles[props.vehicleIndex]
            if (!v) return
            try {
              const marker = new window.mappls.Marker({
                map,
                position: { lat: v.lat, lng: v.lng },
                fitbounds: false,
                popupHtml: `
                  <div style="font-family: inherit; font-size: 12px; padding: 6px; line-height: 1.4;">
                    <b style="color: #0078d4; font-size: 13px;">${v.plate}</b> — ${v.model}<br/>
                    Driver: <b>${v.driver}</b><br/>
                    Speed: <b>${v.speed} km/h</b> | Battery: <b>${v.battery ? `${v.battery}V` : "N/A (No Sensor)"}</b><br/>
                    Destination: <b>${v.destination}</b>
                  </div>
                `,
              })
              if (marker && typeof marker.addListener === "function") {
                marker.addListener("click", () => setSelectedVehicle(v))
              }
              mapplsMarkersRef.current.push(marker)
            } catch (e) {}
          }
        })
      }

      // Initial render
      renderMapplsClusters()

      // Re-render clusters on zoom change
      if (mapplsZoomListenerRef.current) {
        try {
          if (typeof mapplsMapRef.current.off === "function") {
            mapplsMapRef.current.off("zoomend", mapplsZoomListenerRef.current)
          }
        } catch (e) {}
      }
      mapplsZoomListenerRef.current = renderMapplsClusters
      try {
        if (typeof mapplsMapRef.current.on === "function") {
          mapplsMapRef.current.on("zoomend", renderMapplsClusters)
          mapplsMapRef.current.on("moveend", renderMapplsClusters)
        }
      } catch (e) {}
    }
  }, [vehicles, mapEngine, clusteringEnabled])

  // 3. Render Geofence Markers on toggle
  useEffect(() => {
    if (mapEngine === "leaflet" && leafletMapRef.current) {
      leafletGeofencesRef.current.forEach((g) => g.remove())
      leafletGeofencesRef.current = []

      if (showGeofences && geofences.length > 0) {
        geofences.slice(0, 100).forEach((geo) => {
          if (geo.geometry?.coordinates?.length >= 2) {
            const [lng, lat] = geo.geometry.coordinates
            const circle = L.circle([lat, lng], {
              radius: geo.buffer || 300,
              color: "#2563eb",
              fillColor: "#3b82f6",
              fillOpacity: 0.2,
              weight: 1.5,
            })
              .addTo(leafletMapRef.current!)
              .bindPopup(`
                <div style="font-size: 12px; line-height: 1.4;">
                  <b style="color: #2563eb;">🏢 Hub: ${geo.name || "Logistics Hub"}</b><br/>
                  Type: <b>${geo.geozoneType || "Hub"}</b> | Radius: <b>${geo.buffer || 200}m</b>
                </div>
              `)
            leafletGeofencesRef.current.push(circle)
          }
        })
      }
    } else if (mapEngine === "mappls" && mapplsMapRef.current && window.mappls) {
      geofenceMarkersRef.current.forEach((m) => {
        try {
          if (typeof m.remove === "function") m.remove()
        } catch (ignored) {}
      })
      geofenceMarkersRef.current = []

      if (showGeofences && geofences.length > 0) {
        geofences.slice(0, 100).forEach((geo) => {
          try {
            if (geo.geometry?.coordinates?.length >= 2) {
              const [lng, lat] = geo.geometry.coordinates
              const marker = new window.mappls.Marker({
                map: mapplsMapRef.current,
                position: { lat, lng },
                popupHtml: `
                  <div style="font-family: inherit; font-size: 12px; padding: 6px; line-height: 1.4;">
                    <b style="color: #2563eb; font-size: 13px;">🏢 Hub: ${geo.name || "Logistics Hub"}</b><br/>
                    Type: <b>${geo.geozoneType || "Hub"}</b> | Radius: <b>${geo.buffer || 200}m</b>
                  </div>
                `,
              })
              geofenceMarkersRef.current.push(marker)
            }
          } catch (err) {}
        })
      }
    }
  }, [showGeofences, geofences, mapEngine])

  // Focus vehicle
  const focusVehicle = (v: MapVehicle) => {
    setSelectedVehicle(v)
    if (mapEngine === "leaflet" && leafletMapRef.current) {
      leafletMapRef.current.setView([v.lat, v.lng], 13, { animate: true })
    } else if (mapplsMapRef.current && typeof mapplsMapRef.current.setCenter === "function") {
      try {
        mapplsMapRef.current.setCenter({ lat: v.lat, lng: v.lng })
        if (typeof mapplsMapRef.current.setZoom === "function") {
          mapplsMapRef.current.setZoom(13)
        }
      } catch (e) {}
    }
  }

  // Center corridor view
  const resetCorridorView = () => {
    const center: [number, number] = vehicles.length > 0 && vehicles[0].lat ? [vehicles[0].lat, vehicles[0].lng] : [23.5, 77.4]
    if (mapEngine === "leaflet" && leafletMapRef.current) {
      leafletMapRef.current.setView(center, 7, { animate: true })
    } else if (mapplsMapRef.current && typeof mapplsMapRef.current.setCenter === "function") {
      try {
        mapplsMapRef.current.setCenter({ lat: center[0], lng: center[1] })
        if (typeof mapplsMapRef.current.setZoom === "function") {
          mapplsMapRef.current.setZoom(7)
        }
      } catch (e) {}
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-[#e3effb] text-[#0078d4] border border-[#d1e2f2]">
              <Radio className="h-3 w-3 text-[#0078d4] animate-pulse" />
              {role === "DRIVER" ? "Driver Unit Radar" : "Live Telematics Radar"}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Sparkles className="h-3 w-3 text-emerald-600" />
              {role === "DRIVER" ? "Personal Telematics Stream" : "MapmyIndia InTouch Live"}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900">
            {role === "DRIVER" ? "My Assigned Vehicle Telematics" : "India National Logistics Fleet Radar"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
            {role === "DRIVER"
              ? "Live satellite & GPS tracking for your assigned operational transport unit."
              : "Real-time geospatial positioning powered by official MapmyIndia Mappls IoT Telematics feed."}
          </p>
        </div>

        {/* Right Controls: Metric Pills */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {role === "DRIVER" ? (
            <>
              <Link
                to="/duty"
                className="inline-flex items-center gap-1.5 py-1 sm:py-1.5 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>Duty Mode (Phone GPS)</span>
              </Link>
              <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-xl text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                Unit: <span className="text-[#0078d4]">{vehicles[0]?.plate || "SYNCING"}</span>
              </span>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-xl text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                Total: <span className="text-slate-900">{vehicles.length}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-xl text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Moving: {movingCount}
              </span>
              <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-xl text-xs font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
                Stopped: {idleCount}
              </span>
            </>
          )}
          <span className="inline-flex items-center gap-1.5 sm:gap-2 py-1 sm:py-1.5 px-2.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            GPS LOCK: ACTIVE
          </span>
        </div>
      </div>

      {/* 2. Map & Telematics Panel Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-auto lg:h-[620px]">
        {/* Map Canvas */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-2xl border border-slate-200 overflow-hidden relative shadow-sm bg-slate-100 flex flex-col h-[400px] sm:h-[480px] lg:h-full">
          {/* Map Container */}
          <div ref={mapContainerRef} className="h-full w-full z-10 relative">
            {isSdkLoading && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-900/90 text-white space-y-3">
                <div className="h-10 w-10 border-3 border-[#0078d4] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-bold tracking-tight">Connecting MapmyIndia Telematics Engine...</p>
                <p className="text-xs text-slate-400">Loading High-Definition Indian Fleet Grid</p>
              </div>
            )}
          </div>

          {/* Top Left Badge */}
          <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-[20] flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-xs font-bold text-slate-800 shadow-md">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div className="flex items-center gap-1.5">
              <span className="text-[#0078d4] font-black tracking-wide text-[10px] sm:text-xs">MAPPLS</span>
              <span className="text-slate-400">•</span>
              <span className="font-semibold text-slate-700 text-[10px] sm:text-[11px]">
                {mapEngine === "mappls" ? "Vector Web SDK" : "Fleet Telematics Engine"}
              </span>
            </div>
          </div>

          {/* Bottom Left Quick Action Buttons */}
          <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 z-[20] flex items-center gap-2">
            <button
              onClick={resetCorridorView}
              className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-xs font-bold text-slate-700 hover:text-[#0078d4] shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Compass className="h-3.5 w-3.5 text-[#0078d4]" />
              <span className="text-[10px] sm:text-xs">Reset Corridor</span>
            </button>
            <button
              onClick={() => setShowGeofences(!showGeofences)}
              className={`px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl backdrop-blur-md border text-xs font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                showGeofences
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white/95 border-slate-200 text-slate-700 hover:text-blue-600"
              }`}
            >
              <Warehouse className={`h-3.5 w-3.5 ${showGeofences ? "text-white" : "text-blue-600"}`} />
              <span className="text-[10px] sm:text-xs">
                {showGeofences ? "Hide Hubs" : `Show Hubs (${geofences.length > 0 ? geofences.length : "36,000+"})`}
              </span>
            </button>
            <button
              onClick={() => setClusteringEnabled(!clusteringEnabled)}
              className={`px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl backdrop-blur-md border text-xs font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                clusteringEnabled
                  ? "bg-[#0078d4] border-[#0078d4] text-white"
                  : "bg-white/95 border-slate-200 text-slate-700 hover:text-[#0078d4]"
              }`}
            >
              <Sparkles className={`h-3.5 w-3.5 ${clusteringEnabled ? "text-white" : "text-[#0078d4]"}`} />
              <span className="text-[10px] sm:text-xs">
                {clusteringEnabled ? "Clusters ON" : "Clusters OFF"}
              </span>
            </button>
          </div>
        </div>

        {/* Right Sidebar: Selected Vehicle Details + Paginated Fleet Units */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-3 h-[540px] lg:h-full overflow-hidden">
          {/* Selected Vehicle Card */}
          {selectedVehicle ? (
            <div className="rounded-xl bg-white border border-slate-200 p-3.5 shadow-sm shrink-0">
              <div className="flex items-center justify-between pb-1">
                {selectedVehicle.deviceId?.startsWith("PHONE-") ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
                    📱 Live Mobile GPS
                  </span>
                ) : (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      selectedVehicle.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        selectedVehicle.status === "ACTIVE" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                      }`}
                    />
                    {selectedVehicle.status === "ACTIVE" ? "Moving" : "Idle / Stopped"}
                  </span>
                )}
                <span className="font-mono text-xs text-[#0078d4] font-bold">
                  Unit #{selectedVehicle.id}
                </span>
              </div>

              <div className="flex items-center justify-between mt-1">
                <div>
                  <h3 className="text-base font-black text-slate-900 font-mono tracking-tight">
                    {selectedVehicle.plate}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">{selectedVehicle.model}</p>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-[#0078d4] text-base">
                    {selectedVehicle.speed} km/h
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {selectedVehicle.deviceId?.startsWith("PHONE-")
                      ? `Phone Battery: ${selectedVehicle.fuel || 90}%`
                      : (selectedVehicle.battery ? `Battery: ${selectedVehicle.battery}V` : "Sensor: No Voltage Wire")}
                  </div>
                </div>
              </div>

              <div className="mt-2 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-start gap-1.5 text-slate-600">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span className="line-clamp-2 text-[11px] font-medium leading-snug">
                    {selectedVehicle.destination || "Live Location Coordinates"}
                  </span>
                </div>
              </div>

              <div className="mt-2.5">
                <Button
                  onClick={() => focusVehicle(selectedVehicle)}
                  className="w-full text-xs h-8 gap-1.5 bg-[#0078d4] hover:bg-[#0069ba] text-white font-semibold cursor-pointer shadow-sm shadow-[#0078d4]/20"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  Zoom to Vehicle Location
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm shrink-0 flex items-center justify-center gap-2 text-slate-500 text-xs">
              <Radio className="h-4 w-4 animate-pulse text-[#0078d4]" />
              {isLoadingVehicles ? "Streaming live MapmyIndia telematics..." : "Select a vehicle from the fleet below"}
            </div>
          )}

          {/* Paginated Fleet Units List */}
          <div className="rounded-xl bg-white border border-slate-200 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Header, Search & Filter */}
            <div className="p-3 border-b border-slate-100 space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {role === "DRIVER" ? "Assigned Fleet Unit" : "Fleet Units"}
                </span>
                <span className="text-xs font-mono font-bold text-[#0078d4] bg-[#e3effb] px-2 py-0.5 rounded-full border border-[#d1e2f2]">
                  {role === "DRIVER" ? "1 Assigned" : `${filteredVehicles.length} of ${vehicles.length} Units`}
                </span>
              </div>

              {/* Search Bar (Admin & Dispatcher only) */}
              {role !== "DRIVER" && (
                <>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search vehicle number or location..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0078d4]"
                    />
                  </div>

                  {/* Status Filter Tabs */}
                  <div className="flex items-center gap-1.5 pt-0.5">
                    {(["ALL", "ACTIVE", "IDLE"] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => {
                          setStatusFilter(filter)
                          setCurrentPage(1)
                        }}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                          statusFilter === filter
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {filter === "ALL" ? "All" : filter === "ACTIVE" ? "Moving" : "Idle / Stopped"}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Paginated List Items */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 min-h-0">
              {paginatedVehicles.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No vehicles found matching filters
                </div>
              ) : (
                paginatedVehicles.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => focusVehicle(v)}
                    className={`p-2.5 text-xs cursor-pointer hover:bg-slate-50 transition-all flex items-center justify-between ${
                      selectedVehicle?.id === v.id
                        ? "bg-[#e3effb]/80 border-l-3 border-[#0078d4]"
                        : ""
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-slate-900 font-mono text-xs flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`h-2 w-2 rounded-full shrink-0 ${
                            v.status === "ACTIVE" ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                          }`}
                        />
                        <span className="truncate">{v.plate}</span>
                        {v.deviceId?.startsWith("PHONE-") && (
                          <span className="text-[9px] bg-cyan-100 text-cyan-800 font-sans px-1.5 py-0.5 rounded font-extrabold shrink-0">
                            📱 PHONE GPS
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[190px]">
                        {v.destination}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-[#0078d4] text-xs">
                        {v.speed} km/h
                      </span>
                      <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                        {v.status === "ACTIVE" ? "Moving" : "Stopped"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination Footer */}
            <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs shrink-0">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-[11px]"
              >
                <ChevronLeft className="h-3 w-3" />
                Prev
              </button>

              <span className="text-[11px] font-semibold text-slate-600">
                Page <span className="text-slate-900 font-bold">{currentPage}</span> of{" "}
                <span className="text-slate-900 font-bold">{totalPages}</span>
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-[11px]"
              >
                Next
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
