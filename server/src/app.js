import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { apiLimiter } from "./middleware/rateLimit.js";
import zonesRouter from "./routes/zones.js";
import predictRouter from "./routes/predict.js";
import alertsRouter from "./routes/alerts.js";
import routeRouter from "./routes/route.js";
import simulateRouter from "./routes/simulate.js";
import chatRouter from "./routes/chat.js";


dotenv.config();
process.on("unhandledRejection", (reason) => {
  console.error("⚠️ Unhandled rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("⚠️ Uncaught exception:", err);
});

const app = express();

app.use(helmet());
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const ok =
        allowedOrigins.includes(origin) ||
        /^https:\/\/aegisai-[a-z0-9-]+-sai-ram-c-s-projects\.vercel\.app$/.test(origin);
      cb(null, ok);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use("/api", apiLimiter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "aegisai-server", time: new Date().toISOString() });
});

app.use("/api/zones", zonesRouter);
app.use("/api/predict", predictRouter);
app.use("/api/alerts", alertsRouter);
app.use("/api/route", routeRouter);
app.use("/api/simulate", simulateRouter);
app.use("/api/chat", chatRouter);

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🛡️  AegisAI server running on port ${PORT}`));

export default app;