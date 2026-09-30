import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Draco Malfoy" }),
  ).toBeVisible();
});
test("discovery searches, saves, filters and survives reload", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Save Draco Malfoy", exact: true })
    .click();
  await page.getByRole("button", { name: "Saved 1", exact: true }).click();
  await expect(page.locator(".wizard-card")).toHaveCount(1);
  await page.reload();
  await page.getByRole("button", { name: "Saved 1", exact: true }).click();
  await expect(page.locator(".wizard-card")).toHaveCount(1);
  await page.getByRole("button", { name: "All wizards", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Filter by house" })
    .selectOption("Ravenclaw");
  await expect(page.locator(".wizard-card")).toHaveCount(2);
  await page
    .getByRole("textbox", { name: "Search wizards, skills or houses" })
    .fill("no such wizard");
  await expect(page.getByText("No wizards on this path… yet.")).toBeVisible();
  await page.getByRole("button", { name: "Show all wizards" }).click();
  await expect(page.locator(".wizard-card")).toHaveCount(6);
});
test("booking, tutor acceptance, two reviews and a single settlement", async ({
  page,
}) => {
  await page
    .locator(".wizard-card")
    .first()
    .getByRole("button", { name: "Plan a lesson" })
    .click();
  const dialog = page.getByRole("dialog", { name: "Plan a lesson" });
  await expect(dialog).toBeVisible();
  await dialog.locator('input[type="datetime-local"]').fill("2099-01-02T10:00");
  await dialog
    .getByRole("button", { name: /Dispatch|Send|Propose/ })
    .last()
    .click();
  await expect(
    page.getByText("Advanced Potions", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("pending", { exact: false }).first(),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Active wizard profile" })
    .selectOption("draco_malfoy");
  await page.getByRole("button", { name: "Accept Spell Trade" }).click();
  await expect(
    page.getByText("accepted", { exact: false }).first(),
  ).toBeVisible();
  // Simulate the scheduled lesson having ended; no external database is involved.
  await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("hackwarts-demo-v1")!);
    Object.values(data.swaps).forEach(
      (s: any) => (s.dateTime = "2020-01-01T10:00:00Z"),
    );
    localStorage.setItem("hackwarts-demo-v1", JSON.stringify(data));
  });
  await page.reload();
  await page.getByRole("button", { name: "My Lessons", exact: true }).click();
  await page.getByRole("button", { name: "Complete Lesson & Review" }).click();
  await page
    .getByRole("dialog")
    .locator("textarea")
    .fill("A great magical lesson.");
  await page.getByRole("button", { name: /Submit Review/ }).click();
  await expect(page.getByText("✓ Reviewed & Vault Settled")).toBeVisible();
  await page
    .getByRole("combobox", { name: "Active wizard profile" })
    .selectOption("harry_potter");
  await page.getByRole("button", { name: "Leave a Spell Review" }).click();
  await page.getByRole("dialog").locator("textarea").fill("Excellent tutor.");
  await page.getByRole("button", { name: /Submit Review/ }).click();
  await expect(page.getByText("✓ Reviewed & Vault Settled")).toBeVisible();
  const ledger = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("hackwarts-demo-v1")!),
  );
  expect(ledger.users.harry_potter.credits).toBe(6.5);
  expect(ledger.users.draco_malfoy.credits).toBe(5);
  expect(Object.keys(ledger.reviews)).toHaveLength(2);
});
test("owl post preserves conversation after reload", async ({ page }) => {
  await page
    .getByRole("button", { name: "Send an owl to Draco Malfoy" })
    .click();
  const input = page.getByPlaceholder(
    "Dispatch an owl letter to Draco Malfoy...",
  );
  await input.fill("Ready for our Potions lesson?");
  await input.press("Enter");
  await expect(
    page.getByText("Ready for our Potions lesson?", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Send an owl to Draco Malfoy" })
    .click();
  await expect(
    page.getByText("Ready for our Potions lesson?", { exact: true }),
  ).toBeVisible();
});
test("spell navigation, theme persistence and command dialog keyboard", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Spell Practice", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Spellcraft Training/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Cast Expecto Patronum", exact: true })
    .click();
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await page.reload();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.keyboard.press("Control+k");
  await expect(
    page.getByRole("dialog", { name: "Search the castle" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("mobile navigation and no horizontal overflow at 390px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Potions Lab", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /Alchemy|Cauldron|Potions/ }).first(),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("AI errors preserve local results and enrollment creates an editable profile", async ({
  page,
}) => {
  await page.route("**/api/matchmaking", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: '{"error":"Unavailable"}',
    }),
  );
  await page.getByRole("button", { name: "Refresh matches" }).click();
  await expect(
    page.getByText(
      "The Sorting Hat is resting. Skill-based matches are ready below.",
    ),
  ).toBeVisible();
  await expect(page.locator(".wizard-card")).toHaveCount(6);
  await page.getByRole("button", { name: "Enroll a wizard" }).click();
  const dialog = page.getByRole("dialog", { name: "Enroll a wizard" });
  await dialog.locator("input").fill("Test Wizard");
  await dialog
    .locator("textarea")
    .fill("Learning charms and sharing herbology.");
  await dialog
    .getByRole("button", { name: /Enroll|Create|Submit/ })
    .last()
    .click();
  await expect(
    page.getByRole("heading", { name: "Test Wizard" }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Active wizard profile" }),
  ).toHaveValue(/custom_/);
});

test("profile edits persist and potions brew with distinct ingredients", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "My Wizard Profile", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Wizard name", exact: true })
    .fill("Harry the Mentor");
  await page.getByRole("button", { name: "Save Profile", exact: true }).click();
  await expect(page.getByText("Profile updated successfully!")).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("combobox", { name: "Active wizard profile" }),
  ).toContainText("Harry the Mentor");
  await page.getByRole("button", { name: "Potions Lab", exact: true }).click();
  const selects = page.locator("main select");
  await selects.nth(0).selectOption("eye_of_newt");
  await expect(
    selects.nth(1).locator('option[value="eye_of_newt"]'),
  ).toBeDisabled();
  await selects.nth(1).selectOption("mandrake_root");
  await page.getByRole("button", { name: /STIR ALCHEMICAL CAULDRON/ }).click();
  await expect(
    page.getByRole("button", { name: /Add .* to My Skills/ }),
  ).toBeVisible({ timeout: 8000 });
});
