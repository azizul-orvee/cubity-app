import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const commands = {
  generate: ["generate"],
  migrate: ["migrate", "deploy"],
  push: ["db", "push"],
  studio: ["studio"],
};

const pooled =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL;
const direct =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  pooled;

if (pooled && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = pooled;
}
if (direct) {
  process.env.DIRECT_URL = direct;
  if (!process.env.DATABASE_URL_UNPOOLED) {
    process.env.DATABASE_URL_UNPOOLED = direct;
  }
}

const command = process.argv[2];
const args = commands[command];
if (!args) {
  console.error(`Unknown prisma-env command: ${command}`);
  process.exit(1);
}

const prismaBin = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "node_modules",
  ".bin",
  "prisma",
);

const result = spawnSync(prismaBin, args, {
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
