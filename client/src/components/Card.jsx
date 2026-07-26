function Card({ className = "", children, ...props }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export default Card;
