import express from "express";
import helmet from "helmet";
import cors from "cors";
import session from "express-session";
import { rateLimit } from "express-rate-limit";
import bcrypt from "bcryptjs";
import { createHash, randomUUID } from "node:crypto";
import {
  vehicleSchema,
  mediaSchema,
  contactSchema,
  testDriveSchema,
  statusSchema,
} from "./validation.js";

export function createApp({
  repository,
  sessionStore,
  secret,
  origin = "http://localhost:5173",
  production = false,
  databaseAvailable = true,
}) {
  if (!secret || secret.length < 32)
    throw new Error("SESSION_SECRET must have at least 32 characters");
  const app = express();
  app.set("trust proxy", production ? 1 : false);
  app.use(
    helmet(),
    cors({ origin, credentials: true }),
    express.json({ limit: "32kb" }),
  );
  app.use((req, res, next) => {
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.headers.origin &&
      req.headers.origin !== origin
    )
      return res.status(403).json({ message: "Origin not allowed" });
    next();
  });
  app.use(
    session({
      name: "aerion.sid",
      secret,
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
      cookie: {
        httpOnly: true,
        secure: production,
        sameSite: "strict",
        maxAge: 8 * 60 * 60 * 1000,
      },
    }),
  );
  const limit = (max, windowMs = 15 * 60 * 1000) =>
    rateLimit({
      windowMs,
      limit: max,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { message: "Too many requests. Please try again later." },
    });
  app.use("/api", limit(300));
  const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success)
      return res.status(400).json({
        message: "Please check the submitted fields.",
        errors: result.error.flatten().fieldErrors,
      });
    req.validated = result.data;
    next();
  };
  const protect = (req, res, next) =>
    req.session.admin
      ? next()
      : res.status(401).json({ message: "Admin authentication required" });
  app.get("/api/health", async (_req, res) => {
    await repository.list("vehicles");
    res.status(databaseAvailable ? 200 : 503).json({
      status: databaseAvailable ? "ok" : "catalogue-only",
      databaseAvailable,
      message: databaseAvailable
        ? "Database connected"
        : "MongoDB unavailable. Enquiries cannot be saved.",
    });
  });
  app.get("/api/vehicles", async (_req, res) =>
    res.json({
      vehicles: await repository.list("vehicles", { published: true }),
    }),
  );
  app.get("/api/vehicles/:slug", async (req, res) => {
    const vehicle = await repository.find("vehicles", {
      slug: req.params.slug,
      published: true,
    });
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.json({ vehicle });
  });
  app.get("/api/gallery", async (_req, res) =>
    res.json({ items: await repository.list("gallery") }),
  );
  const submit = (collection) => async (req, res) => {
    let vehicle;
    if (collection === "testDrives") {
      vehicle = await repository.find("vehicles", {
        slug: req.validated.vehicle,
        published: true,
      });
      if (!vehicle)
        return res
          .status(400)
          .json({ message: "Please select an available vehicle." });
    }
    const fingerprint = createHash("sha256")
      .update(JSON.stringify(req.validated))
      .digest("hex");
    if (await repository.find(collection, { fingerprint }))
      return res
        .status(409)
        .json({ message: "This enquiry has already been received." });
    const item = await repository.create(collection, {
      ...req.validated,
      fingerprint,
      status: "new",
      ...(vehicle ? { vehicleRef: vehicle._id } : {}),
    });
    res.status(201).json({
      id: item._id,
      message:
        collection === "testDrives"
          ? "Your test-drive enquiry has been received. The requested date and time are not confirmed."
          : "Your enquiry has been received.",
    });
  };
  app.post(
    "/api/test-drives",
    limit(8),
    validate(testDriveSchema),
    submit("testDrives"),
  );
  app.post(
    "/api/contact",
    limit(8),
    validate(contactSchema),
    submit("contacts"),
  );
  app.post("/api/admin/login", limit(5), async (req, res) => {
    const { email, password } = req.body ?? {};
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      password.length > 200
    )
      return res.status(400).json({ message: "Email and password required" });
    const admin = await repository.find("admins", {
      email: email.trim().toLowerCase(),
    });
    const hash =
      admin?.passwordHash ??
      "$2b$12$C6UzMDM.H6dfI/f/IKcEe.2uP6pj4Zb9.k3T9XXJL3GvZdY1upN8W";
    const valid = await bcrypt.compare(password, hash);
    if (!admin || !valid)
      return res.status(401).json({ message: "Invalid credentials" });
    await new Promise((resolve, reject) =>
      req.session.regenerate((error) => (error ? reject(error) : resolve())),
    );
    req.session.admin = { email: admin.email, role: admin.role };
    await new Promise((resolve, reject) =>
      req.session.save((error) => (error ? reject(error) : resolve())),
    );
    res.json({ admin: req.session.admin });
  });
  app.get("/api/admin/me", protect, (req, res) =>
    res.json({ admin: req.session.admin }),
  );
  app.post("/api/admin/logout", protect, (req, res, next) =>
    req.session.destroy((error) => {
      if (error) return next(error);
      res.clearCookie("aerion.sid", {
        httpOnly: true,
        secure: production,
        sameSite: "strict",
      });
      res.json({ message: "Logged out" });
    }),
  );
  app.use("/api/admin", protect);
  app.get("/api/admin/overview", async (_req, res) => {
    const [vehicles, testDrives, contacts, gallery] = await Promise.all(
      ["vehicles", "testDrives", "contacts", "gallery"].map((c) =>
        repository.list(c),
      ),
    );
    res.json({
      vehicles: vehicles.length,
      testDrives: testDrives.length,
      contacts: contacts.length,
      gallery: gallery.length,
      newEnquiries: [...testDrives, ...contacts].filter(
        (i) => i.status === "new",
      ).length,
    });
  });
  for (const [route, collection, key] of [
    ["test-drives", "testDrives", "requests"],
    ["contacts", "contacts", "submissions"],
  ]) {
    app.get(`/api/admin/${route}`, async (_req, res) =>
      res.json({
        [key]: (await repository.list(collection)).map(
          ({ fingerprint, ...item }) => item,
        ),
      }),
    );
    app.patch(
      `/api/admin/${route}/:id`,
      validate(statusSchema),
      async (req, res) => {
        const item = await repository.update(
          collection,
          { _id: req.params.id },
          req.validated,
        );
        if (!item)
          return res.status(404).json({ message: "Enquiry not found" });
        res.json({ item });
      },
    );
  }
  app.get("/api/admin/vehicles", async (_req, res) =>
    res.json({ vehicles: await repository.list("vehicles") }),
  );
  app.post("/api/admin/vehicles", validate(vehicleSchema), async (req, res) =>
    res
      .status(201)
      .json({ vehicle: await repository.create("vehicles", req.validated) }),
  );
  app.patch(
    "/api/admin/vehicles/:slug",
    validate(vehicleSchema.partial()),
    async (req, res) => {
      const vehicle = await repository.update(
        "vehicles",
        { slug: req.params.slug },
        req.validated,
      );
      if (!vehicle)
        return res.status(404).json({ message: "Vehicle not found" });
      res.json({ vehicle });
    },
  );
  app.delete("/api/admin/vehicles/:slug", async (req, res) => {
    const item = await repository.remove("vehicles", { slug: req.params.slug });
    if (!item) return res.status(404).json({ message: "Vehicle not found" });
    res.json({ message: "Vehicle deleted" });
  });
  app.get("/api/admin/gallery", async (_req, res) =>
    res.json({ items: await repository.list("gallery") }),
  );
  app.post("/api/admin/gallery", validate(mediaSchema), async (req, res) =>
    res.status(201).json({
      item: await repository.create("gallery", {
        ...req.validated,
        id: randomUUID(),
      }),
    }),
  );
  app.patch(
    "/api/admin/gallery/:id",
    validate(mediaSchema.partial()),
    async (req, res) => {
      const item = await repository.update(
        "gallery",
        { id: req.params.id },
        req.validated,
      );
      if (!item) return res.status(404).json({ message: "Image not found" });
      res.json({ item });
    },
  );
  app.delete("/api/admin/gallery/:id", async (req, res) => {
    const item = await repository.remove("gallery", { id: req.params.id });
    if (!item) return res.status(404).json({ message: "Image not found" });
    res.json({ message: "Image deleted" });
  });
  app.use((_req, res) =>
    res.status(404).json({ message: "API route not found" }),
  );
  app.use((error, _req, res, _next) => {
    if (error.code === 11000)
      return res
        .status(409)
        .json({ message: "A matching record already exists." });
    if (error.name === "CastError" || error.type === "entity.parse.failed")
      return res.status(400).json({ message: "Invalid request." });
    if (error.type === "entity.too.large")
      return res.status(413).json({ message: "Request too large." });
    console.error("API error:", error.message);
    res.status(503).json({
      message:
        "The service is temporarily unavailable. Your submission has not been saved. Please try again later.",
    });
  });
  return app;
}
