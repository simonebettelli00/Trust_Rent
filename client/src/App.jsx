import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TenantApp from "./pages/TenantApp";
import PropertyDetail from "./pages/PropertyDetail";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import PropertyForm from "./pages/owner/PropertyForm";
import OwnerRequests from "./pages/owner/OwnerRequests";
import TenantRequests from "./pages/TenantRequests";
import Messages from "./pages/Messages";

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app"
          element={
            <ProtectedRoute role="tenant">
              <TenantApp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/requests"
          element={
            <ProtectedRoute role="tenant">
              <TenantRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner"
          element={
            <ProtectedRoute role="owner">
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/requests"
          element={
            <ProtectedRoute role="owner">
              <OwnerRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/property/new"
          element={
            <ProtectedRoute role="owner">
              <PropertyForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/property/:id/edit"
          element={
            <ProtectedRoute role="owner">
              <PropertyForm />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
