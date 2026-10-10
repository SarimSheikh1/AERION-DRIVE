import { test, expect } from "@playwright/test";
import cars from "../shared/car-cutouts.json" with { type: "json" };

test("unique transparent cars respond to mouse wheel, drag and arrows", async ({
  page,
}, info) => {
  expect(cars.length).toBeGreaterThan(50);
  expect(new Set(cars.map((car) => car.url)).size).toBe(cars.length);
  expect(new Set(cars.map((car) => car.source)).size).toBe(cars.length);
  await page.goto("/");
  const photo = page.locator(".hero-photo");
  await expect(photo).toBeVisible();
  await page.waitForFunction(() => {
    const image = document.querySelector<HTMLImageElement>(".hero-photo");
    return image?.complete && image.naturalWidth > 0;
  });
  await expect(photo).toHaveAttribute("src", cars[0].url);
  const carousel = page.getByRole("region", { name: "Real car collection" });
  if (info.project.name === "desktop") {
    await carousel.hover();
    await page.mouse.wheel(0, 520);
    await expect(photo).toHaveAttribute("src", cars[1].url);
    const box = await carousel.boundingBox();
    if (!box) throw new Error("Carousel missing");
    await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.35, box.y + box.height * 0.5, {
      steps: 10,
    });
    await page.mouse.up();
    await expect(photo).toHaveAttribute("src", cars[2].url);
  } else {
    await carousel.dispatchEvent("pointerdown", {
      pointerId: 1,
      pointerType: "touch",
      button: 0,
      clientX: 300,
      clientY: 350,
    });
    await carousel.dispatchEvent("pointerup", {
      pointerId: 1,
      pointerType: "touch",
      button: 0,
      clientX: 100,
      clientY: 350,
    });
    await expect(photo).toHaveAttribute("src", cars[1].url);
  }
  const before = await photo.getAttribute("src");
  await page.getByRole("button", { name: "Next car", exact: true }).click();
  await expect(photo).not.toHaveAttribute("src", before!);
  await page.getByRole("button", { name: "Previous car", exact: true }).click();
  await expect(photo).toHaveAttribute("src", before!);
  await page.goto("/gallery");
  await expect(page.locator(".gallery-frame")).toHaveCount(66);
  const sources = await page
    .locator(".gallery-frame img")
    .evaluateAll((images) =>
      images.map((image) => (image as HTMLImageElement).src),
    );
  expect(new Set(sources).size).toBe(sources.length);
});

test("reduced motion keeps manual carousel navigation usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".hero-photo")).toHaveAttribute("src", cars[0].url);
  await page.getByRole("button", { name: "Next car", exact: true }).click();
  await expect(page.locator(".hero-photo")).toHaveAttribute("src", cars[1].url);
});
