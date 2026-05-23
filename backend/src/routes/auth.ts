/**
 * src/routes/auth.ts
 * Authentication endpoints:
 *   POST /api/auth/login     - email + password → JWT
 *   GET  /api/auth/me        - returns current logged-in user
 */

import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import { z } from "zod";
import type { LoginInput, LoginResponse, AuthUser } from "@mayyat/shared";
import { authenticate } from "../middleware/auth.js";
import { prisma } from "../lib/db.js";

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET!;

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * POST /api/auth/login
 * Login with email + password, get JWT token
 */
authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const passwordMatch = await bcryptjs.compare(body.password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      } as AuthUser,
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("[LOGIN] ✓ Token created for user:", user.email);
    console.log("[LOGIN] JWT_SECRET used:", JWT_SECRET?.substring(0, 10) + "...");

    const response: LoginResponse = {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };

    res.json(response);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid email or password format" });
    }
    console.error("[auth] login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

/**
 * GET /api/auth/me
 * Returns the authenticated user's info
 */
authRouter.get("/me", authenticate, (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  res.json({ user: req.user });
});