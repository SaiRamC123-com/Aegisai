import { Router } from "express";
import { z } from "zod";
import { verifyToken } from "../middleware/verifyToken.js";
import { validate } from "../middleware/validate.js";
import { findSafeRoutes } from "../services/routeService.js";

const router = Router();

const point = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
const schema = z.object({ from: point, to: point });

router.post("/", verifyToken, validate(schema), async (req, res, next) => {
  try {
    const { from, to } = req.body;
    res.json(await findSafeRoutes(from, to));
  } catch (err) {
    next(err);
  }
});

export default router;