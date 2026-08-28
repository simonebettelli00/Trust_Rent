import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const icon = L.divIcon({
  className: "",
  html: `<div style="background:#1d4ed8;width:18px;height:18px;border-radius:9999px;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function PropertyMiniMap({ lat, lng }) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      scrollWheelZoom={false}
      dragging={false}
      doubleClickZoom={false}
      className="w-full h-64 rounded-2xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={icon} />
    </MapContainer>
  );
}

export default PropertyMiniMap;
