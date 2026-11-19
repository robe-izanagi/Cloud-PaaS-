import mysql, { Pool } from "mysql2/promise";
import fs from "node:fs";
import { loadEnv } from "../config/env.js";

export function createPool() {
  const env = loadEnv();
  const ssl = env.tidbEnableSsl
    ? {
        minVersion: "TLSv1.2",
        rejectUnauthorized: true,
        ...(env.tidbCaPath ? { ca: fs.readFileSync(env.tidbCaPath, "utf8") } : {})
      }
    : undefined;
  return mysql.createPool({
    host: env.tidbHost,
    port: env.tidbPort,
    user: env.tidbUser,
    password: env.tidbPassword,
    database: env.tidbDatabase,
    ssl,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true
  });
}
