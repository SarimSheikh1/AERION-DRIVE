import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import MongoStore from "connect-mongo";
import request from "supertest";
import { randomBytes } from "node:crypto";
import { startTestMongo } from "../../scripts/mongo-test-runtime.mjs";
import { createApp } from "../src/app.js";
import { seedData } from "../src/seed-data.js";
import {
  Vehicle,
  AdminUser,
  ContactSubmission,
  TestDriveRequest,
  mongoRepository,
} from "../src/models.js";

test(
  "real MongoDB seed, enquiries, unique indexes and sessions survive an API restart",
  { timeout: 240000 },
  async () => {
    const mongo = await startTestMongo();
    const uri = mongo.getUri("aerion_test");
    const email = "mongo-test@aerion.example",
      password = randomBytes(24).toString("base64url"),
      secret = randomBytes(48).toString("hex");
    let store;
    try {
      await mongoose.connect(uri);
      const first = await seedData({ email, password });
      assert.deepEqual(first, { vehicles: 5, gallery: 7 });
      await Vehicle.updateOne(
        { slug: "aerion-a1" },
        { $set: { tagline: "Preserved custom tagline" } },
      );
      await seedData({ email, password: randomBytes(24).toString("hex") });
      assert.equal(await Vehicle.countDocuments(), 5);
      assert.equal(
        (await Vehicle.findOne({ slug: "aerion-a1" })).tagline,
        "Preserved custom tagline",
      );
      const admin = await AdminUser.findOne({ email });
      assert.equal(await bcrypt.compare(password, admin.passwordHash), true);
      await Promise.all([ContactSubmission.init(), TestDriveRequest.init()]);
      store = MongoStore.create({ mongoUrl: uri });
      let app = createApp({
        repository: mongoRepository,
        sessionStore: store,
        secret,
      });
      const login = await request(app)
        .post("/api/admin/login")
        .send({ email, password })
        .expect(200);
      const cookie = login.headers["set-cookie"][0].split(";")[0];
      await request(app)
        .post("/api/contact")
        .send({
          name: "Mongo Visitor",
          email: "visitor@aerion.example",
          department: "General",
          message: "Please share the original concept details.",
        })
        .expect(201);
      const booking = {
        name: "Mongo Driver",
        email: "driver@aerion.example",
        phone: "+92 300 1234567",
        vehicle: "aerion-a1",
        date: "2099-06-20",
        time: "14:30",
        location: "Virtual design studio",
        message: "",
      };
      await request(app).post("/api/test-drives").send(booking).expect(201);
      await request(app).post("/api/test-drives").send(booking).expect(409);
      const saved = await TestDriveRequest.findOne({
        email: booking.email,
      }).populate("vehicleRef");
      assert.equal(saved.vehicleRef.slug, "aerion-a1");
      assert.equal(saved.status, "new");
      assert.ok(saved.createdAt instanceof Date);
      const overview = await request(app)
        .get("/api/admin/overview")
        .set("Cookie", cookie)
        .expect(200);
      assert.equal(overview.body.newEnquiries, 2);
      await request(app)
        .patch("/api/admin/test-drives/" + saved._id)
        .set("Cookie", cookie)
        .send({ status: "reviewing" })
        .expect(200);
      await store.close();
      await mongoose.disconnect();
      await mongoose.connect(uri);
      store = MongoStore.create({ mongoUrl: uri });
      app = createApp({
        repository: mongoRepository,
        sessionStore: store,
        secret,
      });
      await request(app).get("/api/admin/me").set("Cookie", cookie).expect(200);
      assert.equal(await ContactSubmission.countDocuments(), 1);
      assert.equal(
        (await TestDriveRequest.findById(saved._id)).status,
        "reviewing",
      );
      await request(app)
        .post("/api/admin/logout")
        .set("Cookie", cookie)
        .expect(200);
      await request(app).get("/api/admin/me").set("Cookie", cookie).expect(401);
    } finally {
      if (store) await store.close();
      await mongoose.disconnect();
      await mongo.stop();
    }
  },
);
