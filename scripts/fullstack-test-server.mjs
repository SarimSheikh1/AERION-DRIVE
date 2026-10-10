import { mkdir, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import MongoStore from "connect-mongo";
import { startTestMongo } from "./mongo-test-runtime.mjs";
import { seedData } from "../server/src/seed-data.js";
import { createApp } from "../server/src/app.js";
import {
  mongoRepository,
  ContactSubmission,
  TestDriveRequest,
} from "../server/src/models.js";

const mongo = await startTestMongo();
const uri = mongo.getUri("aerion_browser_test");
const credentials = {
  email: "browser-admin@aerion.example",
  password: randomBytes(24).toString("base64url"),
};
await mongoose.connect(uri);
await seedData(credentials);
await Promise.all([ContactSubmission.init(), TestDriveRequest.init()]);
const local = new URL("../.local/", import.meta.url);
await mkdir(local, { recursive: true });
await writeFile(new URL("e2e-admin.json", local), JSON.stringify(credentials), {
  mode: 0o600,
});
const store = MongoStore.create({ mongoUrl: uri });
const app = createApp({
  repository: mongoRepository,
  sessionStore: store,
  secret: randomBytes(48).toString("hex"),
  origin: "http://localhost:5175",
});
const server = app.listen(4005, "127.0.0.1", () =>
  console.log("Isolated MongoDB browser-test API ready on port 4005"),
);
let stopping = false;
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    if (stopping) return;
    stopping = true;
    server.close(async () => {
      await store.close();
      await mongoose.disconnect();
      await mongo.stop();
      process.exit(0);
    });
  });
