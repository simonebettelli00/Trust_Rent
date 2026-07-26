import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import Card from "../components/Card";
import Footer from "../components/Footer";

const STEPS = [
  {
    title: "Cerca sulla mappa",
    description: "Esplora gli annunci vicino a te con la ricerca interattiva su mappa.",
  },
  {
    title: "Contatta il proprietario",
    description: "Scrivi in chat e chiedi tutte le informazioni che ti servono.",
  },
  {
    title: "Fissa un appuntamento",
    description: "Prenota una visita nei giorni disponibili e trova casa in sicurezza.",
  },
];

const TENANT_BENEFITS = [
  "Ricerca immobili su mappa interattiva, senza perdite di tempo",
  "Messaggistica diretta con i proprietari, in tempo reale",
  "Richiesta appuntamenti online, senza telefonate",
];

const OWNER_BENEFITS = [
  "Pubblica i tuoi immobili in pochi minuti",
  "Gestisci calendario disponibilità e richieste di visita",
  "Rispondi ai messaggi dei potenziali affittuari da un'unica dashboard",
];

function Home() {
  const { user } = useAuth();
  const areaPath = user?.role === "owner" ? "/owner" : "/app";

  return (
    <div className="flex flex-col flex-1">
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary-50 to-white px-6 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-6">
          <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 leading-tight">
            Trova casa, in tutta fiducia.
          </h1>
          <p className="text-lg text-gray-600 max-w-xl">
            Trust Rent mette in contatto affittuari e proprietari con una mappa
            interattiva, chat integrata e appuntamenti senza pensieri.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            {user ? (
              <Button as={Link} to={areaPath} variant="primary" className="px-6 py-3 text-base">
                Vai alla tua area
              </Button>
            ) : (
              <>
                <Button as={Link} to="/register" variant="primary" className="px-6 py-3 text-base">
                  Inizia ora
                </Button>
                <Button as={Link} to="/login" variant="outline" className="px-6 py-3 text-base">
                  Accedi
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Come funziona */}
      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-10">
            Come funziona in 3 passi
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {STEPS.map((step, index) => (
              <Card key={step.title} className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary-700 text-white flex items-center justify-center font-semibold mx-auto mb-4">
                  {index + 1}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Vantaggi tenant / owner */}
      <section className="px-6 py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="flex flex-col gap-4 border-primary-100">
            <h3 className="text-xl font-semibold text-primary-700">Per chi cerca casa</h3>
            <ul className="flex flex-col gap-2 text-sm text-gray-600">
              {TENANT_BENEFITS.map((benefit) => (
                <li key={benefit} className="flex gap-2">
                  <span className="text-primary-600">✓</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
            <Button as={Link} to="/register?role=tenant" variant="primary" className="mt-auto">
              Registrati come affittuario
            </Button>
          </Card>

          <Card className="flex flex-col gap-4 border-secondary-100">
            <h3 className="text-xl font-semibold text-secondary-700">Per i proprietari</h3>
            <ul className="flex flex-col gap-2 text-sm text-gray-600">
              {OWNER_BENEFITS.map((benefit) => (
                <li key={benefit} className="flex gap-2">
                  <span className="text-secondary-600">✓</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
            <Button as={Link} to="/register?role=owner" variant="secondary" className="mt-auto">
              Registrati come proprietario
            </Button>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Home;
