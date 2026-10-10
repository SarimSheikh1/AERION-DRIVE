import { mkdir, writeFile, cp } from "node:fs/promises";
const target = new URL("../client/public/models/", import.meta.url);
await mkdir(target, { recursive: true });
const response = await fetch(
  "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/ferrari.glb",
);
if (!response.ok) throw new Error(`Model download failed (${response.status})`);
const data = Buffer.from(await response.arrayBuffer());
if (data.toString("ascii", 0, 4) !== "glTF")
  throw new Error("Invalid GLB response");
await writeFile(new URL("ferrari.glb", target), data);
await cp(
  new URL(
    "../node_modules/three/examples/jsm/libs/draco/gltf/",
    import.meta.url,
  ),
  new URL("draco/", target),
  { recursive: true },
);
const metadata = JSON.parse(
  data.toString("utf8", 20, 20 + data.readUInt32LE(12)),
);
console.log(
  "Ferrari GLB downloaded:",
  Math.round(data.length / 1024),
  "KB. Asset:",
  metadata.asset,
);
try {
  const info = await (
    await fetch(
      "https://api.sketchfab.com/v3/models/57bf6cc56931426e87494f554df1dab6",
    )
  ).json();
  console.log("Original model:", info.name, "Licence:", info.license);
} catch {
  console.log(
    "Original author: vicent091036; source: Three.js official car-materials example.",
  );
}
