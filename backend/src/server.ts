import { createApp } from "./app.js";
import { loadEnv } from "./config/env.js";

async function start() {
  try {
    const env = loadEnv();
    const { app, pool, repository } = createApp();
    await pool.query("SELECT 1");
    await repository.initialize();
    app.listen(env.port, () => console.log(`Cloud & PaaS Reflection server listening on port ${env.port}`));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown startup error";
    console.error(`Configuration/database startup failed: ${message}`);
    process.exit(1);
  }
}

void start();
