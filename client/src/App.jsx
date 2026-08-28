import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import PageLoader from "./components/PageLoader";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Pagine pesanti (Leaflet, react-day-picker, socket.io) caricate on-demand
// per tenere il bundle iniziale leggero: vedi FASE 13 nel playbook.
const TenantApp = lazy(() => import("./pages/TenantApp"));
const PropertyDetail = lazy(() => import("./pages/PropertyDetail"));
const OwnerDashboard = lazy(() => import("./pages/owner/OwnerDashboard"));
const PropertyForm = lazy(() => import("./pages/owner/PropertyForm"));
const OwnerRequests = lazy(() => import("./pages/owner/OwnerRequests"));
const TenantRequests = lazy(() => import("./pages/TenantRequests"));
const Messages = lazy(() => import("./pages/Messages"));

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
    </div>
  );
}

export default App;
