import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'
import 'leaflet-geosearch/dist/geosearch.css'
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch'
import 'leaflet-routing-machine'
import { Maximize2, Minimize2, Navigation, Search, MapPin } from 'lucide-react'

// Re-configure leaflet marker default icons to prevent broken images in Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

// Custom SVG Icons for a premium look
const createCustomIcon = (color: string) => {
  return L.divIcon({
    html: `
      <div class="flex items-center justify-center w-8 h-8 rounded-full shadow-glow animate-pulse" style="background-color: ${color}; border: 2px solid white;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" class="w-4 h-4">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `,
    className: 'custom-leaflet-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -30]
  })
}

const brandIcon = createCustomIcon('#6366f1') // Indigo
const accentIcon = createCustomIcon('#f97316') // Orange
const userIcon = createCustomIcon('#3b82f6') // Blue (for user position)

interface MapMarker {
  id: string
  lat: number
  lng: number
  title: string
  priceLabel?: string
  type?: 'property' | 'mess' | 'user'
}

interface MapComponentProps {
  center: [number, number]
  zoom?: number
  markers?: MapMarker[]
  height?: string
  interactivePicker?: boolean
  onLocationSelect?: (lat: number, lng: number) => void
  showSearchAndRouting?: boolean
}

// Sub-component to center map when props update
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
    setTimeout(() => {
      map.invalidateSize()
    }, 250)
  }, [center, zoom, map])
  return null
}

// User Location Tracker Component
function UserLocationMarker() {
  const map = useMap()
  const [position, setPosition] = useState<[number, number] | null>(null)

  useEffect(() => {
    const onLocationFound = (e: any) => {
      setPosition([e.latlng.lat, e.latlng.lng])
      map.flyTo(e.latlng, 15)
    }
    map.on('locationfound', onLocationFound)
    return () => {
      map.off('locationfound', onLocationFound)
    }
  }, [map])

  return position === null ? null : (
    <Marker position={position} icon={userIcon}>
      <Popup>
        <div className="p-1 text-center">
          <p className="font-semibold text-slate-800 text-xs">You are here 📍</p>
        </div>
      </Popup>
    </Marker>
  )
}

function LocationPickerControl({ onLocationSelect, initialPos }: { onLocationSelect: (lat: number, lng: number) => void, initialPos: [number, number] }) {
  const map = useMap()
  const [pos, setPos] = useState<[number, number]>(initialPos)

  useEffect(() => {
    const onClick = (e: any) => {
      setPos([e.latlng.lat, e.latlng.lng])
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    }
    map.on('click', onClick)
    return () => { map.off('click', onClick) }
  }, [map, onLocationSelect])

  return (
    <Marker position={pos} icon={accentIcon}>
      <Popup>Selected Location</Popup>
    </Marker>
  )
}

function RoutingAndSearchControl({ target }: { target: [number, number] | null }) {
  const map = useMap();
  const [userPos, setUserPos] = useState<[number, number] | null>(null);

  useEffect(() => {
    map.locate().on('locationfound', (e: any) => setUserPos([e.latlng.lat, e.latlng.lng]));
    
    // Add GeoSearch
    const provider = new OpenStreetMapProvider();
    const searchControl = new (GeoSearchControl as any)({
      provider: provider,
      style: 'bar',
      showMarker: true,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
      searchLabel: 'Google Maps like search...'
    });
    map.addControl(searchControl);
    return () => { map.removeControl(searchControl); };
  }, [map]);

  useEffect(() => {
    if (!target || !userPos) return;
    const routingControl = (L as any).Routing.control({
      waypoints: [
        L.latLng(userPos[0], userPos[1]),
        L.latLng(target[0], target[1])
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      showAlternatives: true,
      fitSelectedRoutes: true,
      lineOptions: {
        styles: [{ color: '#6366f1', weight: 4 }]
      }
    }).addTo(map);

    return () => {
      map.removeControl(routingControl);
    };
  }, [map, target, userPos]);

  return null;
}

export default function MapComponent({
  center,
  zoom = 13,
  markers = [],
  height = '400px',
  interactivePicker = false,
  onLocationSelect,
  showSearchAndRouting = false,
}: MapComponentProps) {
  const [map, setMap] = useState<L.Map | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'))
  const [searchTerm, setSearchTerm] = useState('')
  const [routingTarget, setRoutingTarget] = useState<[number, number] | null>(null)

  // Listen for website light/dark theme switch to reload Map Tiles style
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false)
      }
    }
    if (isFullscreen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isFullscreen])

  // Trigger invalidation of layout sizes when toggled
  useEffect(() => {
    if (map) {
      setTimeout(() => {
        map.invalidateSize()
      }, 250)
    }
  }, [isFullscreen, map])

  const handleZoomIn = () => {
    if (map) map.zoomIn()
  }

  const handleZoomOut = () => {
    if (map) map.zoomOut()
  }

  const handleLocate = () => {
    if (map) map.locate({ setView: true, maxZoom: 16 })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim() || !map) return
    const match = markers.find(m => m.title.toLowerCase().includes(searchTerm.toLowerCase()))
    if (match) {
      map.setView([match.lat, match.lng], 16)
    }
  }

  // Google Maps Voyager Map Tiles URL or Dark Matter Map Tiles URL
  const tileLayerUrl = isDark 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"

  const mapContent = (
    <div 
      className={isFullscreen 
        ? "fixed inset-0 z-[9999] w-screen h-screen bg-slate-950 flex flex-col"
        : "w-full h-full relative"
      }
    >
      {/* Top Left Search Bar - Only show if not using geosearch */}
      {!showSearchAndRouting && (
        <div className="absolute top-3 left-3 z-[1000] w-64 sm:w-80">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden px-3 py-1.5 gap-2">
            <Search className="w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search this map..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-sm bg-transparent border-none focus:outline-none focus:ring-0 text-slate-800 dark:text-slate-100 placeholder-slate-400 py-1"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-slate-400 hover:text-slate-600 text-xs px-1"
            >
              ✕
            </button>
          )}
          </form>
        </div>
      )}

      {/* Top Right Fullscreen Button */}
      <div className="absolute top-3 right-3 z-[1000]">
        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-200 flex items-center justify-center"
          title={isFullscreen ? "Exit Fullscreen (Esc)" : "Make Map Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="w-4.5 h-4.5" /> : <Maximize2 className="w-4.5 h-4.5" />}
        </button>
      </div>

      {/* Right Side Zoom & GPS controls */}
      <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2.5">
        {/* GPS Locate Button */}
        <button
          type="button"
          onClick={handleLocate}
          className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-brand-600 dark:text-brand-400 transition-all flex items-center justify-center"
          title="Locate Me / Show My GPS Location"
        >
          <Navigation className="w-4.5 h-4.5 fill-brand-600 dark:fill-brand-400" />
        </button>

        {/* Zoom Controls */}
        <div className="flex flex-col border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 text-center font-bold text-base leading-none w-10.5 h-10.5 flex items-center justify-center"
          >
            ＋
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-center font-bold text-base leading-none w-10.5 h-10.5 flex items-center justify-center"
          >
            －
          </button>
        </div>
      </div>

      <MapContainer
        ref={setMap}
        center={center}
        zoom={zoom}
        zoomControl={false}
        style={{ width: '100%', height: '100%', zIndex: 10 }}
        scrollWheelZoom={true}
      >
        <ChangeView center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url={tileLayerUrl}
        />
        {!interactivePicker && <UserLocationMarker />}
        {interactivePicker && onLocationSelect && (
          <LocationPickerControl onLocationSelect={onLocationSelect} initialPos={center} />
        )}
        {showSearchAndRouting && <RoutingAndSearchControl target={routingTarget} />}
        {!interactivePicker && markers.map((marker) => {
          let icon = brandIcon
          if (marker.type === 'mess') icon = accentIcon
          if (marker.type === 'user') icon = userIcon

          return (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={icon}
            >
              <Popup>
                <div className="p-1">
                  <p className="font-semibold text-slate-800 text-sm leading-tight">{marker.title}</p>
                  {marker.priceLabel && (
                    <p className="text-xs text-brand-600 font-bold mt-1">{marker.priceLabel}</p>
                  )}
                  {showSearchAndRouting && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRoutingTarget([marker.lat, marker.lng]);
                      }}
                      className="mt-2 w-full text-[10px] bg-brand-500 hover:bg-brand-600 text-white px-2 py-1.5 rounded flex items-center justify-center gap-1 transition-colors"
                    >
                      <Navigation className="w-3 h-3" /> Get Directions
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )

  return (
    <div 
      className="w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm relative bg-slate-100 dark:bg-slate-900" 
      style={{ height }}
    >
      {isFullscreen ? createPortal(mapContent, document.body) : mapContent}
    </div>
  )
}
