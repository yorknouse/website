import { test, expect } from "@playwright/test";

test.describe("Team Page", () => {
  test("Shows authors in the correct sections", async ({ page }) => {
    await page.goto("./team");
    const seniorTeamUsers = page.locator("#senior-team >> .user");
    await expect(seniorTeamUsers).toHaveCount(1);
    await expect(seniorTeamUsers.locator("span").first()).toHaveText(
      "Editor -"
    );
    await expect(seniorTeamUsers.locator("a").first()).toHaveText("John Doe");
    await expect(seniorTeamUsers.locator("a").first()).toHaveAttribute(
      "href",
      "/website/author/1"
    );
    await expect(seniorTeamUsers.locator("a").nth(1)).toHaveText(
      "john.doe@nouse.co.uk"
    );
    await expect(seniorTeamUsers.locator("a").nth(1)).toHaveAttribute(
      "href",
      "mailto:john.doe@nouse.co.uk"
    );

    const nouseUsers = page.locator("#nouse >> .user");
    await expect(nouseUsers).toHaveCount(1);
    await expect(nouseUsers.locator("span").first()).toHaveText(
      "News Editor -"
    );
    await expect(nouseUsers.locator("a").first()).toHaveText("Jane Doe");
    await expect(nouseUsers.locator("a").first()).toHaveAttribute(
      "href",
      "/website/author/2"
    );
    await expect(nouseUsers.locator("a").nth(1)).toHaveText(
      "jane.doe@nouse.co.uk"
    );
    await expect(nouseUsers.locator("a").nth(1)).toHaveAttribute(
      "href",
      "mailto:jane.doe@nouse.co.uk"
    );

    await expect(page.locator("#muse >> .user")).toHaveCount(0);
    await expect(page.locator("#behind-the-scenes >> .user")).toHaveCount(0);
  });
});
