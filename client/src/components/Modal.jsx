import { useEffect } from "react";
import Button from "./Button";

function Modal({
  open,
  title,
  children,
  confirmLabel = "Conferma",
  cancelLabel = "Annulla",
  onConfirm,
  onCancel,
  variant = "primary",
}) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center px-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-lg max-w-sm w-full p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
        <div className="text-sm text-gray-600">{children}</div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Modal;
