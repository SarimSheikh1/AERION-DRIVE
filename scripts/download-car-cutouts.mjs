import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// Re-download the visually reviewed collection without replacing its curated selections.
const root = new URL("../", import.meta.url);
const cars = JSON.parse(
  await readFile(new URL("shared/car-cutouts.json", root), "utf8"),
);
await mkdir(new URL("client/public/images/cars/", root), { recursive: true });
for (const car of cars) {
  const response = await fetch(car.source);
  if (!response.ok)
    throw new Error(`Download failed: ${car.id} (${response.status})`);
  const data = Buffer.from(await response.arrayBuffer());
  const metadata = await sharp(data).metadata();
  if (!metadata.hasAlpha) throw new Error(`Transparency missing: ${car.id}`);
  await sharp(data)
    .trim({ background: "#00000000" })
    .resize({ width: 1400, withoutEnlargement: true })
    .webp({ quality: 85, alphaQuality: 100 })
    .toFile(fileURLToPath(new URL(`client/public${car.url}`, root)));
  console.log(`${car.id} saved`);
}
console.log(`${cars.length} reviewed transparent car cutouts downloaded.`);
