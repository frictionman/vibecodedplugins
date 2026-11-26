import { expect, test } from "@playwright/test";
import JSZip from "jszip";

async function pluginZip(bundle: string) {
  const zip = new JSZip();
  zip.file(`${bundle}/Contents/README.txt`, "placeholder");
  return Buffer.from(await zip.generateAsync({ type: "uint8array" }));
}

test("upload, find, report and delete a plugin", async ({ page }) => {
  const name = `Glitter Pad ${Date.now()}`;

  // Upload
  await page.goto("/upload");
  await page.locator('input[type="file"][accept^=".zip"]').setInputFiles({
    name: "glitter.zip",
    mimeType: "application/zip",
    buffer: await pluginZip("Glitter Pad.clap"),
  });
  await expect(page.getByText("glitter.zip")).toBeVisible();
  await page.getByLabel("Plugin name").fill(name);
  await page.getByLabel("Your name or handle").fill("softsynthsally");
  await page.getByLabel("Tagline").fill("Shimmering supersaw pads with a sparkle knob");
  await page.getByLabel("Description").fill("Turn the sparkle knob.");
  await page.locator("label", { has: page.getByRole("radio", { name: "Synth" }) }).click();
  await page.locator("label", { has: page.getByRole("checkbox", { name: "Linux" }) }).click();
  await page.getByLabel("Tags").fill("pads, sparkle");
  await page.getByRole("checkbox", { name: /I made this plugin/ }).check();
  await page.getByRole("button", { name: /Share it with the world/ }).click();

  await expect(page.getByRole("heading", { name: "It's live!" })).toBeVisible();
  await expect(page.getByText("We found CLAP inside your zip")).toBeVisible();
  const manageUrl = (await page.getByRole("button", { name: /\/manage#/ }).textContent())!.replace(/Copy$|Copied!$/, "");
  expect(manageUrl).toMatch(/\/p\/glitter-pad-\d+\/manage#.+/);

  // Find it through search
  await page.goto("/");
  await page.getByLabel("Search plugins").fill("sparkle knob");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page).toHaveURL(/\?q=sparkle\+knob/);
  await expect(page.locator('main a[href^="/p/"]')).toHaveCount(1);
  await page.getByRole("link", { name: new RegExp(name) }).click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  const pluginUrl = page.url();

  // A search that shouldn't match
  await page.goto("/?q=definitely-not-a-plugin");
  await expect(page.getByRole("heading", { name: "Nothing matches that vibe" })).toBeVisible();

  // Report it
  await page.goto(pluginUrl);
  await page.getByRole("button", { name: /Report this plugin/ }).click();
  await page.getByLabel("Doesn't work / crashes my DAW").check();
  await page.getByRole("button", { name: "Send report" }).click();
  await expect(page.getByText("Thanks, report received.")).toBeVisible();

  // Delete it with the manage link
  await page.goto(manageUrl);
  await page.getByRole("button", { name: "Delete plugin" }).click();
  await page.getByRole("button", { name: "Yes, delete it forever" }).click();
  await expect(page.getByText("Deleted. The file and its page are gone.")).toBeVisible();

  await page.goto(pluginUrl);
  await expect(page.getByRole("heading", { name: "This plugin went quiet" })).toBeVisible();
  await page.goto("/?q=sparkle+knob");
  await expect(page.getByRole("heading", { name: "Nothing matches that vibe" })).toBeVisible();
});

test("the upload form shows the server's error for a zip without plugins", async ({ page }) => {
  const zip = new JSZip();
  zip.file("setup.exe", "nope");
  await page.goto("/upload");
  await page.locator('input[type="file"][accept^=".zip"]').setInputFiles({
    name: "nope.zip",
    mimeType: "application/zip",
    buffer: Buffer.from(await zip.generateAsync({ type: "uint8array" })),
  });
  await page.getByLabel("Plugin name").fill("No Bundle");
  await page.getByLabel("Your name or handle").fill("someone");
  await page.getByLabel("Tagline").fill("tagline");
  await page.getByLabel("Description").fill("description");
  await page.locator("label", { has: page.getByRole("radio", { name: "Effect" }) }).click();
  await page.locator("label", { has: page.getByRole("checkbox", { name: "macOS" }) }).click();
  await page.getByRole("checkbox", { name: /I made this plugin/ }).check();
  await page.getByRole("button", { name: /Share it with the world/ }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText("didn't find a .vst3, .component (AU) or .clap plugin");
});
