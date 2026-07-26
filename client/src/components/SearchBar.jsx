import { useState } from "react";
import * as geocodeApi from "../api/geocodeApi";
import Input from "./Input";
import Button from "./Button";

function SearchBar({ onLocate, filters, onFiltersChange }) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setError("");
    setSearching(true);
    try {
      const location = await geocodeApi.geocode(query);
      onLocate({ lat: location.lat, lng: location.lng, zoom: 14, key: Date.now() });
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }

  function handleLocateMe() {
    if (!navigator.geolocation) {
      setError("Geolocalizzazione non supportata da questo browser");
      return;
    }
    setError("");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocate({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          zoom: 14,
          key: Date.now(),
        });
        setLocating(false);
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Permesso di geolocalizzazione negato"
            : "Impossibile ottenere la posizione"
        );
        setLocating(false);
      }
    );
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex flex-col gap-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            type="text"
            placeholder="Cerca un indirizzo o una città..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Button type="submit" variant="primary" loading={searching}>
            Cerca
          </Button>
        </form>
        <Button type="button" variant="outline" loading={locating} onClick={handleLocateMe}>
          📍 Usa la mia posizione
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <Input
          type="number"
          label="Prezzo massimo (€)"
          placeholder="Nessun limite"
          value={filters.maxPrice}
          onChange={(e) => onFiltersChange({ ...filters, maxPrice: e.target.value })}
          className="w-40"
        />
        <Input
          type="number"
          label="Stanze minime"
          placeholder="Qualsiasi"
          value={filters.rooms}
          onChange={(e) => onFiltersChange({ ...filters, rooms: e.target.value })}
          className="w-32"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default SearchBar;
