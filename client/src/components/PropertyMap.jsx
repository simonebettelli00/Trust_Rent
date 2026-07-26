import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import { resolveImageUrl } from "../api/propertiesApi";

const DEBOUNCE_MS = 400;

function createIcon(highlighted) {
  return L.divIcon({
    className: "",
    html: `<div style="background:${
      highlighted ? "#059669" : "#1d4ed8"
    };width:18px;height:18px;border-radius:9999px;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -9],
  });
}

function boundsToObject(bounds) {
  return {
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest(),
  };
}

function MapEventsHandler({ onBoundsChange }) {
  const timeoutRef = useRef(null);

  const map = useMapEvents({
    moveend: scheduleUpdate,
    zoomend: scheduleUpdate,
  });

  function scheduleUpdate() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onBoundsChange(boundsToObject(map.getBounds()));
    }, DEBOUNCE_MS);
  }

  useEffect(() => {
    onBoundsChange(boundsToObject(map.getBounds()));
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

function FlyToController({ flyTo }) {
  const map = useMap();

  useEffect(() => {
    if (flyTo) {
      map.flyTo([flyTo.lat, flyTo.lng], flyTo.zoom ?? 14);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyTo?.key]);

  return null;
}

function PropertyMap({
  properties,
  highlightedId,
  onMarkerHover,
  onMarkerLeave,
  onMarkerClick,
  onBoundsChange,
  flyTo,
  initialCenter = [41.9028, 12.4964],
  initialZoom = 6,
}) {
  return (
    <MapContainer center={initialCenter} zoom={initialZoom} className="w-full h-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEventsHandler onBoundsChange={onBoundsChange} />
      <FlyToController flyTo={flyTo} />

      {properties.map((property) => (
        <Marker
          key={property.id}
          position={[property.lat, property.lng]}
          icon={createIcon(property.id === highlightedId)}
          eventHandlers={{
            mouseover: () => onMarkerHover?.(property.id),
            mouseout: () => onMarkerLeave?.(),
            click: () => onMarkerClick?.(property.id),
          }}
        >
          <Popup>
            <div className="flex flex-col gap-1 w-40">
              {property.cover_image_url && (
                <img
                  src={resolveImageUrl(property.cover_image_url)}
                  alt=""
                  className="w-full h-20 object-cover rounded"
                />
              )}
              <strong>{property.title}</strong>
              <span>
                € {Number(property.monthly_price).toLocaleString("it-IT")}/mese
                {property.sqm ? ` · ${property.sqm} m²` : ""}
              </span>
              <Link to={`/property/${property.id}`} className="text-primary-700 hover:underline">
                Vedi dettaglio →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default PropertyMap;
