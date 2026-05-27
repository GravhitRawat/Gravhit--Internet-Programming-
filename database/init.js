/**
 * Initialise the SQLite database: create tables and seed sample data.
 * Run once with:  npm run init-db
 */
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");

const DB_PATH = path.join(__dirname, "..", "spendwise.db");
const SCHEMA_PATH = path.join(__dirname, "schema.sql");

// Remove old DB if it exists (fresh start)
if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create tables
const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
db.exec(schema);
console.log("Tables created.");

// Seed users (passwords are hashed)
const insertUser = db.prepare(
  "INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?)"
);

const users = [
  { name: "Admin User",  email: "admin@test.com", password: "admin123", role: "admin", date: "2025-01-10 08:00:00" },
  { name: "Jane Smith",  email: "jane@test.com",  password: "jane123",  role: "user",  date: "2025-02-15 10:00:00" },
  { name: "Tom Wilson",  email: "tom@test.com",   password: "tom123",   role: "user",  date: "2025-03-01 14:00:00" },
];

for (const u of users) {
  const hash = bcrypt.hashSync(u.password, 10);
  insertUser.run(u.name, u.email, hash, u.role, u.date);
}
console.log("Users seeded. (admin@test.com / admin123, jane@test.com / jane123, tom@test.com / tom123)");

// Seed expenses
const insertExp = db.prepare(
  "INSERT INTO expenses (user_id, title, category, amount, date, description) VALUES (?, ?, ?, ?, ?, ?)"
);

const expenses = [
  [2, "Grocery shopping",  "Food & Dining",      68.5,   "2025-04-01", "Weekly groceries from Woolworths"],
  [2, "Bus pass",          "Transport",           45,     "2025-04-02", "Monthly Opal card top-up"],
  [2, "Netflix",           "Entertainment",       16.99,  "2025-04-03", "Monthly streaming"],
  [2, "Electricity bill",  "Bills & Utilities",   120,    "2025-03-28", "March quarter"],
  [2, "Running shoes",     "Shopping",            139.95, "2025-03-20", "Nike Pegasus 41"],
  [2, "Dentist visit",     "Health",              95,     "2025-03-15", "Regular check-up"],
  [2, "Udemy course",      "Education",           29.99,  "2025-03-10", "Web development"],
  [2, "Weekend fuel",      "Travel",              55,     "2025-02-22", "Blue Mountains trip"],
  [2, "Phone bill",        "Bills & Utilities",   49,     "2025-02-15", "Monthly plan"],
  [2, "Coffee catch-up",   "Food & Dining",       12.8,   "2025-01-20", "Brunch with friends"],
  [3, "Lunch takeaway",    "Food & Dining",       18.5,   "2025-03-18", "Thai food"],
  [3, "Gym membership",    "Health",              59.99,  "2025-02-05", "Monthly fee"],
];

for (const e of expenses) insertExp.run(...e);
console.log(`${expenses.length} expenses seeded.`);

// Seed a few activities
const insertAct = db.prepare(
  "INSERT INTO user_activities (user_id, action, details, created_at) VALUES (?, ?, ?, ?)"
);

const acts = [
  [1, "login",          "Admin logged in",           "2025-04-01 08:00:00"],
  [2, "login",          "Jane logged in",            "2025-04-03 09:15:00"],
  [2, "create_expense", 'Added "Netflix"',           "2025-04-03 09:18:00"],
  [3, "login",          "Tom logged in",             "2025-04-02 14:30:00"],
  [3, "create_expense", 'Added "Lunch takeaway"',    "2025-04-02 14:35:00"],
];

for (const a of acts) insertAct.run(...a);
console.log("Activity log seeded.");

db.close();
console.log("\nDone! Database saved to spendwise.db");
