import { MongoMemoryServer } from "mongodb-memory-server-core";
import { fileURLToPath } from "node:url";
export const binary = {
  downloadDir: fileURLToPath(
    new URL("../.local/mongodb-binaries", import.meta.url),
  ),
};
// This launches a real mongod executable. The isolated temporary database is not a JS mock.
export const startTestMongo = () =>
  MongoMemoryServer.create({
    binary,
    instance: { dbName: "aerion_test", ip: "127.0.0.1" },
  });
