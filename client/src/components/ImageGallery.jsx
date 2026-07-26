import { useState } from "react";
import { resolveImageUrl } from "../api/propertiesApi";

function ImageGallery({ images }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  if (!images.length) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
        Nessuna immagine disponibile
      </div>
    );
  }

  function showPrev() {
    setLightboxIndex((i) => (i - 1 + images.length) % images.length);
  }

  function showNext() {
    setLightboxIndex((i) => (i + 1) % images.length);
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setLightboxIndex(index)}
            className={`overflow-hidden rounded-xl ${index === 0 ? "col-span-2 row-span-2" : ""}`}
          >
            <img
              src={resolveImageUrl(image.url)}
              alt=""
              className="w-full h-full object-cover hover:opacity-90 transition-opacity"
              style={{ aspectRatio: index === 0 ? "4 / 3" : "1 / 1" }}
            />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 bg-black/80 z-[2000] flex items-center justify-center px-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 text-white text-2xl"
          >
            ✕
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              showPrev();
            }}
            className="absolute left-4 text-white text-3xl px-2"
          >
            ‹
          </button>

          <img
            src={resolveImageUrl(images[lightboxIndex].url)}
            alt=""
            className="max-h-[85vh] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              showNext();
            }}
            className="absolute right-4 text-white text-3xl px-2"
          >
            ›
          </button>
        </div>
      )}
    </>
  );
}

export default ImageGallery;
