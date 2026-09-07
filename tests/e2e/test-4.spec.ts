import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:8788/aidan_ripley");
  await page.getByLabel("Open menu").click();
  await page.getByLabel("Open menu").check();
  await page.getByRole("link", { name: "My playlists" }).click();
  await expect(page.getByRole("heading")).toContainText("My Playlists");
  await expect(page.locator("#portfolio-hero-container")).toContainText(
    "0 Documented",
  );
  await expect(page.locator("#performance-grid")).toContainText(
    "You haven't created any custom playlists yet.",
  );
  await page.getByLabel("Open menu").click();
  await page.getByLabel("Open menu").check();
  await page.locator("label").nth(4).click();
  await page.locator("label").nth(4).uncheck();
  await page.getByLabel("Open search").getByRole("img").click();
  await page.getByLabel("Open search").getByRole("img").check();
  await page.getByRole("textbox", { name: "Search" }).fill("aidan ripley");
  await page.getByRole("textbox", { name: "Search" }).press("ArrowDown");
  await page.getByRole("textbox", { name: "Search" }).press("Enter");
  await expect(page.locator("h1")).toContainText("aidan ripley");
  await page.getByRole("link", { name: "ding dong lounge ding dong" }).click();
  await expect(page.locator("header")).toContainText("Performance");
  await page.getByRole("button", { name: "Add to playlist" }).click();
  await page.getByLabel("Open menu").click();
  await page.getByLabel("Open menu").check();
  await page.getByRole("link", { name: "My playlists" }).click();
  await expect(page.locator("#portfolio-hero-container")).toContainText(
    "1 Documented",
  );
  await expect(page.locator("h3")).toContainText("Favorites");
  await page.getByRole("link", { name: "Favorites 1 tracks" }).click();
  await expect(page.locator("#publicPlayerColumn")).toContainText("Favorites");
  await expect(page.locator("#publicPlayerColumn")).toContainText("segment_2");
  await expect(page.locator("#sidebar-artist")).toContainText("aidan ripley");
  await page.getByRole("link", { name: "aidan ripley" }).click();
  await expect(page.locator("h1")).toContainText("aidan ripley");
  await expect(page.locator("body")).toContainText("1 Documented");
});
