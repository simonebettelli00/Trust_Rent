import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "./Button";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const areaPath = user?.role === "owner" ? "/owner" : "/app";

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <nav className="border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-primary-700">
          Trust Rent
        </Link>

        {user ? (
          <div className="flex items-center gap-3">
            <Button as={Link} to={areaPath} variant="outline" className="hidden sm:inline-flex">
              Vai alla tua area
            </Button>
            <Button variant="primary" onClick={handleLogout}>
              Esci
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button as={Link} to="/login" variant="outline">
              Login
            </Button>
            <Button as={Link} to="/register" variant="primary">
              Registrati
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
