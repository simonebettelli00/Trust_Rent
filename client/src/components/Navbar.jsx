import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useConversations } from "../context/ConversationsContext";
import { useNotifications } from "../context/NotificationsContext";
import Button from "./Button";

function Navbar() {
  const { user, logout } = useAuth();
  const { totalUnread } = useConversations();
  const { totalUnread: totalUnreadNotifications } = useNotifications();
  const navigate = useNavigate();
  const areaPath = user?.role === "owner" ? "/owner" : "/app";
  const requestsPath = user?.role === "owner" ? "/owner/requests" : "/app/requests";

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
            <Link
              to={requestsPath}
              className="relative text-sm font-medium text-gray-700 hover:text-primary-700"
            >
              Richieste
              {totalUnreadNotifications > 0 && (
                <span className="absolute -top-2 -right-3 bg-secondary-600 text-white text-[10px] rounded-full px-1.5 py-0.5">
                  {totalUnreadNotifications}
                </span>
              )}
            </Link>
            <Link to="/messages" className="relative text-sm font-medium text-gray-700 hover:text-primary-700">
              Messaggi
              {totalUnread > 0 && (
                <span className="absolute -top-2 -right-3 bg-primary-700 text-white text-[10px] rounded-full px-1.5 py-0.5">
                  {totalUnread}
                </span>
              )}
            </Link>
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
