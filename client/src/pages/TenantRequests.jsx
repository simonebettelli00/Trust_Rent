import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationsContext";
import * as appointmentsApi from "../api/appointmentsApi";
import * as bookingsApi from "../api/bookingsApi";
import Card from "../components/Card";
import Skeleton from "../components/Skeleton";

const STATUS_LABELS = { pending: "In attesa", accepted: "Accettata", declined: "Rifiutata" };
const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-secondary-100 text-secondary-700",
  declined: "bg-gray-100 text-gray-500",
};

function StatusBadge({ status }) {
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function TenantRequests() {
  const { token } = useAuth();
  const { notifications } = useNotifications();
  const [appointments, setAppointments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const [appointmentsRes, bookingsRes] = await Promise.all([
        appointmentsApi.listMine(token),
        bookingsApi.listMine(token),
      ]);
      setAppointments(appointmentsRes.appointments);
      setBookings(bookingsRes.bookings);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (notifications.length > 0) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications.length]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 flex-1 w-full flex flex-col gap-10">
      <h1 className="text-2xl font-bold text-gray-900">Le mie richieste</h1>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Visite richieste</h2>
        {loading ? (
          <Skeleton className="h-20 w-full" />
        ) : appointments.length === 0 ? (
          <Card className="text-center text-gray-500">
            Non hai ancora richiesto nessuna visita.
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {appointments.map((a) => (
              <Card key={a.id} className="flex items-center justify-between gap-3">
                <div>
                  <Link to={`/property/${a.property_id}`} className="font-medium text-primary-700 hover:underline">
                    {a.property_title}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {new Date(a.requested_date).toLocaleDateString("it-IT")} ·{" "}
                    {a.start_time.slice(0, 5)}–{a.end_time.slice(0, 5)} · proprietario:{" "}
                    {a.counterpart_name}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Prenotazioni richieste</h2>
        {loading ? (
          <Skeleton className="h-20 w-full" />
        ) : bookings.length === 0 ? (
          <Card className="text-center text-gray-500">
            Non hai ancora richiesto nessuna prenotazione.
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {bookings.map((b) => (
              <Card key={b.id} className="flex items-center justify-between gap-3">
                <div>
                  <Link to={`/property/${b.property_id}`} className="font-medium text-primary-700 hover:underline">
                    {b.property_title}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {new Date(b.check_in).toLocaleDateString("it-IT")} →{" "}
                    {new Date(b.check_out).toLocaleDateString("it-IT")} · proprietario:{" "}
                    {b.counterpart_name}
                  </p>
                </div>
                <StatusBadge status={b.status} />
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default TenantRequests;
