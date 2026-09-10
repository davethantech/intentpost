const router = require("express").Router();
const auth = require("../services/authService");
const { auth: authRateLimit } = require("../middleware/security");

router.post("/register", authRateLimit, async (req, res) => {
  try { res.status(201).json(await auth.register(req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.post("/login", authRateLimit, async (req, res) => {
  try { res.json(await auth.login(req.body.email, req.body.password)); }
  catch (e) { res.status(401).json({ error: "invalid credentials" }); }
});

module.exports = router;
