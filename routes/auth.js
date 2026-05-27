const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { auth } = require("../middleware/auth");

const router = express.Router();
const SECRET = process.env.JWT_SECRET || "fallback-secret";

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    SECRET,
    { expiresIn: "24h" }
  );
}

// POST /api/auth/register
router.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  const db = req.app.locals.db;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: "Password must be at least 4 characters" });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')"
  ).run(name, email, hash);

  const user = { id: result.lastInsertRowid, email, role: "user" };

  // Log activity
  db.prepare(
    "INSERT INTO user_activities (user_id, action, details) VALUES (?, 'register', ?)"
  ).run(user.id, `${name} created account`);

  res.status(201).json({
    token: createToken(user),
    user: { id: user.id, name, email, role: "user" },
  });
});

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const db = req.app.locals.db;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  // Log activity
  db.prepare(
    "INSERT INTO user_activities (user_id, action, details) VALUES (?, 'login', ?)"
  ).run(user.id, `${user.name} logged in`);

  res.json({
    token: createToken(user),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// GET /api/auth/me — get current user info from token
router.get("/me", auth, (req, res) => {
  const db = req.app.locals.db;
  const user = db.prepare("SELECT id, name, email, role, created_at FROM users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

module.exports = router;
