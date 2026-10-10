import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import bcrypt from "bcryptjs";
import { readFile } from "node:fs/promises";
import { createApp } from "../src/app.js";
// In-memory repository is test-only. The running server always uses MongoDB.
const rows = {
  vehicles: [{ slug: "aerion-a1", published: true }],
  admins: [
    {
      email: "admin@example.test",
      passwordHash: await bcrypt.hash("a-test-password", 12),
      role: "admin",
    },
  ],
  contacts: [],
  testDrives: [],
  gallery: [],
};
const matches = (row, filter) =>
  Object.entries(filter).every(([k, v]) => row[k] === v);
const repository = {
  list: async (c, f = {}) => rows[c].filter((r) => matches(r, f)),
  find: async (c, f) => rows[c].find((r) => matches(r, f)),
  create: async (c, data) => {
    const item = { ...data, _id: String(rows[c].length + 1) };
    rows[c].push(item);
    return item;
  },
  update: async (c, f, data) => {
    const item = rows[c].find((r) => matches(r, f));
    if (item) Object.assign(item, data);
    return item;
  },
  remove: async (c, f) => {
    const i = rows[c].findIndex((r) => matches(r, f));
    return i < 0 ? null : rows[c].splice(i, 1)[0];
  },
};
const app = createApp({
  repository,
  secret: "test-secret-that-is-at-least-thirty-two-characters",
});
test("published vehicles and nonexistent vehicle", async () => {
  const response = await request(app).get("/api/vehicles").expect(200);
  assert.equal(response.body.vehicles.length, 1);
  await request(app).get("/api/vehicles/missing").expect(404);
});
test("contact validation, persistence and duplicate prevention", async () => {
  await request(app).post("/api/contact").send({ name: "A" }).expect(400);
  const payload = {
    name: "Test Person",
    email: "visitor@example.test",
    department: "General",
    message: "Please send concept details.",
  };
  await request(app).post("/api/contact").send(payload).expect(201);
  assert.equal(rows.contacts.length, 1);
  await request(app).post("/api/contact").send(payload).expect(409);
});
test("test-drive requests remain enquiries and validate vehicle/date", async () => {
  const payload = {
    name: "Demo Driver",
    email: "driver@example.test",
    phone: "+92 300 1234567",
    vehicle: "aerion-a1",
    date: "2099-01-20",
    time: "14:30",
    location: "Virtual demo",
    message: "",
  };
  const response = await request(app)
    .post("/api/test-drives")
    .send(payload)
    .expect(201);
  assert.match(response.body.message, /not confirmed/);
  await request(app)
    .post("/api/test-drives")
    .send({ ...payload, vehicle: "missing" })
    .expect(400);
  await request(app)
    .post("/api/test-drives")
    .send({ ...payload, date: "2099-02-30" })
    .expect(400);
});
test("private admin session, status update and logout", async () => {
  await request(app).get("/api/admin/overview").expect(401);
  const agent = request.agent(app);
  await agent
    .post("/api/admin/login")
    .send({ email: "admin@example.test", password: "wrong" })
    .expect(401);
  const login = await agent
    .post("/api/admin/login")
    .send({ email: "admin@example.test", password: "a-test-password" })
    .expect(200);
  assert.match(login.headers["set-cookie"][0], /HttpOnly/);
  assert.match(login.headers["set-cookie"][0], /SameSite=Strict/);
  await agent.get("/api/admin/me").expect(200);
  await agent
    .patch("/api/admin/test-drives/1")
    .send({ status: "contacted" })
    .expect(200);
  assert.equal(rows.testDrives[0].status, "contacted");
  await agent
    .patch("/api/admin/test-drives/1")
    .send({ status: "confirmed" })
    .expect(400);
  await agent.post("/api/admin/logout").expect(200);
  await agent.get("/api/admin/me").expect(401);
});
test("cross-origin writes are rejected", async () => {
  await request(app)
    .post("/api/contact")
    .set("Origin", "https://evil.example")
    .send({})
    .expect(403);
});
test("database outage returns honest error without a success response", async () => {
  const offline = createApp({
    repository: {
      ...repository,
      create: async () => {
        throw new Error("Database offline");
      },
    },
    secret: "test-secret-that-is-at-least-thirty-two-characters",
  });
  const response = await request(offline)
    .post("/api/contact")
    .send({
      name: "Test Person",
      email: "different@example.test",
      department: "General",
      message: "Please send details about design.",
    })
    .expect(503);
  assert.match(response.body.message, /has not been saved/);
});
test("administrator can manage vehicle specifications and gallery records", async () => {
  const agent = request.agent(app);
  await agent
    .post("/api/admin/login")
    .send({ email: "admin@example.test", password: "a-test-password" })
    .expect(200);
  const data = JSON.parse(
    await readFile(
      new URL("../../shared/vehicles.json", import.meta.url),
      "utf8",
    ),
  );
  await agent
    .post("/api/admin/vehicles")
    .send({ ...data[1], slug: "test-concept", id: "test-concept" })
    .expect(201);
  await agent
    .patch("/api/admin/vehicles/test-concept")
    .send({ power: 123, published: false })
    .expect(200);
  await request(app).get("/api/vehicles/test-concept").expect(404);
  await agent.delete("/api/admin/vehicles/test-concept").expect(200);
  const created = await agent
    .post("/api/admin/gallery")
    .send({
      url: "/images/a1.svg",
      alt: "Original concept",
      category: "Studio",
    })
    .expect(201);
  await agent
    .patch("/api/admin/gallery/" + created.body.item.id)
    .send({ alt: "Updated original concept" })
    .expect(200);
  await agent.delete("/api/admin/gallery/" + created.body.item.id).expect(200);
  await agent
    .post("/api/admin/gallery")
    .send({ url: "javascript:alert(1)", alt: "Bad link", category: "Studio" })
    .expect(400);
});
test("login throttling prevents repeated credential attempts", async () => {
  const limited = createApp({
    repository,
    secret: "test-secret-that-is-at-least-thirty-two-characters",
  });
  for (let i = 0; i < 5; i++)
    await request(limited)
      .post("/api/admin/login")
      .send({ email: "missing@example.test", password: "incorrect" })
      .expect(401);
  await request(limited)
    .post("/api/admin/login")
    .send({ email: "missing@example.test", password: "incorrect" })
    .expect(429);
});
