import React from 'react'
import { MapContainer, TileLayer, Circle, CircleMarker, Popup, Tooltip, ZoomControl } from 'react-leaflet'

import { ensureLeafletDefaultIconConfigured } from './leafletIconFix'

ensureLeafletDefaultIconConfigured()

/** Color palette for each amenity type */
const TYPE_COLORS = {
  school: { color: '#f59e0b', fill: '#fbbf24' },       // amber
  hospital: { color: '#ef4444', fill: '#f87171' },      // red
  pharmacy: { color: '#10b981', fill: '#34d399' },      // emerald
  supermarket: { color: '#8b5cf6', fill: '#a78bfa' },   // violet
  park: { color: '#22c55e', fill: '#4ade80' },           // green
}

const DEFAULT_DOT = { color: '#6b7280', fill: '#9ca3af' }

export default function PropertyMap({
  latitude,
  longitude,
  radiusM = 2000,
  poisByType = {},
  highlightedType = null,
}) {
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
      style={{ zIndex: 1 }}
      scrollWheelZoom={true}
    >
      <ZoomControl position="topleft" />
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Property center marker */}
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

      {/* 2 km radius circle */}
      <Circle
        center={center}
        radius={radiusM}
        pathOptions={{ color: '#2563eb', fillColor: '#60a5fa', fillOpacity: 0.08 }}
      />

      {/* POI dots */}
      {hasPois
        ? Object.entries(poisByType).flatMap(([type, list]) => {
            if (!Array.isArray(list)) return []
            const palette = TYPE_COLORS[type] || DEFAULT_DOT
            const isHighlighted = highlightedType === type
            const isDimmed = highlightedType && !isHighlighted

            return list.slice(0, 25).map((poi) => (
              <CircleMarker
                key={poi.id}
                center={[poi.lat, poi.lng]}
                radius={isHighlighted ? 8 : 5}
                pathOptions={{
                  color: palette.color,
                  fillColor: palette.fill,
                  fillOpacity: isDimmed ? 0.25 : 0.85,
                  weight: isHighlighted ? 3 : 2,
                  opacity: isDimmed ? 0.3 : 1,
                }}
              >
                <Popup>
                  <div className="text-sm font-semibold">{poi.name}</div>
                  <div className="text-xs text-gray-500">{type.replace(/_/g, ' ')}</div>
                </Popup>
              </CircleMarker>
            ))
          })
        : null}
    </MapContainer>
  )
}
