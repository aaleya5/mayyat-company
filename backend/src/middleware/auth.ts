/**
 * src/middleware/auth.ts
 *
 * Verifies the JWT from the Authorization header and attaches
 * the decoded user to req.user. Routes that need authentication
 * use this middleware.
 *
 * Why manual JWT and not a library like passport?
 *   Passport is great but adds abstraction on top of something
 *   simple enough to understand directly. Doing it manually teaches
 *   you the token lifecycle — you'll use this knowledge everywhere.
 */

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { AuthUser } from "@mayyat/shared";

// Extend Express's Request type to include our user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET!;

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed token" });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = payload;
    next();
  } catch (err: any) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}