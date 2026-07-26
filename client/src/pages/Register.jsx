import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") === "owner" ? "owner" : "tenant";

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: initialRole,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await register(form);
      navigate(user.role === "owner" ? "/owner" : "/app");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16 bg-gray-50">
      <Card className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Crea il tuo account</h1>
        <p className="text-sm text-gray-500 mb-6">Trova casa o pubblica il tuo immobile</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, role: "tenant" }))}
              className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                form.role === "tenant"
                  ? "border-primary-600 bg-primary-50 text-primary-700"
                  : "border-gray-300 text-gray-600"
              }`}
            >
              Affittuario
            </button>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, role: "owner" }))}
              className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                form.role === "owner"
                  ? "border-secondary-600 bg-secondary-50 text-secondary-700"
                  : "border-gray-300 text-gray-600"
              }`}
            >
              Proprietario
            </button>
          </div>

          <Input
            type="text"
            name="fullName"
            label="Nome completo"
            placeholder="Mario Rossi"
            value={form.fullName}
            onChange={handleChange}
            required
          />
          <Input
            type="email"
            name="email"
            label="Email"
            placeholder="mario.rossi@email.it"
            value={form.email}
            onChange={handleChange}
            required
          />
          <Input
            type="tel"
            name="phone"
            label="Telefono"
            placeholder="333 1234567"
            value={form.phone}
            onChange={handleChange}
          />
          <Input
            type="password"
            name="password"
            label="Password"
            placeholder="Almeno 8 caratteri"
            value={form.password}
            onChange={handleChange}
            required
          />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" loading={submitting} className="w-full">
            Registrati
          </Button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-6">
          Hai già un account?{" "}
          <Link to="/login" className="text-primary-700 font-medium hover:underline">
            Accedi
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default Register;
