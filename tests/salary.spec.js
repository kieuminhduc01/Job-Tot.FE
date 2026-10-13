import { test, expect } from '@playwright/test';
test('calculates both directions, explains results and uses shared resources', async ({ page }) => {
  await page.route('**/api/candidate/auth/me', route => route.fulfill({ status: 401 }));
  await page.goto('/tools/gross-net');
  await expect(page.locator('.salary-main-value')).toContainText('26.629.000');
  await expect(page.locator('.salary-employer-total')).toContainText('37.050.000');
  await expect(page.locator('.salary-tax-table tbody tr')).toHaveCount(5);
  await expect(page.locator('.cv-templates')).toHaveCount(1);
  await expect(page.locator('.career-knowledge')).toHaveCount(1);
  await expect(page.locator('.career-tools')).toHaveCount(1);
  await page.setViewportSize({ width: 1284, height: 1000 });
  await page.screenshot({ path: 'test-results/salary-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Lương NET sang GROSS', exact: true }).click();
  await page.getByRole('textbox', { name: 'Thu nhập thực nhận (Lương NET)', exact: true }).fill('26629000');
  await expect(page.locator('.salary-stale')).toBeVisible();
  await page.getByRole('button', { name: /QUY ĐỔI LƯƠNG NGAY/ }).click();
  await expect(page.locator('.salary-main-value')).toContainText('30.000.000');
  await expect(page.locator('.salary-stale')).toHaveCount(0);
  await page.getByRole('spinbutton', { name: 'Người phụ thuộc', exact: true }).fill('1.5');
  // Browser's step validation prevents submission of a fractional count.
  expect(await page.getByRole('spinbutton', { name: 'Người phụ thuộc', exact: true }).evaluate(input => input.validity.stepMismatch)).toBe(true);
  await page.getByRole('spinbutton', { name: 'Người phụ thuộc', exact: true }).fill('1');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/salary-mobile.png', fullPage: true });
  await expect(page.locator('.career-tools a[href="/tools/gross-net"]')).toHaveCount(1);
});
