const VARIANTS = {
  primary: "bg-primary-700 text-white hover:bg-primary-800",
  secondary: "bg-secondary-600 text-white hover:bg-secondary-700",
  outline: "border border-gray-300 text-gray-800 hover:bg-gray-50",
};

function Button({
  as: Component = "button",
  variant = "primary",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}) {
  return (
    <Component
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "Attendere..." : children}
    </Component>
  );
}

export default Button;
