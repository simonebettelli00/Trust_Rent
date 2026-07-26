import { Link } from "react-router-dom";
import { resolveImageUrl } from "../api/propertiesApi";
import Card from "./Card";

function PropertyCard({ property, highlighted, onHover, onLeave, onClick }) {
  return (
    <Card
      className={`flex gap-3 cursor-pointer transition-shadow ${
        highlighted ? "ring-2 ring-primary-600" : ""
      }`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      <div className="w-24 h-24 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
        {property.cover_image_url ? (
          <img
            src={resolveImageUrl(property.cover_image_url)}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
            Nessuna foto
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{property.title}</h3>
        <p className="text-sm text-gray-500 truncate">
          {property.address}, {property.city}
        </p>
        <p className="text-sm text-gray-600">
          {property.sqm ? `${property.sqm} m² · ` : ""}
          {property.num_rooms ? `${property.num_rooms} locali` : ""}
        </p>
        <p className="text-sm font-semibold text-primary-700 mt-auto">
          € {Number(property.monthly_price).toLocaleString("it-IT")}/mese
        </p>
        <Link
          to={`/property/${property.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-primary-700 hover:underline"
        >
          Vedi dettaglio →
        </Link>
      </div>
    </Card>
  );
}

export default PropertyCard;
