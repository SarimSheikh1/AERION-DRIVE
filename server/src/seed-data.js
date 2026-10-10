import bcrypt from "bcryptjs";
import { readFile } from "node:fs/promises";
import { Vehicle, AdminUser, GalleryItem } from "./models.js";

// The caller owns the connection. Existing records and passwords are preserved.
export async function seedData({ email, password }) {
  if (!email || !password || password.length < 12)
    throw new Error(
      "An administrator email and a 12+ character password are required.",
    );
  await Promise.all([Vehicle.init(), AdminUser.init(), GalleryItem.init()]);
  const vehicles = JSON.parse(
    await readFile(
      new URL("../../shared/vehicles.json", import.meta.url),
      "utf8",
    ),
  );
  for (const vehicle of vehicles) {
    await Vehicle.updateOne(
      { slug: vehicle.slug },
      { $setOnInsert: vehicle },
      { upsert: true },
    );
    for (const [index, media] of vehicle.media.entries())
      await GalleryItem.updateOne(
        { id: `${vehicle.slug}-${index}` },
        {
          $setOnInsert: {
            id: `${vehicle.slug}-${index}`,
            vehicle: vehicle.slug,
            ...media,
          },
        },
        { upsert: true },
      );
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (!(await AdminUser.exists({ email: normalizedEmail })))
    await AdminUser.create({
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 12),
      role: "admin",
    });
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
  return {
    vehicles: await Vehicle.countDocuments(),
    gallery: await GalleryItem.countDocuments(),
  };
}
