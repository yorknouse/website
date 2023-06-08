import { test, expect } from "@playwright/test";

test.describe("Team Page", () => {
  test("Shows authors in the correct sections", async ({ page }) => {
    await page.goto("./team");
    const seniorTeamUsers = page.locator("#senior-team >> .user");

    // Checker number of users in section
    await expect(seniorTeamUsers).toHaveCount(1);

    // Checking user position
    await expect(seniorTeamUsers.locator("span").first()).toHaveText(
      "Editor -"
    );

    // Checking user name
    await expect(seniorTeamUsers.locator("a").first()).toHaveText("John Doe");

    // Checking link to author page
    await expect(seniorTeamUsers.locator("a").first()).toHaveAttribute(
      "href",
      "/website/author/1"
    );

    // Checking user email
    await expect(seniorTeamUsers.locator("a").nth(1)).toHaveText(
      "john.doe@nouse.co.uk"
    );

    // Checking link to user email
    await expect(seniorTeamUsers.locator("a").nth(1)).toHaveAttribute(
      "href",
      "mailto:john.doe@nouse.co.uk"
    );

    const nouseUsers = page.locator("#nouse >> .user");

    // Checker number of users in section
    await expect(nouseUsers).toHaveCount(1);

    // Checking user position
    await expect(nouseUsers.locator("span").first()).toHaveText(
      "News Editor -"
    );

    // Checking user name
    await expect(nouseUsers.locator("a").first()).toHaveText("Jane Doe");

    // Checking link to author page
    await expect(nouseUsers.locator("a").first()).toHaveAttribute(
      "href",
      "/website/author/2"
    );

    // Checking user email
    await expect(nouseUsers.locator("a").nth(1)).toHaveText(
      "jane.doe@nouse.co.uk"
    );

    // Checking link to user email
    await expect(nouseUsers.locator("a").nth(1)).toHaveAttribute(
      "href",
      "mailto:jane.doe@nouse.co.uk"
    );

    await expect(page.locator("#muse >> .user")).toHaveCount(0);
    await expect(page.locator("#behind-the-scenes >> .user")).toHaveCount(0);
  });
});
