import { readFile, writeFile } from "node:fs/promises";
const root = new URL("../", import.meta.url);
const vehiclesPath = new URL("shared/vehicles.json", root);
const vehicles = JSON.parse(await readFile(vehiclesPath, "utf8"));
const descriptions = {
  a1: "Black Porsche Taycan photographed on an urban street",
  vortex: "Orange McLaren sports car photographed from the front",
  horizon: "Range Rover photographed on a forest road",
  stratos: "Yellow McLaren photographed on the road",
  pulse: "Porsche photographed driving through the city at night",
};
for (const vehicle of vehicles)
  vehicle.media = vehicle.media.map((media) => ({
    ...media,
    url: `/images/${vehicle.id}.webp`,
    alt: descriptions[vehicle.id],
  }));
await writeFile(vehiclesPath, JSON.stringify(vehicles, null, 2) + "\n");
const galleryPath = new URL("shared/gallery.json", root);
const gallery = JSON.parse(await readFile(galleryPath, "utf8"));
gallery[0] = {
  ...gallery[0],
  url: "/images/cockpit.webp",
  alt: "Mercedes-Benz luxury cabin photograph",
};
gallery[1] = {
  ...gallery[1],
  url: "/images/stratos.webp",
  alt: "McLaren sports car profile photograph",
};
await writeFile(galleryPath, JSON.stringify(gallery, null, 2) + "\n");
for (const filename of [
  "client/src/App.tsx",
  "client/src/pages/Pages.tsx",
  "client/src/components/AdminRecordEditor.tsx",
]) {
  const path = new URL(filename, root);
  let source = await readFile(path, "utf8");
  source = source
    .replaceAll("/images/a1.svg", "/images/a1.webp")
    .replaceAll("/images/cockpit.svg", "/images/cockpit.webp");
  source = source.replace(
    "Original Aerion panoramic cabin illustration — an interior design study",
    "Mercedes-Benz panoramic cabin photograph",
  );
  await writeFile(path, source);
}
// Migrate only the bundled legacy illustrations in the running local database.
// Existing custom admin images, specifications and enquiries remain intact.
const credentials = JSON.parse(
  await readFile(new URL(".local/admin-credentials.json", root), "utf8"),
);
const api = async (path, options = {}) => {
  const response = await fetch(`http://localhost:4000/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:5173",
      ...(options.headers || {}),
    },
  });
  if (!response.ok)
    throw new Error(
      `Local media migration failed: ${path} (${response.status})`,
    );
  return response;
};
const login = await api("/admin/login", {
  method: "POST",
  body: JSON.stringify({
    email: credentials.email,
    password: credentials.password,
  }),
});
const cookie = login.headers
  .getSetCookie()
  .map((value) => value.split(";")[0])
  .join("; ");
const headers = { Cookie: cookie };
const { vehicles: stored } = await (
  await api("/admin/vehicles", { headers })
).json();
for (const vehicle of stored) {
  const preset = vehicles.find((item) => item.slug === vehicle.slug);
  if (!preset) continue;
  const media = vehicle.media.map((item) =>
    item.url === `/images/${preset.id}.svg`
      ? { ...item, ...preset.media[0] }
      : item,
  );
  if (JSON.stringify(media) !== JSON.stringify(vehicle.media))
    await api(`/admin/vehicles/${vehicle.slug}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ media }),
    });
}
const { items } = await (await api("/admin/gallery", { headers })).json();
for (const item of items) {
  const preset = gallery.find((entry) => entry.id === item.id);
  const vehicle = vehicles.find((entry) => item.id === `${entry.slug}-0`);
  const replacement = preset || vehicle?.media[0];
  if (replacement && item.url.endsWith(".svg"))
    await api(`/admin/gallery/${item.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(replacement),
    });
}
await api("/admin/logout", { method: "POST", headers });
console.log(
  "Shared catalogue and local database now use real car photography.",
);
