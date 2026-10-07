import { Router } from "express";
import { z } from "zod";
import { verifyToken } from "../middleware/verifyToken.js";
import { validate } from "../middleware/validate.js";
import { getZoneWithRisk } from "../services/riskEngine.js";

const router = Router();

const schema = z.object({
  zoneId: z.string().min(1),
  overrides: z
    .object({
      rain1h: z.number().min(0).max(300).optional(),
      temp: z.number().min(-10).max(55).optional(),
      humidity: z.number().min(0).max(100).optional(),
      windSpeed: z.number().min(0).max(150).optional(),
    })
    .optional(),
});

router.post("/", verifyToken, validate(schema), async (req, res, next) => {
  try {
    const { zoneId, overrides } = req.body;
    const result = await getZoneWithRisk(zoneId, overrides);
    if (!result) return res.status(404).json({ error: "Zone not found" });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;