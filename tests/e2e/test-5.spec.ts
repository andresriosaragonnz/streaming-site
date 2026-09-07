import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto(
    "http://localhost:8788/auth/claim?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbGxvd2VkIjpbImFpZGFuX3JpcGxleSJdfQ.7v2h3HzpW1E3jr9KHnVH-GtUpv1eAsvqV0wc6ZW1Lf0",
  );
  await page.getByLabel("Open menu").click();
  await page.getByLabel("Open menu").check();
  await page.getByRole("link", { name: "Aidan Ripley" }).click();
  await expect(page.locator("body")).toContainText("See public profile");
  await expect(page.locator("#performance-link")).toContainText(
    "See Private dashboard",
  );
  await expect(page.getByRole("main")).toContainText("Public:3");
  await expect(page.getByRole("main")).toContainText("Private:0");
  await expect(page.getByRole("main")).toContainText("ding dong lounge");
  await page.getByRole("link", { name: "ding dong lounge ding dong" }).click();
  await expect(page.locator("section")).toContainText("Public");
  await page.getByRole("button", { name: "Public" }).click();
  await expect(page.locator("section")).toContainText("Private");
  await expect(page.locator("section")).toContainText("Commit");
  await page.getByRole("button", { name: "Commit" }).click();
  await page.getByRole("checkbox", { name: "I agree to the Direct" }).check();
  await page.getByRole("button", { name: "Confirm Changes" }).click();
  await page.goto("http://localhost:8788/private/aidan_ripley");
  await page.getByRole("link", { name: "See public profile" }).click();
  await expect(page.locator("h1")).toContainText("Not Found");
  await page.goto("http://localhost:8788/private/aidan_ripley");
  await page.getByRole("button", { name: "Private" }).click();
  await page.getByRole("button", { name: "Commit" }).click();
  await page.getByRole("checkbox", { name: "I agree to the Direct" }).check();
  await page.getByRole("button", { name: "Confirm Changes" }).click();
});
