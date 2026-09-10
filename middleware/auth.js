const jwt = require("jsonwebtoken");

function secret() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error("JWT_SECRET is not configured securely");
  return process.env.JWT_SECRET;
}

function signAccess(user) {
  return jwt.sign(
    { sub: user.id, organization_id: user.organization_id, email: user.email, role: user.role, name: user.name },
    secret(),
    { expiresIn: process.env.ACCESS_TTL || "15m", issuer: process.env.JWT_ISSUER || "intentpost", audience: process.env.JWT_AUDIENCE || "intentpost-api" }
  );
}

function requireAuth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "authentication_required" });
  try {
    req.user = jwt.verify(token, secret(), { issuer: process.env.JWT_ISSUER || "intentpost", audience: process.env.JWT_AUDIENCE || "intentpost-api" });
    req.user.id = req.user.sub;
    next();
  } catch (e) { return res.status(401).json({ error: "invalid_or_expired_token" }); }
}

module.exports = { signAccess, requireAuth };
