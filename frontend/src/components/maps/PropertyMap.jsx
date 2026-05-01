import React from 'react'
import { MapContainer, TileLayer, Marker, Circle, CircleMarker, Popup, Tooltip, ZoomControl } from 'react-leaflet'

import { ensureLeafletDefaultIconConfigured } from './leafletIconFix'

ensureLeafletDefaultIconConfigured()

export default function PropertyMap({ latitude, longitude, radiusM = 2000, poisByType = {} }) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return (
      <div className="w-full h-[220px] sm:h-[350px] flex items-center justify-center bg-gray-50 text-gray-500">
        Location map unavailable
      </div>
    )
  }

  const center = [latitude, longitude]
  const hasPois = poisByType && Object.values(poisByType).some((list) => Array.isArray(list) && list.length > 0)

  return (
    <MapContainer
      key={`property-map-${latitude}-${longitude}`}
      center={center}
      zoom={14}
      zoomControl={false}
      className="w-full h-[220px] sm:h-[350px] property-map-canvas"
      scrollWheelZoom={false}
    >
      <ZoomControl position="topleft" />
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CircleMarker
        center={center}
        radius={10}
        pathOptions={{ color: '#1d4ed8', fillColor: '#3b82f6', fillOpacity: 0.95, weight: 3 }}
      >
        <Tooltip direction="top" offset={[0, -10]} permanent opacity={1}>
          Location
        </Tooltip>
        <Popup>Property location</Popup>
      </CircleMarker>
      <Circle center={center} radius={radiusM} pathOptions={{ color: '#2563eb', fillColor: '#60a5fa', fillOpacity: 0.08 }} />

      {hasPois
        ? Object.entries(poisByType).flatMap(([type, list]) => {
            if (!Array.isArray(list)) return []
            return list.slice(0, 25).map((poi) => (
              <Marker key={poi.id} position={[poi.lat, poi.lng]}>
                <Popup>
                  <div className="text-sm font-semibold">{poi.name}</div>
                  <div className="text-xs text-gray-500">{type.replace(/_/g, ' ')}</div>
                </Popup>
              </Marker>
            ))
          })
        : null}
    </MapContainer>
  )
}
