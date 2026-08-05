import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { useAuth } from "../context/AuthContext";
import * as propertiesApi from "../api/propertiesApi";
import * as conversationsApi from "../api/conversationsApi";
import { OPTIONS as FURNISHING_OPTIONS } from "../components/FurnishingsCheckboxes";
import ImageGallery from "../components/ImageGallery";
import PropertyMiniMap from "../components/PropertyMiniMap";
import Card from "../components/Card";
import Button from "../components/Button";

const FURNISHING_LABELS = Object.fromEntries(FURNISHING_OPTIONS.map((o) => [o.value, o.label]));

const STATUS_LABELS = {
  available: "Disponibile",
  booked: "Prenotato",
  blocked: "Non disponibile",
};

function groupAvailabilityByStatus(availability) {
  const groups = { available: [], booked: [], blocked: [] };
  for (const entry of availability) {
    const date = new Date(entry.date);
    if (groups[entry.status]) groups[entry.status].push(date);
  }
  return groups;
}

function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const calendarRef = useRef(null);

  const [property, setProperty] = useState(null);
  const [images, setImages] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([propertiesApi.getOne(id), propertiesApi.getAvailability(id)])
      .then(([detail, availabilityRes]) => {
        setProperty(detail.property);
        setImages(detail.images);
        setAvailability(availabilityRes.availability);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleContact() {
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role !== "tenant") {
      navigate("/messages");
      return;
    }
    setContacting(true);
    setError("");
    try {
      const { conversation } = await conversationsApi.create(token, property.id);
      navigate(`/messages?conversation=${conversation.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setContacting(false);
    }
  }

  function handleRequestAppointment() {
    if (!user) {
      navigate("/login");
      return;
    }
    calendarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (loading) return <p className="p-6 text-gray-500">Caricamento...</p>;
  if (error) {
    return (
      <p className="p-6 text-red-600 bg-red-50 border border-red-200 rounded-lg m-6">{error}</p>
    );
  }
  if (!property) return null;

  const furnishings = property.furnishings || [];
  const modifiers = groupAvailabilityByStatus(availability);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full flex flex-col gap-8">
      <ImageGallery images={images} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>
            <p className="text-gray-500">
              {property.address}, {property.city}
            </p>
            {property.owner_name && (
              <p className="text-sm text-gray-400 mt-1">Proprietario: {property.owner_name}</p>
            )}
          </div>

          {property.description && (
            <p className="text-gray-700 whitespace-pre-line">{property.description}</p>
          )}

          <Card>
            <h2 className="font-semibold text-gray-900 mb-3">Caratteristiche</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-gray-700">
              {property.floor && (
                <div>
                  <span className="text-gray-400 block">Piano</span>
                  {property.floor}
                </div>
              )}
              {property.sqm && (
                <div>
                  <span className="text-gray-400 block">Metri quadri</span>
                  {property.sqm} m²
                </div>
              )}
              {property.num_rooms && (
                <div>
                  <span className="text-gray-400 block">Stanze</span>
                  {property.num_rooms}
                </div>
              )}
              {property.num_bathrooms && (
                <div>
                  <span className="text-gray-400 block">Bagni</span>
                  {property.num_bathrooms}
                </div>
              )}
              <div>
                <span className="text-gray-400 block">Deposito</span>
                {property.deposit ? `€ ${Number(property.deposit).toLocaleString("it-IT")}` : "—"}
              </div>
              {property.available_from && (
                <div>
                  <span className="text-gray-400 block">Disponibile da</span>
                  {new Date(property.available_from).toLocaleDateString("it-IT")}
                </div>
              )}
            </div>

            {furnishings.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {furnishings.map((value) => (
                  <span
                    key={value}
                    className="text-xs font-medium bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full"
                  >
                    {FURNISHING_LABELS[value] || value}
                  </span>
                ))}
              </div>
            )}
          </Card>

          {property.lat != null && property.lng != null ? (
            <PropertyMiniMap lat={property.lat} lng={property.lng} />
          ) : (
            <div className="w-full h-64 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 text-sm">
              Posizione non ancora disponibile su mappa
            </div>
          )}

          <div ref={calendarRef}>
            <Card>
              <h2 className="font-semibold text-gray-900 mb-3">Disponibilità</h2>
              <DayPicker
                modifiers={modifiers}
                modifiersClassNames={{
                  available: "!bg-secondary-100 !text-secondary-700 rounded-full",
                  booked: "!bg-red-100 !text-red-600 rounded-full",
                  blocked: "!bg-gray-200 !text-gray-400 rounded-full",
                }}
              />
              <div className="flex gap-4 text-xs text-gray-600 mt-3">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-secondary-100 inline-block" />
                  {STATUS_LABELS.available}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-red-100 inline-block" />
                  {STATUS_LABELS.booked}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-gray-200 inline-block" />
                  {STATUS_LABELS.blocked}
                </span>
              </div>
            </Card>
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="flex flex-col gap-4 sticky top-6">
            <p className="text-2xl font-bold text-primary-700">
              € {Number(property.monthly_price).toLocaleString("it-IT")}
              <span className="text-sm text-gray-500 font-normal">/mese</span>
            </p>
            <Button variant="primary" onClick={handleContact} loading={contacting}>
              Contatta il proprietario
            </Button>
            <Button variant="outline" onClick={handleRequestAppointment}>
              Richiedi appuntamento
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default PropertyDetail;
