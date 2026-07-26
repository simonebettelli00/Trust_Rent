function Input({ label, error, className = "", ...props }) {
  return (
    <label className="flex flex-col gap-1 text-left">
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
      <input
        className={`border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
          error ? "border-red-400" : "border-gray-300"
        } ${className}`}
        {...props}
      />
      {error && <span className="text-sm text-red-600">{error}</span>}
    </label>
  );
}

export default Input;
