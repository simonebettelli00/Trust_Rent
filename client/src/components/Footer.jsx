function Footer() {
  return (
    <footer className="border-t border-gray-200 py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
        <span className="font-semibold text-gray-700">Trust Rent</span>
        <p>&copy; {new Date().getFullYear()} Trust Rent. Tutti i diritti riservati.</p>
      </div>
    </footer>
  );
}

export default Footer;
