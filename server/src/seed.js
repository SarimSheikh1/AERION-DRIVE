import "dotenv/config";
import mongoose from "mongoose";
import { seedData } from "./seed-data.js";
const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (
  !MONGODB_URI ||
  !ADMIN_EMAIL ||
  !ADMIN_PASSWORD ||
  ADMIN_PASSWORD.length < 12
)
  throw new Error(
    "Set MONGODB_URI, ADMIN_EMAIL and a 12+ character ADMIN_PASSWORD before seeding.",
  );
await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
try {
  await seedData({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  console.log(
    "Fictional demo vehicles, gallery and initial administrator seeded. Existing records preserved.",
  );
} finally {
  await mongoose.disconnect();
}
