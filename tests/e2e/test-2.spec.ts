import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:8788/aidan_ripley");
  await expect(page.locator("h1")).toContainText("aidan ripley");
  await expect(page.getByRole("button")).toContainText("See network");
  await expect(page.locator("h3")).toContainText("ding dong lounge");
  await expect(page.getByRole("main")).toContainText("09 Jan 26");
  await page.getByRole("button", { name: "See network" }).click();
  await expect(page.getByRole("link", { name: "See videos" })).toBeVisible();
  await expect(page.locator("#see-videos-btn")).toContainText("See videos");
  await expect(page.getByRole("button", { name: "X" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Show Full Network" }),
  ).toBeVisible();
  await expect(page.locator("#reset-btn-container")).toContainText("X");
  await page.getByRole("button", { name: "X" }).click();
});
