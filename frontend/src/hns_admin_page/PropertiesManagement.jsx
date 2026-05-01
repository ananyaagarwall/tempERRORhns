import React from "react";
import LocationPicker from "../components/maps/LocationPicker";
import api from "../services/apiInstance";
import { API_API_URL } from "../config";

const wrapperStyle = {
  minHeight: "100%",
  background: "#f4f6f8",
  fontFamily: "Arial, sans-serif",
};

const cardStyle = {
  background: "#fff",
  padding: "22px 24px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
};

const labelStyle = {
  display: "block",
  marginBottom: 8,
  fontWeight: 700,
  color: "#374151",
  fontSize: 13,
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const smallTextStyle = {
  marginTop: 6,
  color: "#6b7280",
  fontSize: 12,
};

const buttonStyle = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
  fontWeight: 800,
  fontSize: 14,
  cursor: "pointer",
};

const primaryButtonStyle = {
  ...buttonStyle,
  background: "#185a9d",
  color: "#fff",
};

const secondaryButtonStyle = {
  ...buttonStyle,
  background: "#eef2f7",
  color: "#111827",
  border: "1px solid #d1d5db",
};

const safeNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const formatCoord = (value) => (typeof value === "number" ? value.toFixed(6) : "—");

const validateCoords = (lat, lng) => {
  if (lat === null && lng === null) return "";
  if (lat === null || lng === null) return "Latitude and longitude must be provided together.";
  if (lat < -90 || lat > 90) return "Latitude must be between -90 and 90.";
  if (lng < -180 || lng > 180) return "Longitude must be between -180 and 180.";
  return "";
};

const PropertiesManagement = () => {
  const [properties, setProperties] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [filterText, setFilterText] = React.useState("");

  const [selectedId, setSelectedId] = React.useState("");
  const [latitude, setLatitude] = React.useState("");
  const [longitude, setLongitude] = React.useState("");
  const [locationSource, setLocationSource] = React.useState("manual");
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState("");
  const [saveSuccess, setSaveSuccess] = React.useState("");

  const loadProperties = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/properties");
      const list = Array.isArray(res.data) ? res.data : [];
      setProperties(list);
    } catch (err) {
      setProperties([]);
      setError(err?.response?.data?.error || err?.message || "Failed to load properties.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const selectedProperty = React.useMemo(() => {
    const idNum = safeNumber(selectedId);
    if (idNum === null) return null;
    return properties.find((p) => Number(p?.id) === idNum) || null;
  }, [properties, selectedId]);

  React.useEffect(() => {
    if (!selectedProperty) return;
    const nextLat = typeof selectedProperty.latitude === "number" ? String(selectedProperty.latitude) : "";
    const nextLng = typeof selectedProperty.longitude === "number" ? String(selectedProperty.longitude) : "";
    setLatitude(nextLat);
    setLongitude(nextLng);
    setLocationSource(selectedProperty.location_source || "manual");
    setSaveError("");
    setSaveSuccess("");
  }, [selectedProperty]);

  const filteredProperties = React.useMemo(() => {
    const needle = String(filterText || "").trim().toLowerCase();
    if (!needle) return properties;
    return properties.filter((p) => {
      const name = String(p?.Property_Name || "").toLowerCase();
      const loc = String(p?.Location || "").toLowerCase();
      const address = String(p?.Address || "").toLowerCase();
      return name.includes(needle) || loc.includes(needle) || address.includes(needle);
    });
  }, [properties, filterText]);

  const defaultQuery = React.useMemo(() => {
    if (!selectedProperty) return "";
    return [selectedProperty.Address, selectedProperty.Location, selectedProperty.Property_Name]
      .map((v) => String(v || "").trim())
      .filter(Boolean)
      .join(", ");
  }, [selectedProperty]);

  const coordsPreview = React.useMemo(() => {
    const lat = safeNumber(latitude);
    const lng = safeNumber(longitude);
    return { lat, lng, error: validateCoords(lat, lng) };
  }, [latitude, longitude]);

  const onSaveCoords = async () => {
    if (!selectedProperty?.id) return;

    setSaving(true);
    setSaveError("");
    setSaveSuccess("");

    try {
      const lat = safeNumber(latitude);
      const lng = safeNumber(longitude);
      const coordsError = validateCoords(lat, lng);
      if (coordsError) {
        setSaveError(coordsError);
        return;
      }

      const payload =
        lat === null && lng === null
          ? { latitude: null, longitude: null, location_source: locationSource || "unknown" }
          : { latitude: lat, longitude: lng, location_source: locationSource || "manual" };

      const res = await api.patch(`/properties/${selectedProperty.id}`, payload);
      const updated = res.data;
      setProperties((prev) => prev.map((p) => (Number(p?.id) === Number(updated?.id) ? updated : p)));
      setSaveSuccess("Saved coordinates.");
    } catch (err) {
      setSaveError(err?.response?.data?.error || err?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const onClearCoords = async () => {
    setLatitude("");
    setLongitude("");
    setLocationSource((prev) => prev || "unknown");
    await onSaveCoords();
  };

  return (
    <div style={wrapperStyle}>
      <div style={{ padding: "8px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ margin: 0, color: "#111827" }}>Properties: Coordinates</h1>
          <button type="button" style={secondaryButtonStyle} onClick={loadProperties} disabled={loading}>
            Refresh
          </button>
        </div>

        <div style={{ marginTop: 14, color: "#6b7280", fontSize: 13 }}>
          Set latitude/longitude so the property page can render the map and fetch nearby places.
        </div>

        <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "380px 1fr", gap: 16 }}>
          <div style={cardStyle}>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Search</label>
              <input
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filter by name / location / address…"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Select Property</label>
              {loading ? (
                <div style={{ color: "#6b7280", fontSize: 13 }}>Loading properties…</div>
              ) : error ? (
                <div style={{ color: "#b91c1c", fontSize: 13 }}>{error}</div>
              ) : (
                <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} style={inputStyle}>
                  <option value="">Choose…</option>
                  {filteredProperties.map((p) => (
                    <option key={p?.id} value={String(p?.id)}>
                      {String(p?.Property_Name || `Property #${p?.id || ""}`).trim()} —{" "}
                      {String(p?.Location || "Location on request").trim()}
                    </option>
                  ))}
                </select>
              )}
              <div style={smallTextStyle}>
                {selectedProperty
                  ? `Current coords: lat ${formatCoord(selectedProperty.latitude)} | lng ${formatCoord(
                      selectedProperty.longitude
                    )}`
                  : "Pick a property to edit coordinates."}
              </div>
            </div>

            {selectedProperty ? (
              <div>
                <label style={labelStyle}>Latitude</label>
                <input
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g. 19.0760"
                  style={inputStyle}
                />

                <div style={{ height: 12 }} />

                <label style={labelStyle}>Longitude</label>
                <input
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g. 72.8777"
                  style={inputStyle}
                />

                <div style={{ height: 12 }} />

                <label style={labelStyle}>Source</label>
                <select value={locationSource} onChange={(e) => setLocationSource(e.target.value)} style={inputStyle}>
                  <option value="manual">manual</option>
                  <option value="geocoded">geocoded</option>
                  <option value="unknown">unknown</option>
                </select>

                {coordsPreview.error ? (
                  <div style={{ marginTop: 10, color: "#b91c1c", fontSize: 13 }}>{coordsPreview.error}</div>
                ) : null}
                {saveError ? <div style={{ marginTop: 10, color: "#b91c1c", fontSize: 13 }}>{saveError}</div> : null}
                {saveSuccess ? (
                  <div style={{ marginTop: 10, color: "#065f46", fontSize: 13 }}>{saveSuccess}</div>
                ) : null}

                <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                  <button
                    type="button"
                    style={primaryButtonStyle}
                    onClick={onSaveCoords}
                    disabled={saving || !!coordsPreview.error}
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button type="button" style={secondaryButtonStyle} onClick={onClearCoords} disabled={saving}>
                    Clear
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>Pin Drop (Recommended)</div>
                <div style={{ marginTop: 6, color: "#6b7280", fontSize: 12 }}>
                  Use search to prefill, then click on the map to drop the exact pin.
                </div>
              </div>
              <div style={{ color: "#6b7280", fontSize: 12 }}>
                Endpoint: <span style={{ fontFamily: "monospace" }}>{API_API_URL}/geocode</span>
              </div>
            </div>

            <div style={{ marginTop: 12, opacity: selectedProperty ? 1 : 0.55 }}>
              <LocationPicker
                apiBaseUrl={API_API_URL}
                latitude={safeNumber(latitude) ?? undefined}
                longitude={safeNumber(longitude) ?? undefined}
                defaultQuery={defaultQuery}
                onChange={({ latitude: lat, longitude: lng, location_source }) => {
                  setLatitude(typeof lat === "number" ? String(lat) : "");
                  setLongitude(typeof lng === "number" ? String(lng) : "");
                  setLocationSource(location_source || "manual");
                  setSaveError("");
                  setSaveSuccess("");
                }}
                height={360}
              />
            </div>

            {!selectedProperty ? (
              <div style={{ marginTop: 10, color: "#6b7280", fontSize: 13 }}>
                Select a property on the left to enable the picker.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertiesManagement;
