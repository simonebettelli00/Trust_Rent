import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import * as propertiesApi from "../../api/propertiesApi";
import Card from "../../components/Card";
import Input from "../../components/Input";
import Button from "../../components/Button";
import FurnishingsCheckboxes from "../../components/FurnishingsCheckboxes";
import ImageUploader from "../../components/ImageUploader";
import SlotManager from "../../components/SlotManager";
import Skeleton from "../../components/Skeleton";
import Modal from "../../components/Modal";

const EMPTY_FORM = {
  title: "",
  description: "",
  rentalType: "long",
  address: "",
  city: "",
  postalCode: "",
  floor: "",
  sqm: "",
  numRooms: "",
  numBathrooms: "",
  furnishings: [],
  monthlyPrice: "",
  deposit: "",
  availableFrom: "",
};

function validate(form) {
  const errors = {};
  if (!form.title.trim()) errors.title = "Il titolo è obbligatorio";
  if (!form.address.trim()) errors.address = "L'indirizzo è obbligatorio";
  if (!form.city.trim()) errors.city = "La città è obbligatoria";
  if (!form.monthlyPrice || Number(form.monthlyPrice) <= 0) {
    errors.monthlyPrice = "Il canone mensile deve essere un numero positivo";
  }
  return errors;
}

function PropertyForm() {
  const { token } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [images, setImages] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [geocodePrecision, setGeocodePrecision] = useState(null);
  const [showRentalTypeConfirm, setShowRentalTypeConfirm] = useState(false);
  const originalRentalType = useRef(null);

  useEffect(() => {
    if (!isEdit) return;
    Promise.all([propertiesApi.getOne(id), propertiesApi.getSlots(id)])
      .then(([{ property, images }, { slots }]) => {
        setForm({
          title: property.title,
          description: property.description || "",
          rentalType: property.rental_type || "long",
          address: property.address,
          city: property.city,
          postalCode: property.postal_code || "",
          floor: property.floor || "",
          sqm: property.sqm ?? "",
          numRooms: property.num_rooms ?? "",
          numBathrooms: property.num_bathrooms ?? "",
          furnishings: property.furnishings || [],
          monthlyPrice: property.monthly_price,
          deposit: property.deposit ?? "",
          availableFrom: property.available_from ? property.available_from.slice(0, 10) : "",
        });
        setImages(images);
        setSlots(slots);
        originalRentalType.current = property.rental_type || "long";
        setGeocodePrecision(
          property.lat != null && property.lng != null
            ? property.geocode_precision || "civico"
            : "none"
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (
      isEdit &&
      originalRentalType.current &&
      form.rentalType !== originalRentalType.current &&
      slots.length > 0
    ) {
      setShowRentalTypeConfirm(true);
      return;
    }

    doSubmit();
  }

  async function doSubmit() {
    setShowRentalTypeConfirm(false);
    setError("");
    setSubmitting(true);
    try {
      if (isEdit) {
        const { property } = await propertiesApi.update(token, id, form);
        originalRentalType.current = property.rental_type;
        setGeocodePrecision(
          property.lat != null && property.lng != null
            ? property.geocode_precision || "civico"
            : "none"
        );
      } else {
        const { property } = await propertiesApi.create(token, form);
        navigate(`/owner/property/${property.id}/edit`, { replace: true });
        return;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10 flex-1 w-full flex flex-col gap-4">
        <Skeleton className="h-4 w-32" />
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4">
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 flex-1 w-full">
      <Link to="/owner" className="text-sm text-primary-700 hover:underline">
        ← Torna alla dashboard
      </Link>

      <Card className="mt-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isEdit ? "Modifica immobile" : "Nuovo immobile"}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            name="title"
            label="Titolo"
            value={form.title}
            onChange={handleChange}
            error={fieldErrors.title}
          />

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">Tipo di affitto</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, rentalType: "long" }))}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                  form.rentalType === "long"
                    ? "border-primary-600 bg-primary-50 text-primary-700"
                    : "border-gray-300 text-gray-600"
                }`}
              >
                Lungo termine
              </button>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, rentalType: "short" }))}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                  form.rentalType === "short"
                    ? "border-secondary-600 bg-secondary-50 text-secondary-700"
                    : "border-gray-300 text-gray-600"
                }`}
              >
                Breve termine
              </button>
            </div>
          </div>

          <label className="flex flex-col gap-1 text-left">
            <span className="text-sm font-medium text-gray-700">Descrizione</span>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              name="address"
              label="Indirizzo"
              value={form.address}
              onChange={handleChange}
              error={fieldErrors.address}
            />
            <Input
              name="city"
              label="Città"
              value={form.city}
              onChange={handleChange}
              error={fieldErrors.city}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input name="postalCode" label="CAP" value={form.postalCode} onChange={handleChange} />
            <Input name="floor" label="Piano" value={form.floor} onChange={handleChange} />
            <Input
              name="sqm"
              type="number"
              label="Metri quadri"
              value={form.sqm}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              name="numRooms"
              type="number"
              label="Numero stanze"
              value={form.numRooms}
              onChange={handleChange}
            />
            <Input
              name="numBathrooms"
              type="number"
              label="Numero bagni"
              value={form.numBathrooms}
              onChange={handleChange}
            />
          </div>

          <FurnishingsCheckboxes
            value={form.furnishings}
            onChange={(furnishings) => setForm((prev) => ({ ...prev, furnishings }))}
          />

          <div
            className={`grid grid-cols-1 gap-4 ${
              form.rentalType === "long" ? "sm:grid-cols-3" : "sm:grid-cols-2"
            }`}
          >
            <Input
              name="monthlyPrice"
              type="number"
              label="Canone mensile (€)"
              value={form.monthlyPrice}
              onChange={handleChange}
              error={fieldErrors.monthlyPrice}
            />
            <Input
              name="deposit"
              type="number"
              label="Deposito cauzionale (€)"
              value={form.deposit}
              onChange={handleChange}
            />
            {form.rentalType === "long" && (
              <Input
                name="availableFrom"
                type="date"
                label="Disponibile da"
                value={form.availableFrom}
                onChange={handleChange}
              />
            )}
          </div>

          {form.rentalType === "short" && (
            <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              Gli immobili a breve termine sono sempre disponibili, tranne nei periodi già
              prenotati e accettati dal proprietario.
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {geocodePrecision === "none" && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Non è stato possibile localizzare questo indirizzo sulla mappa. L'immobile è stato
              salvato comunque: riprova modificando indirizzo/città/CAP, oppure verrà posizionato
              manualmente in futuro.
            </p>
          )}
          {geocodePrecision === "via" && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Il civico esatto non è mappato: la posizione è approssimata alla via. Potrai
              posizionarla manualmente in futuro.
            </p>
          )}
          {geocodePrecision === "comune" && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Indirizzo non trovato: la posizione è approssimata al centro del comune. Potrai
              posizionarla manualmente in futuro.
            </p>
          )}

          <Button type="submit" variant="primary" loading={submitting} className="self-start">
            {isEdit ? "Salva modifiche" : "Crea immobile"}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <ImageUploader
            propertyId={id ? Number(id) : null}
            token={token}
            images={images}
            onImagesChange={setImages}
          />
        </div>

        {form.rentalType === "long" && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <SlotManager
              propertyId={id ? Number(id) : null}
              token={token}
              slots={slots}
              onSlotsChange={setSlots}
            />
          </div>
        )}
      </Card>

      <Modal
        open={showRentalTypeConfirm}
        title="Cambiare tipo di affitto?"
        confirmLabel="Continua"
        onConfirm={doSubmit}
        onCancel={() => setShowRentalTypeConfirm(false)}
      >
        Le fasce di visita già create resteranno salvate ma non saranno più mostrate finché
        l'immobile è impostato su "breve termine". Continuare?
      </Modal>
    </div>
  );
}

export default PropertyForm;
