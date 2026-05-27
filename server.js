require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const Database = require("better-sqlite3");

const authRoutes    = require("./routes/auth");
const expenseRoutes = require("./routes/expenses");
const adminRoutes   = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to SQLite database
const db = new Database(path.join(__dirname, "spendwise.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Make db accessible in routes via req.app.locals.db
app.locals.db = db;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// API routes
app.use("/api/auth",     authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/admin",    adminRoutes);

// Serve the SPA for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Graceful shutdown
process.on("SIGINT", () => { db.close(); process.exit(); });

app.listen(PORT, () => {
  console.log(`SpendWise running at http://localhost:${PORT}`);
});
