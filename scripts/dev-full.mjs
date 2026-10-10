import { MongoMemoryServer } from "mongodb-memory-server-core";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { seedData } from "../server/src/seed-data.js";
import { binary } from "./mongo-test-runtime.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const local = join(root, ".local");
const credentialsPath = join(local, "admin-credentials.json");
await mkdir(join(local, "database"), { recursive: true });
let credentials;
try {
  credentials = JSON.parse(await readFile(credentialsPath, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  credentials = {
    email: "local-admin@aerion.example",
    password: randomBytes(24).toString("base64url"),
    mongoPassword: randomBytes(32).toString("hex"),
    sessionSecret: randomBytes(48).toString("hex"),
  };
  await writeFile(credentialsPath, JSON.stringify(credentials, null, 2), {
    mode: 0o600,
    flag: "wx",
  });
}
const children = [];
let mongo;
let stopping = false;
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  await mongoose.disconnect();
  if (mongo) await mongo.stop({ doCleanup: false });
  process.exit(code);
}
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => void stop());
try {
  mongo = await MongoMemoryServer.create({
    binary,
    instance: {
      dbName: "aerion_local",
      ip: "127.0.0.1",
      dbPath: join(local, "database"),
    },
    auth: {
      enable: true,
      customRootName: "aerion-local-root",
      customRootPwd: credentials.mongoPassword,
    },
  });
  const uri = new URL(mongo.getUri("aerion_local"));
  uri.username = "aerion-local-root";
  uri.password = credentials.mongoPassword;
  uri.searchParams.set("authSource", "admin");
  await mongoose.connect(uri.href);
  await seedData(credentials);
  await mongoose.disconnect();
  const run = (args, cwd, env = {}) => {
    const child = spawn(process.execPath, args, {
      cwd,
      stdio: "inherit",
      env: { ...process.env, ...env },
    });
    children.push(child);
    child.on("error", (error) => {
      console.error(error.message);
      void stop(1);
    });
    child.on("exit", (code) => {
      if (!stopping) void stop(code || 0);
    });
  };
  run(["src/index.js"], join(root, "server"), {
    NODE_ENV: "development",
    MONGODB_URI: uri.href,
    SESSION_SECRET: credentials.sessionSecret,
    CLIENT_ORIGIN: "http://localhost:5173",
    PORT: "4000",
  });
  const require = createRequire(import.meta.url);
  const vite = join(
    dirname(require.resolve("vite/package.json")),
    "bin",
    "vite.js",
  );
  run(
    [vite, "--host", "127.0.0.1", "--port", "5173", "--strictPort"],
    join(root, "client"),
  );
  console.log(
    "Full local studio: http://localhost:5173 | Admin: http://localhost:5173/admin",
  );
  console.log(`Local login credentials: ${credentialsPath}`);
  console.log("Database and login persist in .local/. Press Ctrl+C to stop.");
} catch (error) {
  console.error("Local studio startup failed:", error.message);
  await stop(1);
}
