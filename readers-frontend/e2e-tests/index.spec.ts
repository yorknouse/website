import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  // await page.goto('http://localhost:3000/website');
  await page.goto('./');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle('Welcome to Astro.');
});
