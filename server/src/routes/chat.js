import { Router } from "express";
import { z } from "zod";
import { verifyToken } from "../middleware/verifyToken.js";
import { chatLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import { getZonesWithRisk, getZoneWithRisk } from "../services/riskEngine.js";
import { chatWithAegis, explainZone } from "../services/groqService.js";

const router = Router();
router.use(verifyToken, chatLimiter);

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(1000),
      })
    )
    .min(1)
    .max(20),
});

router.post("/", validate(chatSchema), async (req, res, next) => {
  try {
    const zones = await getZonesWithRisk();
    res.json(await chatWithAegis(req.body.messages, zones));
  } catch (err) {
    next(err);
  }
});

const explainSchema = z.object({ zoneId: z.string().min(1) });

router.post("/explain", validate(explainSchema), async (req, res, next) => {
  try {
    const result = await getZoneWithRisk(req.body.zoneId);
    if (!result) return res.status(404).json({ error: "Zone not found" });
    res.json(await explainZone(result));
  } catch (err) {
    next(err);
  }
});

export default router;