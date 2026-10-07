import { Router } from "express";
import { verifyToken, requireAdmin } from "../middleware/verifyToken.js";
import { getZonesWithRisk } from "../services/riskEngine.js";
import { listAlerts, scanAndCreateAlerts, acknowledgeAlert } from "../services/alertEngine.js";

const router = Router();
router.use(verifyToken);

router.get("/", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  res.json({ alerts: listAlerts({ level: req.query.level, limit }) });
});

router.post("/scan", requireAdmin, async (req, res, next) => {
  try {
    const zones = await getZonesWithRisk();
    const created = scanAndCreateAlerts(zones);
    res.json({ scanned: zones.length, created });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/ack", (req, res) => {
  const alert = acknowledgeAlert(req.params.id, req.user.uid);
  if (!alert) return res.status(404).json({ error: "Alert not found" });
  res.json(alert);
});

export default router;