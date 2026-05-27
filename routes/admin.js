const express = require("express");
const { auth, adminOnly } = require("../middleware/auth");

const router = express.Router();

// All admin routes require auth + admin role
router.use(auth, adminOnly);

// GET /api/admin/users — list all users
router.get("/users", (req, res) => {
  const db = req.app.locals.db;
  const users = db.prepare(
    "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC"
  ).all();
  res.json(users);
});

// PUT /api/admin/users/:id — update a user's name, email, or role
router.put("/users/:id", (req, res) => {
  const db = req.app.locals.db;
  const { name, email, role } = req.body;

  const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "User not found" });

  db.prepare("UPDATE users SET name=?, email=?, role=? WHERE id=?")
    .run(name || existing.name, email || existing.email, role || existing.role, req.params.id);

  // Log activity
  db.prepare(
    "INSERT INTO user_activities (user_id, action, details) VALUES (?, 'admin_update_user', ?)"
  ).run(req.user.id, `Updated user "${name || existing.name}"`);

  const updated = db.prepare("SELECT id, name, email, role, created_at FROM users WHERE id = ?").get(req.params.id);
  res.json(updated);
});

// DELETE /api/admin/users/:id — delete a user and their data
router.delete("/users/:id", (req, res) => {
  const db = req.app.locals.db;

  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ error: "Cannot delete your own account" });
  }

  const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "User not found" });

  // Cascading delete handled by foreign keys, but let's be explicit
  db.prepare("DELETE FROM expenses WHERE user_id = ?").run(req.params.id);
  db.prepare("DELETE FROM user_activities WHERE user_id = ?").run(req.params.id);
  db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);

  // Log activity
  db.prepare(
    "INSERT INTO user_activities (user_id, action, details) VALUES (?, 'admin_delete_user', ?)"
  ).run(req.user.id, `Deleted user "${existing.name}"`);

  res.json({ message: "User deleted" });
});

// GET /api/admin/activities — view activity log for all users
router.get("/activities", (req, res) => {
  const db = req.app.locals.db;
  const activities = db.prepare(`
    SELECT a.*, u.name AS user_name
    FROM user_activities a
    LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.created_at DESC
    LIMIT 100
  `).all();
  res.json(activities);
});

module.exports = router;
