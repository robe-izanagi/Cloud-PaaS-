import express, { type NextFunction, type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { loadEnv } from "./config/env.js";
import { createPool } from "./database/pool.js";
import { ArticleRepository } from "./database/repository.js";
import { createRevisionSchema } from "./validators/document.js";
import { requireAdmin } from "./middleware/adminAuth.js";

export function createApp() {
  const env = loadEnv();
  const pool = createPool();
  const repository = new ArticleRepository(pool);
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet({ contentSecurityPolicy: env.nodeEnv === "production" ? undefined : false }));
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());

  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", env.clientOrigin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const origin = req.headers.origin;
      if (origin && origin !== env.clientOrigin) {
        return res.status(403).json({ error: "Forbidden origin" });
      }
    }
    next();
  });

  app.get("/api/article", async (_req, res, next) => {
    try {
      const revision = await repository.getArticle();
      res.json({
        article: { id: revision.articleId, title: "Cloud & PaaS Reflection", currentRevisionId: revision.id },
        currentRevision: revision,
        lastEditor: revision.editorName,
        lastUpdated: revision.createdAt,
        version: revision.version
      });
    } catch (error) { next(error); }
  });

  app.get("/api/article/revisions", async (_req, res, next) => {
    try { res.json({ revisions: await repository.getRevisions() }); }
    catch (error) { next(error); }
  });

  app.get("/api/article/revisions/:revisionId", async (req, res, next) => {
    try {
      const id = Number(req.params.revisionId);
      if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid revision ID" });
      const revision = await repository.getRevision(id);
      if (!revision) return res.status(404).json({ error: "Revision not found" });
      res.json({ revision });
    } catch (error) { next(error); }
  });

  app.post("/api/article/revisions", async (req, res, next) => {
    try {
      const parsed = createRevisionSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid revision data", details: parsed.error.flatten() });
      const result = await repository.createRevision(parsed.data.editorName, parsed.data.content, parsed.data.expectedCurrentVersion);
      if (result.conflict) return res.status(409).json({ error: "This document has been updated by another user. Please reload the latest version before saving your changes." });
      res.status(201).json({ revision: result.revision });
    } catch (error) { next(error); }
  });

  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
  app.post("/api/admin/unlock", authLimiter, (req, res) => {
    const code = typeof req.body?.accessCode === "string" ? req.body.accessCode : "";
    const supplied = Buffer.from(code);
    const expected = Buffer.from(env.adminAccessCode);
    const authorized = supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
    if (!authorized) return res.status(401).json({ error: "Invalid administrator access code" });
    const token = jwt.sign({ role: "administrator" }, env.jwtSecret, { expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"] });
    res.cookie("admin_session", token, {
      httpOnly: true,
      secure: env.nodeEnv === "production",
      sameSite: env.nodeEnv === "production" ? "strict" : "lax",
      maxAge: 30 * 60 * 1000,
      path: "/"
    });
    res.json({ authenticated: true });
  });

  app.get("/api/admin/session", requireAdmin, (_req, res) => res.json({ authenticated: true }));
  app.post("/api/admin/logout", requireAdmin, (_req, res) => {
    res.clearCookie("admin_session", { httpOnly: true, secure: env.nodeEnv === "production", sameSite: env.nodeEnv === "production" ? "strict" : "lax", path: "/" });
    res.json({ authenticated: false });
  });

  app.post("/api/admin/revisions/:revisionId/restore", requireAdmin, async (req, res, next) => {
    try {
      const id = Number(req.params.revisionId);
      if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid revision ID" });
      const revision = await repository.restoreRevision(id, false);
      if (!revision) return res.status(404).json({ error: "Revision not found" });
      res.status(201).json({ revision });
    } catch (error) { next(error); }
  });

  app.post("/api/admin/restore-default", requireAdmin, async (_req, res, next) => {
    try {
      const revision = await repository.restoreRevision(null, true);
      res.status(201).json({ revision });
    } catch (error) { next(error); }
  });

  const frontendDist = path.resolve(process.cwd(), "frontend/dist");
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get("*", (_req, res) => res.sendFile(path.join(frontendDist, "index.html")));
  }

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  });

  return { app, pool, repository };
}
