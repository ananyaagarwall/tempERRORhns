import React from 'react'
import { MapContainer, TileLayer, Marker, ZoomControl, useMapEvents } from 'react-leaflet'

import { ensureLeafletDefaultIconConfigured } from './leafletIconFix'

ensureLeafletDefaultIconConfigured()

const DEFAULT_CENTER = [19.076, 72.8777] // Mumbai (fallback)

function ClickToSetMarker({ onPick }) {
  useMapEvents({
    click(event) {
      const { lat, lng } = event.latlng || {}
      if (typeof lat === 'number' && typeof lng === 'number') {
        onPick({ latitude: lat, longitude: lng, source: 'manual' })
      }
    },
  })
  return null
}

export default function LocationPicker({
  apiBaseUrl,
  latitude,
  longitude,
  onChange,
  defaultQuery = '',
  height = 320,
}) {
  const initialLat = typeof latitude === 'number' ? latitude : null
  const initialLng = typeof longitude === 'number' ? longitude : null
  const initialCenter = initialLat !== null && initialLng !== null ? [initialLat, initialLng] : DEFAULT_CENTER

  const [center, setCenter] = React.useState(initialCenter)
  const [marker, setMarker] = React.useState(
    initialLat !== null && initialLng !== null ? { latitude: initialLat, longitude: initialLng } : null
  )
  const [query, setQuery] = React.useState(defaultQuery)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    if (typeof latitude === 'number' && typeof longitude === 'number') {
      setMarker({ latitude, longitude })
      setCenter([latitude, longitude])
    }
  }, [latitude, longitude])

  const handlePick = React.useCallback(
    ({ latitude: nextLat, longitude: nextLng, source }) => {
      setMarker({ latitude: nextLat, longitude: nextLng })
      setCenter([nextLat, nextLng])
      onChange?.({ latitude: nextLat, longitude: nextLng, location_source: source || 'manual' })
    },
    [onChange]
  )

  const geocode = async () => {
    const trimmed = String(query || '').trim()
    if (!trimmed) return
    setError('')
    setLoading(true)
    try {
      const base = apiBaseUrl ? String(apiBaseUrl).replace(/\/$/, '') : ''
      const res = await fetch(`${base}/geocode?q=${encodeURIComponent(trimmed)}`)
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Geocoding failed')
      }
      const best = Array.isArray(data) ? data[0] : null
      if (!best || typeof best.lat !== 'number' || typeof best.lng !== 'number') {
        throw new Error('No results')
      }
      handlePick({ latitude: best.lat, longitude: best.lng, source: 'geocoded' })
    } catch (err) {
      setError(err?.message || 'Geocoding failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search address (optional)"
          style={{
            flex: 1,
            padding: '10px 12px',
            border: '1px solid #ddd',
            borderRadius: 8,
            fontSize: 14,
          }}
        />
        <button
          type="button"
          onClick={geocode}
          disabled={loading}
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #1e40af',
            background: loading ? '#93c5fd' : '#2563eb',
            color: 'white',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Searching…' : 'Find'}
        </button>
      </div>

      {error ? <div style={{ color: '#b91c1c', marginBottom: 10, fontSize: 13 }}>{error}</div> : null}

      <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
        <MapContainer
          center={center}
          zoom={15}
          zoomControl={false}
          style={{ width: '100%', height }}
          scrollWheelZoom={false}
        >
          <ZoomControl position="topright" />
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickToSetMarker onPick={handlePick} />
          {marker ? <Marker position={[marker.latitude, marker.longitude]} draggable={false} /> : null}
        </MapContainer>
      </div>

      <div style={{ marginTop: 10, fontSize: 13, color: '#374151' }}>
        <div>
          <strong>Tip:</strong> click on the map to drop the pin.
        </div>
        <div style={{ marginTop: 6 }}>
          <span style={{ fontFamily: 'monospace' }}>
            lat: {marker ? marker.latitude.toFixed(6) : '—'} | lng: {marker ? marker.longitude.toFixed(6) : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}
