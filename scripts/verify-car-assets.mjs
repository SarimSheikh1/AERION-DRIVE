import { readFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
const root = new URL("../", import.meta.url);
const cars = JSON.parse(
  await readFile(new URL("shared/car-cutouts.json", root), "utf8"),
);
const hashes = new Set();
const sources = new Set();
const thumbnails = [];
let totalBytes = 0;
const normalized = [];
for (const [index, car] of cars.entries()) {
  const file = await readFile(new URL(`client/public${car.url}`, root));
  const hash = createHash("sha256").update(file).digest("hex");
  if (hashes.has(hash) || sources.has(car.source))
    throw new Error(`Duplicate car image: ${car.id}`);
  hashes.add(hash);
  sources.add(car.source);
  totalBytes += file.length;
  normalized.push(
    await sharp(file)
      .resize(64, 64, { fit: "contain", background: "#10151b" })
      .flatten({ background: "#10151b" })
      .removeAlpha()
      .raw()
      .toBuffer(),
  );
  const metadata = await sharp(file).metadata();
  const stats = await sharp(file).stats();
  if (
    !metadata.hasAlpha ||
    stats.channels[3]?.min !== 0 ||
    stats.channels[3]?.max !== 255
  )
    throw new Error(`Missing genuine transparency: ${car.id}`);
  thumbnails.push({
    input: await sharp(file)
      .resize(200, 115, { fit: "contain", background: "#10151b" })
      .png()
      .toBuffer(),
    left: (index % 6) * 200,
    top: Math.floor(index / 6) * 140,
  });
}
if (cars.length < 51) throw new Error("Need at least 51 cars.");
await mkdir(new URL("reports/", root), { recursive: true });
await sharp({
  create: {
    width: 1200,
    height: Math.ceil(cars.length / 6) * 140,
    channels: 4,
    background: "#10151b",
  },
})
  .composite(thumbnails)
  .png()
  .toFile(fileURLToPath(new URL("reports/car-contact-sheet.png", root)));
console.log(
  `${cars.length} unique source images; ${cars.length} distinct file hashes; all have real alpha transparency.`,
);
console.log(
  `Combined optimized assets: ${(totalBytes / 1024 / 1024).toFixed(1)} MB.`,
);
const matches = [];
for (let a = 0; a < normalized.length; a++)
  for (let b = a + 1; b < normalized.length; b++) {
    let difference = 0;
    for (let pixel = 0; pixel < normalized[a].length; pixel++)
      difference += Math.abs(normalized[a][pixel] - normalized[b][pixel]);
    const mean = difference / normalized[a].length;
    if (mean < 8)
      matches.push({
        a: a + 1,
        b: b + 1,
        mean: +mean.toFixed(2),
        ids: [cars[a].id, cars[b].id],
      });
  }
console.log("Visually similar images for review:", matches);
