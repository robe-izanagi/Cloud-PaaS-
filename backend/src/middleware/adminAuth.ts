import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { loadEnv } from "../config/env.js";

declare global {
  namespace Express {
    interface Request {
      admin?: { role: "administrator" };
    }
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.admin_session;
  if (!token) return res.status(401).json({ error: "Administrator authentication required" });
  try {
    const payload = jwt.verify(token, loadEnv().jwtSecret);
    if (typeof payload === "object" && payload.role === "administrator") {
      req.admin = { role: "administrator" };
      return next();
    }
  } catch {}
  return res.status(401).json({ error: "Invalid or expired administrator session" });
}
