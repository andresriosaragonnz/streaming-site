import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:8788/aidan_ripley");
  await page.getByRole("link", { name: "ding dong lounge ding dong" }).click();
  await expect(page.getByText("Performance")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "aidan ripley-ding dong lounge" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "segment_2" })).toBeVisible();
  await expect(page.locator("header")).toContainText("Performance");
  await expect(page.locator("h2")).toContainText(
    "aidan ripley-ding dong lounge-09 Jan 26",
  );
  await page.getByLabel("Toggle Audio Mode").click();
  await page.getByRole("checkbox", { name: "Toggle Audio Mode" }).check();
  await page.getByRole("img", { name: "Cassette Player Deck" }).click();
  await page.getByRole("img", { name: "Cassette Player Deck" }).click();
  await expect(
    page.getByRole("img", { name: "Cassette Player Deck" }),
  ).toBeVisible();
  await page.getByLabel("Toggle Audio Mode").click();
  await page.getByRole("checkbox", { name: "Toggle Audio Mode" }).uncheck();
});
