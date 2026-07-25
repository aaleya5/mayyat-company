/**
 * src/middleware/requireRole.ts
 *
 * Role-based access control guard. Always used after `authenticate`.
 *
 * Usage in a route file:
 *   router.delete("/:id", authenticate, requireRole("ADMIN"), handler);
 */

import type { Request, Response, NextFunction } from "express";
import type { Role } from "@mayyat/shared";

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}
