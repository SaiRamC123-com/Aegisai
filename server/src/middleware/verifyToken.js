import { auth } from "../config/firebaseAdmin.js";

export const verifyToken = async (req, res, next) => {
  if (process.env.DEV_BYPASS_AUTH === "true") {
    req.user = { uid: "dev-user", email: "dev@aegisai.local", role: "admin" };
    return next();
  }

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      role: decoded.role || "user",
    };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin")
    return res.status(403).json({ error: "Admin access required" });
  next();
};