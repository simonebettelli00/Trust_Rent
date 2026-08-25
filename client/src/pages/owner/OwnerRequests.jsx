import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationsContext";
import * as appointmentsApi from "../../api/appointmentsApi";
import * as bookingsApi from "../../api/bookingsApi";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Skeleton from "../../components/Skeleton";

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

function OwnerRequests() {
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

  async function respondAppointment(id, status) {
    try {
      await appointmentsApi.respond(token, id, status);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function respondBooking(id, status) {
    try {
      await bookingsApi.respond(token, id, status);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 flex-1 w-full flex flex-col gap-10">
      <h1 className="text-2xl font-bold text-gray-900">Richieste</h1>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Richieste di visita</h2>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : appointments.length === 0 ? (
          <Card className="text-center text-gray-500">Nessuna richiesta di visita.</Card>
        ) : (
          <div className="flex flex-col gap-3">
            {appointments.map((a) => (
              <Card key={a.id} className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div>
                  <p className="font-medium text-gray-900">{a.property_title}</p>
                  <p className="text-sm text-gray-500">
                    {a.counterpart_name} ·{" "}
                    {new Date(a.requested_date).toLocaleDateString("it-IT")} ·{" "}
                    {a.start_time.slice(0, 5)}–{a.end_time.slice(0, 5)}
                  </p>
                  {a.note && <p className="text-sm text-gray-400 mt-1">"{a.note}"</p>}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={a.status} />
                  {a.status === "pending" && (
                    <>
                      <Button variant="primary" onClick={() => respondAppointment(a.id, "accepted")}>
                        Accetta
                      </Button>
                      <Button variant="outline" onClick={() => respondAppointment(a.id, "declined")}>
                        Rifiuta
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Richieste di prenotazione</h2>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : bookings.length === 0 ? (
          <Card className="text-center text-gray-500">Nessuna richiesta di prenotazione.</Card>
        ) : (
          <div className="flex flex-col gap-3">
            {bookings.map((b) => (
              <Card key={b.id} className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div>
                  <p className="font-medium text-gray-900">{b.property_title}</p>
                  <p className="text-sm text-gray-500">
                    {b.counterpart_name} ·{" "}
                    {new Date(b.check_in).toLocaleDateString("it-IT")} →{" "}
                    {new Date(b.check_out).toLocaleDateString("it-IT")}
                  </p>
                  {b.note && <p className="text-sm text-gray-400 mt-1">"{b.note}"</p>}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={b.status} />
                  {b.status === "pending" && (
                    <>
                      <Button variant="primary" onClick={() => respondBooking(b.id, "accepted")}>
                        Accetta
                      </Button>
                      <Button variant="outline" onClick={() => respondBooking(b.id, "declined")}>
                        Rifiuta
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default OwnerRequests;
