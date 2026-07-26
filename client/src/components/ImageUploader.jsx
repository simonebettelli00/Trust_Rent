import { useState } from "react";
import * as propertiesApi from "../api/propertiesApi";
import Button from "./Button";

function ImageUploader({ propertyId, token, images, onImagesChange }) {
  const [pendingFiles, setPendingFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function handleSelectFiles(e) {
    setPendingFiles(Array.from(e.target.files));
  }

  async function handleUpload() {
    if (!pendingFiles.length) return;
    setError("");
    setUploading(true);
    try {
      const { images: uploaded } = await propertiesApi.uploadImages(token, propertyId, pendingFiles);
      onImagesChange([...images, ...uploaded]);
      setPendingFiles([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(imageId) {
    setError("");
    try {
      await propertiesApi.deleteImage(token, propertyId, imageId);
      onImagesChange(images.filter((img) => img.id !== imageId));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleMove(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const reordered = [...images];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    const order = reordered.map((img, i) => ({ id: img.id, sort_order: i }));
    setError("");
    try {
      const { images: updated } = await propertiesApi.reorderImages(token, propertyId, order);
      onImagesChange(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!propertyId) {
    return (
      <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
        Salva prima l'immobile per poter caricare le immagini.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-gray-700">Immagini</span>

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((image, index) => (
            <div key={image.id} className="relative group border rounded-lg overflow-hidden">
              <img
                src={propertiesApi.resolveImageUrl(image.url)}
                alt=""
                className="w-full h-28 object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-black/60 flex items-center justify-between px-1 py-1">
                <button
                  type="button"
                  onClick={() => handleMove(index, -1)}
                  disabled={index === 0}
                  className="text-white text-xs disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(index, 1)}
                  disabled={index === images.length - 1}
                  className="text-white text-xs disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(image.id)}
                  className="text-white text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <input type="file" accept="image/*" multiple onChange={handleSelectFiles} className="text-sm" />

      {pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pendingFiles.map((file) => (
            <img
              key={file.name}
              src={URL.createObjectURL(file)}
              alt=""
              className="w-16 h-16 object-cover rounded border"
            />
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        type="button"
        variant="outline"
        loading={uploading}
        disabled={!pendingFiles.length}
        onClick={handleUpload}
        className="self-start"
      >
        Carica immagini selezionate
      </Button>
    </div>
  );
}

export default ImageUploader;
