# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: test-1.spec.ts >> test
- Location: tests/e2e/test-1.spec.ts:3:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('link', { name: 'ding dong lounge ding dong' })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic "Open menu" [ref=e5] [cursor=pointer]: Menu
      - generic "Open search" [ref=e7] [cursor=pointer]
    - generic:
      - generic:
        - textbox "Search"
        - generic "Close search": ×
      - list
    - complementary [ref=e11]:
      - list [ref=e12]:
        - listitem [ref=e13]:
          - link "My playlists" [ref=e14] [cursor=pointer]:
            - /url: /myplaylists
        - listitem [ref=e15]:
          - generic [ref=e16]: "private:"
          - list
  - generic [ref=e18]:
    - img "My Playlists" [ref=e20]
    - generic [ref=e21]:
      - heading "Not Found" [level=1] [ref=e22]
      - heading "Use the search to find an artist" [level=3] [ref=e23]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test("test", async ({ page }) => {
  4  |   await page.goto("http://localhost:8788/aidan_ripley");
> 5  |   await page.getByRole("link", { name: "ding dong lounge ding dong" }).click();
     |                                                                        ^ Error: locator.click: Test timeout of 30000ms exceeded.
  6  |   await expect(page.getByText("Performance")).toBeVisible();
  7  |   await expect(
  8  |     page.getByRole("heading", { name: "aidan ripley-ding dong lounge" }),
  9  |   ).toBeVisible();
  10 |   await expect(page.getByRole("heading", { name: "segment_2" })).toBeVisible();
  11 |   await expect(page.locator("header")).toContainText("Performance");
  12 |   await expect(page.locator("h2")).toContainText(
  13 |     "aidan ripley-ding dong lounge-09 Jan 26",
  14 |   );
  15 |   await page.getByLabel("Toggle Audio Mode").click();
  16 |   await page.getByRole("checkbox", { name: "Toggle Audio Mode" }).check();
  17 |   await page.getByRole("img", { name: "Cassette Player Deck" }).click();
  18 |   await page.getByRole("img", { name: "Cassette Player Deck" }).click();
  19 |   await expect(
  20 |     page.getByRole("img", { name: "Cassette Player Deck" }),
  21 |   ).toBeVisible();
  22 |   await page.getByLabel("Toggle Audio Mode").click();
  23 |   await page.getByRole("checkbox", { name: "Toggle Audio Mode" }).uncheck();
  24 | });
  25 | 
```