import { useCallback, useRef, useState } from "react";
import * as propertiesApi from "../api/propertiesApi";
import PropertyMap from "../components/PropertyMap";
import PropertyCard from "../components/PropertyCard";
import SearchBar from "../components/SearchBar";
import Skeleton from "../components/Skeleton";
import Card from "../components/Card";

function TenantApp() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [highlightedId, setHighlightedId] = useState(null);
  const [flyTo, setFlyTo] = useState(null);
  const [filters, setFilters] = useState({ maxPrice: "", rooms: "" });

  const abortRef = useRef(null);
  const lastBoundsRef = useRef(null);

  const fetchProperties = useCallback(async (bounds, currentFilters) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");
    try {
      const { properties } = await propertiesApi.search(bounds, currentFilters, controller.signal);
      setProperties(properties);
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Errore di rete durante la ricerca");
    } finally {
      if (abortRef.current === controller) {
        setLoading(false);
      }
    }
  }, []);

  function handleBoundsChange(bounds) {
    lastBoundsRef.current = bounds;
    fetchProperties(bounds, filters);
  }

  function handleFiltersChange(nextFilters) {
    setFilters(nextFilters);
    if (lastBoundsRef.current) {
      fetchProperties(lastBoundsRef.current, nextFilters);
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <SearchBar onLocate={setFlyTo} filters={filters} onFiltersChange={handleFiltersChange} />

      <div className="relative h-[55vh] min-h-[320px]">
        <PropertyMap
          properties={properties}
          highlightedId={highlightedId}
          onMarkerHover={setHighlightedId}
          onMarkerLeave={() => setHighlightedId(null)}
          onMarkerClick={setHighlightedId}
          onBoundsChange={handleBoundsChange}
          flyTo={flyTo}
        />
        {loading && (
          <div className="absolute top-3 right-3 bg-white shadow px-3 py-1.5 rounded-full text-xs text-gray-600 z-[1000]">
            Aggiornamento risultati...
          </div>
        )}
      </div>

      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        {!error && properties.length === 0 && !loading && (
          <p className="text-gray-500 text-center py-10">
            Nessun immobile trovato in quest'area. Prova a spostare la mappa o a modificare i filtri.
          </p>
        )}

        {loading && properties.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="flex gap-3">
                <Skeleton className="w-24 h-24 shrink-0 rounded-lg" />
                <div className="flex flex-col gap-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-4 w-1/4 mt-auto" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                highlighted={property.id === highlightedId}
                onHover={() => setHighlightedId(property.id)}
                onLeave={() => setHighlightedId(null)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TenantApp;
