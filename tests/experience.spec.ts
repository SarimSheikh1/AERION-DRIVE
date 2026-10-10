import { test, expect } from "@playwright/test";
test("scroll story reaches the cabin and technical hotspots work", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".pinned-story")).toBeAttached();
  await expect(page.locator(".pin-spacer")).toBeAttached();
  for (const image of await page.locator(".home-vehicle img").all())
    await image.scrollIntoViewIfNeeded();
  await page.waitForFunction(() =>
    [...document.querySelectorAll<HTMLImageElement>(".home-vehicle img")].every(
      (img) => img.complete && img.naturalWidth > 0,
    ),
  );
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  const start = await page
    .locator(".pinned-story")
    .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await page.evaluate(
    (top) => window.scrollTo({ top, behavior: "instant" }),
    start + 1250,
  );
  await expect(page.locator(".story-caption h2")).toContainText("Space to");
  await expect(page.locator(".story-cockpit")).toBeVisible();
  await page.goto("/technology");
  await page.getByRole("button", { name: "Battery platform" }).click();
  await expect(page.locator(".hotspot-detail")).toContainText("98 kWh");
});
test("capture rendered hero and studio for visual review", async ({
  page,
}, info) => {
  await page.goto("/");
  await expect(page.locator(".hero-photo")).toBeVisible();
  await page.waitForFunction(() => {
    const photo = document.querySelector<HTMLImageElement>(".hero-photo");
    return photo?.complete && photo.naturalWidth > 0;
  });
  await page.waitForTimeout(1800);
  await page.screenshot({
    path: `test-results/review-${info.project.name}-home.png`,
  });
  await page.goto("/configurator");
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.locator(".scene-loading")).toHaveCount(0);
  await page.waitForTimeout(700);
  await page.screenshot({
    path: `test-results/review-${info.project.name}-studio.png`,
    fullPage: true,
  });
});
test("all public routes render and assets load", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const path of [
    "/",
    "/explore",
    "/vehicles/aerion-a1",
    "/configurator",
    "/compare",
    "/technology",
    "/story",
    "/gallery",
    "/book-test-drive",
    "/contact",
    "/admin",
    "/missing",
  ]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("body")).not.toContainText(
      "Something interrupted",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBeTruthy();
    const broken = await page
      .locator("img")
      .evaluateAll((imgs) =>
        imgs
          .filter(
            (i) =>
              (i as HTMLImageElement).complete &&
              !(i as HTMLImageElement).naturalWidth,
          )
          .map((i) => (i as HTMLImageElement).src),
      );
    expect(broken).toEqual([]);
  }
  expect(errors).toEqual([]);
});
test("collection filtering sorting and comparison work", async ({ page }) => {
  await page.goto("/explore");
  await expect(page.locator(".vehicle-card")).toHaveCount(5);
  await page.getByRole("button", { name: "Hypercar", exact: true }).click();
  await expect(page.locator(".vehicle-card")).toHaveCount(1);
  await expect(page.locator(".vehicle-card")).toContainText("Aerion Vortex");
  await page.getByRole("button", { name: "All", exact: true }).click();
  await page.getByLabel("Sort vehicles").selectOption("price");
  await expect(page.locator(".vehicle-card").first()).toContainText(
    "Aerion Pulse",
  );
  await page.goto("/compare");
  await page
    .getByRole("button", { name: "Aerion Horizon", exact: true })
    .click();
  await expect(page.locator(".comparison-table thead h3")).toHaveCount(3);
  await expect(
    page.getByRole("button", { name: "Aerion Pulse", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Highlight differences").check();
  await expect(page.locator(".difference-row").first()).toBeVisible();
  await page.getByRole("button", { name: "Reset comparison" }).click();
  await expect(page.locator(".comparison-table")).toHaveCount(0);
});
test("real WebGL studio rotates, changes paint and saves configuration", async ({
  page,
}) => {
  await page.goto("/configurator");
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.locator(".scene-loading")).toHaveCount(0);
  const canvas = page.locator("canvas");
  const before = await canvas.screenshot();
  const box = await canvas.boundingBox();
  if (!box) throw Error("Canvas missing");
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.6, {
    steps: 12,
  });
  await page.mouse.up();
  await page.waitForTimeout(300);
  const after = await canvas.screenshot();
  expect(after.equals(before)).toBeFalsy();
  await page
    .getByRole("button", { name: "Electric Amber", exact: true })
    .click();
  await expect(page.locator(".selected-color")).toHaveText("Electric Amber");
  await page.waitForTimeout(450);
  expect((await canvas.screenshot()).equals(after)).toBeFalsy();
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  const zoomed = await canvas.screenshot();
  await page.getByRole("button", { name: "Zoom out", exact: true }).click();
  expect((await canvas.screenshot()).equals(zoomed)).toBeFalsy();
  await page.getByLabel("Vehicle model").selectOption("aerion-horizon");
  await expect(page.locator(".config-summary")).toContainText("Aerion Horizon");
  await page.getByLabel("Vehicle model").selectOption("aerion-a1");
  await page.getByRole("button", { name: "Polished alloy", exact: true }).click();
  await page.getByRole("button", { name: "front", exact: true }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("saved");
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("aerion-configuration") || "{}"),
    ),
  ).toMatchObject({ color: "#FFB000", wheels: "sport", angle: "front" });
  await page.getByRole("button", { name: "Reset camera" }).click();
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await expect(page).toHaveURL(/color=%23FFB000/);
  await page
    .getByRole("button", { name: "Reset configuration", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Graphite alloy", exact: true }),
  ).toHaveClass(/active/);
  await page
    .getByRole("button", { name: "Restore saved configuration", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Polished alloy", exact: true }),
  ).toHaveClass(/active/);
});
test("gallery supports keyboard and contact reports database failure honestly", async ({
  page,
}) => {
  await page.goto("/gallery");
  await page.locator(".gallery-frame").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/contact");
  await page.route("**/api/contact", (route) => route.fulfill({
    status: 503, contentType: "application/json",
    body: JSON.stringify({ message: "The service is temporarily unavailable. Your submission has not been saved. Please try again later." }),
  }));
  await page.getByLabel("Full name").fill("Demo Visitor");
  await page.getByLabel("Email address").fill("visitor@example.test");
  await page
    .getByLabel("Your message")
    .fill("Please tell me about the Aerion concepts.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("alert")).toContainText("not been saved");
});
test("reduced motion and mobile navigation remain usable", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  if (info.project.name === "mobile") {
    await page.getByRole("button", { name: "Open navigation" }).click();
    await page
      .getByRole("link", { name: "The collection", exact: true })
      .click();
    await expect(page).toHaveURL(/explore/);
    await expect(
      page.getByRole("button", { name: "Open navigation" }),
    ).toBeVisible();
  } else {
    await page
      .getByRole("link", { name: "The collection", exact: true })
      .click();
    await expect(page).toHaveURL(/explore/);
  }
});
