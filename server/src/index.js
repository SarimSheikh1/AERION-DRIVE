import "dotenv/config";
import mongoose from "mongoose";
import MongoStore from "connect-mongo";
import { createApp } from "./app.js";
import { mongoRepository } from "./models.js";
import { readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
const { MONGODB_URI, SESSION_SECRET, NODE_ENV, CLIENT_ORIGIN } = process.env;
const production = NODE_ENV === "production";
if (production && (!MONGODB_URI || !SESSION_SECRET))
  throw new Error("Production requires MONGODB_URI and SESSION_SECRET.");
let connected = false;
if (MONGODB_URI) {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    connected = true;
  } catch (error) {
    if (production) throw error;
    console.warn(
      "MongoDB unavailable: read-only fictional catalogue mode. Enquiries and admin are unavailable.",
    );
  }
}
const vehicles = JSON.parse(
  await readFile(
    new URL("../../shared/vehicles.json", import.meta.url),
    "utf8",
  ),
);
const unavailable = async () => {
  throw new Error("MongoDB is not configured or available");
};
const editorialGallery = JSON.parse(
  await readFile(new URL("../../shared/gallery.json", import.meta.url), "utf8"),
);
// Only public catalogue reads work in local development without MongoDB.
const demoRepository = {
  list: async (collection, filter = {}) => {
    if (collection === "vehicles")
      return vehicles.filter((v) =>
        Object.entries(filter).every(([key, value]) => v[key] === value),
      );
    if (collection === "gallery")
      return [
        ...vehicles.flatMap((v) =>
          v.media.map((m, i) => ({
            ...m,
            id: `${v.slug}-${i}`,
            vehicle: v.slug,
          })),
        ),
        ...editorialGallery,
      ];
    return unavailable();
  },
  find: async (collection, filter) =>
    collection === "vehicles"
      ? vehicles.find((v) =>
          Object.entries(filter).every(([key, value]) => v[key] === value),
        )
      : unavailable(),
  create: unavailable,
  update: unavailable,
  remove: unavailable,
};
const app = createApp({
  repository: connected ? mongoRepository : demoRepository,
  secret: SESSION_SECRET || randomBytes(32).toString("hex"),
  origin: CLIENT_ORIGIN || "http://localhost:5173",
  production,
  databaseAvailable: connected,
  sessionStore: connected
    ? MongoStore.create({ mongoUrl: MONGODB_URI, ttl: 28800 })
    : undefined,
});
const server = app.listen(Number(process.env.PORT || 4000), () =>
  console.log("AERION API listening on port", process.env.PORT || 4000),
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () =>
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    }),
  );
