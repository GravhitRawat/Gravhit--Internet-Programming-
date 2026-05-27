const express = require("express");
const { auth } = require("../middleware/auth");

const router = express.Router();

// All expense routes require authentication
router.use(auth);

// GET /api/expenses — list user's expenses (with optional category filter and search)
router.get("/", (req, res) => {
  const db = req.app.locals.db;
  let sql = "SELECT * FROM expenses WHERE user_id = ?";
  const params = [req.user.id];

  if (req.query.category) {
    sql += " AND category = ?";
    params.push(req.query.category);
  }

  if (req.query.search) {
    sql += " AND (title LIKE ? OR description LIKE ? OR category LIKE ?)";
    const term = `%${req.query.search}%`;
    params.push(term, term, term);
  }

  sql += " ORDER BY date DESC";
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

// GET /api/expenses/summary — category totals and monthly totals
router.get("/summary", (req, res) => {
  const db = req.app.locals.db;

  const byCategory = db.prepare(`
    SELECT category AS name, SUM(amount) AS value, COUNT(*) AS count
    FROM expenses WHERE user_id = ?
    GROUP BY category ORDER BY value DESC
  `).all(req.user.id);

  const monthly = db.prepare(`
    SELECT strftime('%Y', date) AS year, strftime('%m', date) AS month, SUM(amount) AS amount
    FROM expenses WHERE user_id = ?
    GROUP BY year, month ORDER BY year, month
  `).all(req.user.id).slice(-6);

  const totalRow = db.prepare(
    "SELECT SUM(amount) AS total FROM expenses WHERE user_id = ?"
  ).get(req.user.id);

  res.json({
    byCategory,
    monthly: monthly.map(m => ({ ...m, name: m.month, year: m.year })),
    total: totalRow.total || 0,
  });
});

// POST /api/expenses — create a new expense
router.post("/", (req, res) => {
  const db = req.app.locals.db;
  const { title, category, amount, date, description } = req.body;

  if (!title || !category || !amount || !date) {
    return res.status(400).json({ error: "Title, category, amount, and date are required" });
  }
  if (Number(amount) <= 0) {
    return res.status(400).json({ error: "Amount must be greater than 0" });
  }

  const result = db.prepare(
    "INSERT INTO expenses (user_id, title, category, amount, date, description) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(req.user.id, title, category, Number(amount), date, description || "");

  // Log activity
  db.prepare(
    "INSERT INTO user_activities (user_id, action, details) VALUES (?, 'create_expense', ?)"
  ).run(req.user.id, `Added "${title}"`);

  const expense = db.prepare("SELECT * FROM expenses WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(expense);
});

// PUT /api/expenses/:id — update an expense
router.put("/:id", (req, res) => {
  const db = req.app.locals.db;
  const { title, category, amount, date, description } = req.body;

  // Check ownership
  const existing = db.prepare("SELECT * FROM expenses WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: "Expense not found" });

  db.prepare(`
    UPDATE expenses SET title=?, category=?, amount=?, date=?, description=?, updated_at=datetime('now')
    WHERE id=? AND user_id=?
  `).run(title, category, Number(amount), date, description || "", req.params.id, req.user.id);

  // Log activity
  db.prepare(
    "INSERT INTO user_activities (user_id, action, details) VALUES (?, 'update_expense', ?)"
  ).run(req.user.id, `Edited "${title}"`);

  const updated = db.prepare("SELECT * FROM expenses WHERE id = ?").get(req.params.id);
  res.json(updated);
});

// DELETE /api/expenses/:id — delete an expense
router.delete("/:id", (req, res) => {
  const db = req.app.locals.db;

  const existing = db.prepare("SELECT * FROM expenses WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: "Expense not found" });

  db.prepare("DELETE FROM expenses WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);

  // Log activity
  db.prepare(
    "INSERT INTO user_activities (user_id, action, details) VALUES (?, 'delete_expense', ?)"
  ).run(req.user.id, `Deleted "${existing.title}"`);

  res.json({ message: "Expense deleted" });
});

module.exports = router;
