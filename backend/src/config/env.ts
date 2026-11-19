import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

const localEnv = path.resolve(process.cwd(), ".env");
const rootEnv = path.resolve(process.cwd(), "..", ".env");
dotenv.config({ path: fs.existsSync(localEnv) ? localEnv : rootEnv });

export function loadEnv() {
  const required = ["TIDB_HOST", "TIDB_USER", "TIDB_PASSWORD", "TIDB_DATABASE", "ADMIN_ACCESS_CODE", "JWT_SECRET"];
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}. Configure the project root .env file.`);
  }
  return {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT || 5000),
    tidbHost: process.env.TIDB_HOST!,
    tidbPort: Number(process.env.TIDB_PORT || 4000),
    tidbUser: process.env.TIDB_USER!,
    tidbPassword: process.env.TIDB_PASSWORD!,
    tidbDatabase: process.env.TIDB_DATABASE!,
    tidbEnableSsl: process.env.TIDB_ENABLE_SSL !== "false",
    tidbCaPath: process.env.TIDB_CA_PATH?.trim() || undefined,
    adminAccessCode: process.env.ADMIN_ACCESS_CODE!,
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "30m",
    clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173"
  };
}
