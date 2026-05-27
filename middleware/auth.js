const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET || "fallback-secret";

/**
 * Middleware: verifies JWT from the Authorization header.
 * Attaches decoded user info to req.user.
 */
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;     // { id, email, role }
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Middleware: requires the user to be an admin.
 * Must be used AFTER the auth middleware.
 */
function adminOnly(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

module.exports = { auth, adminOnly };
