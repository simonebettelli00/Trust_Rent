import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import * as propertiesApi from "../../api/propertiesApi";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Skeleton from "../../components/Skeleton";
import Modal from "../../components/Modal";

function OwnerDashboard() {
  const { token } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [propertyToDelete, setPropertyToDelete] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const { properties } = await propertiesApi.getMine(token);
      setProperties(properties);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleTogglePublish(property) {
    try {
      await propertiesApi.setPublished(token, property.id, !property.is_published);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function confirmDelete() {
    if (!propertyToDelete) return;
    try {
      await propertiesApi.remove(token, propertyToDelete.id);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setPropertyToDelete(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 flex-1 w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">I tuoi immobili</h1>
        <Button as={Link} to="/owner/property/new" variant="primary">
          + Nuovo immobile
        </Button>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <div className="flex gap-2 mt-auto">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
              </div>
            </Card>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <Card className="text-center text-gray-500">
          Non hai ancora pubblicato nessun immobile.
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {properties.map((property) => (
            <Card key={property.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-gray-900">{property.title}</h2>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${
                    property.is_published
                      ? "bg-secondary-100 text-secondary-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {property.is_published ? "Pubblicato" : "Bozza"}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {property.address}, {property.city}
              </p>
              {(property.lat == null || property.lng == null) && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                  Posizione non trovata: riprova modificando l'indirizzo
                </p>
              )}
              {property.lat != null && property.geocode_precision === "via" && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                  Posizione approssimata alla via (civico non mappato)
                </p>
              )}
              {property.lat != null && property.geocode_precision === "comune" && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                  Posizione approssimata al centro del comune
                </p>
              )}
              <p className="text-sm text-gray-700 font-medium">
                € {Number(property.monthly_price).toLocaleString("it-IT")}/mese
              </p>
              <div className="flex flex-wrap gap-2 mt-auto">
                <Button as={Link} to={`/owner/property/${property.id}/edit`} variant="outline">
                  Modifica
                </Button>
                <Button variant="outline" onClick={() => handleTogglePublish(property)}>
                  {property.is_published ? "Nascondi" : "Pubblica"}
                </Button>
                <Button variant="outline" onClick={() => setPropertyToDelete(property)}>
                  Elimina
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(propertyToDelete)}
        title="Eliminare l'immobile?"
        confirmLabel="Elimina"
        variant="primary"
        onConfirm={confirmDelete}
        onCancel={() => setPropertyToDelete(null)}
      >
        Stai per eliminare "{propertyToDelete?.title}". L'operazione non è reversibile.
      </Modal>
    </div>
  );
}

export default OwnerDashboard;
