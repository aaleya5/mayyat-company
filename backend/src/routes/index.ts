/**
 * src/routes/index.ts
 * Mounts all route handlers under /api
 */

import { Express, Router } from "express";
import { authRouter } from "./auth.js";
import { recordsRouter } from "./records.js";
import { statsRouter } from "./stats.js";

export function mountRoutes(app: Express) {
  const apiRouter = Router();
  apiRouter.use("/auth", authRouter);
  apiRouter.use("/records", recordsRouter);
  apiRouter.use("/stats", statsRouter);
  app.use("/api", apiRouter);
}
