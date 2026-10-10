import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { readFile } from "node:fs/promises";
import { Vehicle, AdminUser, GalleryItem } from "./models.js";
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
await mongoose.connect(MONGODB_URI);
try {
  const vehicles = JSON.parse(
    await readFile(
      new URL("../../shared/vehicles.json", import.meta.url),
      "utf8",
    ),
  );
  for (const v of vehicles) {
    await Vehicle.updateOne(
      { slug: v.slug },
      { $setOnInsert: v },
      { upsert: true },
    );
    for (const [index, media] of v.media.entries())
      await GalleryItem.updateOne(
        { id: `${v.slug}-${index}` },
        {
          $setOnInsert: { id: `${v.slug}-${index}`, vehicle: v.slug, ...media },
        },
        { upsert: true },
      );
  }
  await AdminUser.updateOne(
    { email: ADMIN_EMAIL.toLowerCase() },
    {
      $setOnInsert: {
        email: ADMIN_EMAIL.toLowerCase(),
        passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12),
        role: "admin",
      },
    },
    { upsert: true },
  );
  const editorial = JSON.parse(
    await readFile(
      new URL("../../shared/gallery.json", import.meta.url),
      "utf8",
    ),
  );
  for (const media of editorial)
    await GalleryItem.updateOne(
      { id: media.id },
      { $setOnInsert: media },
      { upsert: true },
    );
  console.log(
    "Fictional demo vehicles, gallery and initial administrator seeded. Existing records preserved.",
  );
} finally {
  await mongoose.disconnect();
}
