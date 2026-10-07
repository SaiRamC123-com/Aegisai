import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { getZonesWithRisk, getZoneWithRisk } from "../services/riskEngine.js";
import { scanAndCreateAlerts } from "../services/alertEngine.js";

const router = Router();
router.use(verifyToken);

router.get("/", async (req, res, next) => {
  try {
    const zones = await getZonesWithRisk();
    scanAndCreateAlerts(zones); // alerts appear automatically as the dashboard polls
    res.json({ count: zones.length, zones });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const zone = await getZoneWithRisk(req.params.id);
    if (!zone) return res.status(404).json({ error: "Zone not found" });
    res.json(zone);
  } catch (err) {
    next(err);
  }
});

export default router;