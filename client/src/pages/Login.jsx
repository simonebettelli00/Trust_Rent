import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login({ email, password });
      navigate(user.role === "owner" ? "/owner" : "/app");
    } catch (err) {
      setError(
        err.status === 429 ? "Troppi tentativi, riprova tra qualche minuto" : err.message
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16 bg-gray-50">
      <Card className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Bentornato</h1>
        <p className="text-sm text-gray-500 mb-6">Accedi al tuo account Trust Rent</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="email"
            label="Email"
            placeholder="mario.rossi@email.it"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" loading={submitting} className="w-full">
            Accedi
          </Button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-6">
          Non hai un account?{" "}
          <Link to="/register" className="text-primary-700 font-medium hover:underline">
            Registrati
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default Login;
