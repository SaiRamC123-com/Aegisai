import { Router } from "express";
import { z } from "zod";
import { verifyToken } from "../middleware/verifyToken.js";
import { validate } from "../middleware/validate.js";
import { getZoneWithRisk } from "../services/riskEngine.js";

const router = Router();

const schema = z.object({
  zoneId: z.string().min(1),
  rain1h: z.number().min(0).max(300).optional(),
  temp: z.number().min(-10).max(55).optional(),
  humidity: z.number().min(0).max(100).optional(),
});

router.post("/", verifyToken, validate(schema), async (req, res, next) => {
  try {
    const { zoneId, ...overrides } = req.body;

    const baseline = await getZoneWithRisk(zoneId);
    if (!baseline) return res.status(404).json({ error: "Zone not found" });

    const scenario = await getZoneWithRisk(zoneId, overrides);

    // Rainfall sweep for the what-if chart
    const steps = [0, 20, 40, 60, 80, 100];
    const sweep = await Promise.all(
      steps.map(async (rain1h) => {
        const r = await getZoneWithRisk(zoneId, { ...overrides, rain1h });
        return { rain1h, score: r.score, level: r.level };
      })
    );

    res.json({
      baseline,
      scenario,
      scoreDelta: scenario.score - baseline.score,
      levelChanged: scenario.level !== baseline.level,
      sweep,
    });
  } catch (err) {
    next(err);
  }
});

export default router;