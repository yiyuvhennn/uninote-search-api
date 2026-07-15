import rateLimit from "express-rate-limit";

function getPositiveNumberFromEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);

  if (Number.isFinite(value) && value > 0) {
    return value;
  }

  return fallback;
}

const isTest = process.env.NODE_ENV === "test";

const apiWindowMs = getPositiveNumberFromEnv(
  "API_RATE_LIMIT_WINDOW_MS",
  15 * 60 * 1000
);
const apiMax = getPositiveNumberFromEnv(
  "API_RATE_LIMIT_MAX",
  isTest ? 10000 : 300
);
const authWindowMs = getPositiveNumberFromEnv(
  "AUTH_RATE_LIMIT_WINDOW_MS",
  15 * 60 * 1000
);
const authMax = getPositiveNumberFromEnv(
  "AUTH_RATE_LIMIT_MAX",
  isTest ? 10000 : 20
);

export const apiRateLimiter = rateLimit({
  windowMs: apiWindowMs,
  limit: apiMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests, please try again later",
  },
});

export const authRateLimiter = rateLimit({
  windowMs: authWindowMs,
  limit: authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many auth attempts, please try again later",
  },
});
