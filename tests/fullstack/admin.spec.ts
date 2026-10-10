import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("real contact submission and structured admin editing persist", async ({
  page,
}, info) => {
  const credentials = JSON.parse(
    await readFile(".local/e2e-admin.json", "utf8"),
  );
  const name = `Studio visitor ${info.project.name}`;
  await page.goto("/contact");
  await page.getByLabel("Full name").fill(name);
  await page
    .getByLabel("Email address")
    .fill(`${info.project.name}@example.com`);
  await page
    .getByLabel("Your message")
    .fill("Please send further information about this vehicle collection.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("status")).toContainText("received");
  await page.goto("/admin");
  await page.getByLabel("Admin email").fill(credentials.email);
  await page
    .getByLabel("Password *", { exact: true })
    .fill(credentials.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Administration." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "contacts", exact: true }).click();
  await page.getByLabel("Search records").fill(name);
  await expect(page.locator(".admin-record")).toHaveCount(1);
  await page.getByLabel("Request status").selectOption("reviewing");
  await expect(page.getByRole("status")).toContainText("Status updated");
  await page.getByRole("button", { name: "vehicles", exact: true }).click();
  await page.getByLabel("Search records").fill("Aerion A1");
  await page
    .locator(".admin-record")
    .getByRole("button", { name: "Edit", exact: true })
    .click();
  const original = await page
    .getByLabel("Tagline", { exact: true })
    .inputValue();
  const updated = `A new perspective ${info.project.name}.`;
  await page.getByLabel("Tagline", { exact: true }).fill(updated);
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Changes saved");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Administration." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "vehicles", exact: true }).click();
  await page.getByLabel("Search records").fill("Aerion A1");
  await expect(page.locator(".admin-record")).toContainText(updated);
  await page
    .locator(".admin-record")
    .getByRole("button", { name: "Edit", exact: true })
    .click();
  await page.getByLabel("Tagline", { exact: true }).fill(original);
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Changes saved");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByLabel("Admin email")).toBeVisible();
});
