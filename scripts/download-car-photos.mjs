import { mkdir, writeFile } from "node:fs/promises";
const photos = [
  ["a1", "1746636015154-a762041e8e53"],
  ["vortex", "1654041959637-43e2aa390be9"],
  ["horizon", "1549632891-a0bea6d0355b"],
  ["stratos", "1610368181371-96e7e898923f"],
  ["pulse", "1614415512834-d6a88fcc29e4"],
  ["cockpit", "1605437241278-c1806d14a4d9"],
];
const target = new URL("../client/public/images/", import.meta.url);
await mkdir(target, { recursive: true });
for (const [name, id] of photos) {
  const response = await fetch(
    `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1920&q=85&fm=webp`,
  );
  if (
    !response.ok ||
    !response.headers.get("content-type")?.startsWith("image/")
  )
    throw new Error(`Image download failed: ${name} (${response.status})`);
  const data = Buffer.from(await response.arrayBuffer());
  await writeFile(new URL(`${name}.webp`, target), data);
  console.log(`${name}.webp: ${Math.round(data.length / 1024)} KB`);
}
