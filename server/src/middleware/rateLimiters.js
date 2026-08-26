import rateLimit from "express-rate-limit";

// Store in memoria: adeguato per una singola istanza del server.
// In caso di deploy multi-istanza servirebbe uno store condiviso (es. Redis).
function rateLimitedResponse(req, res) {
  res.status(429).json({
    error: {
      code: "RATE_LIMITED",
      message: "Troppi tentativi, riprova tra qualche minuto",
    },
  });
}

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitedResponse,
});

// Ricerca immobili su mappa (Fase 5): parte ad ogni moveend, serve una soglia
// più permissiva del limite globale così il debounce lato client resta fluido.
export const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitedResponse,
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: rateLimitedResponse,
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitedResponse,
});
