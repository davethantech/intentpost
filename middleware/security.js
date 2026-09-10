const rateLimit = require("express-rate-limit");

const general = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_PER_MINUTE || 240),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "rate_limit_exceeded" }
});

const auth = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT || 20),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: { error: "authentication_rate_limit_exceeded" }
});

module.exports = { general, auth };
