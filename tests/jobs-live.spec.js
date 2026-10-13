import { test, expect } from '@playwright/test';

test('live jobs page reads SQL-backed API through the Vite proxy', async ({ page, request }) => {
  test.skip(!process.env.JOBTOT_LIVE_API, 'Run with JOBTOT_LIVE_API=1 and the API/database available.');
  const apiResponse = await request.get('/api/jobs?page=1&pageSize=6');
  expect(apiResponse.ok()).toBe(true);
  const initial = await apiResponse.json();
  expect(initial.totalCount).toBeGreaterThan(0);
  await page.goto('/jobs');
  await expect(page.locator('.job-listing-card')).toHaveCount(initial.items.length);
  await expect(page.locator('.job-listing-card').first()).toContainText(initial.items[0].companyName);
  await expect(page.locator('.job-directory-pagination')).toContainText(initial.totalCount.toLocaleString('vi-VN'));
  await page.setViewportSize({ width: 1284, height: 1000 });
  await page.screenshot({ path: 'test-results/jobs-live-desktop.png', fullPage: true });
  const companyName = initial.items[0].companyName;
  await page.getByRole('textbox', { name: 'Từ khóa công việc' }).fill(companyName);
  const searchResponse = page.waitForResponse(response => {
    const url = new URL(response.url());
    return url.pathname === '/api/jobs' && url.searchParams.get('keyword') === companyName;
  });
  await page.getByRole('button', { name: 'Tìm việc ngay' }).click();
  const searched = await searchResponse;
  expect(searched.ok()).toBe(true);
  const filtered = await searched.json();
  expect(filtered.totalCount).toBeGreaterThan(0);
  await expect(page.locator('.job-listing-card')).toHaveCount(filtered.items.length);
  for (const job of filtered.items) expect(job.companyName).toBe(companyName);
  await page.getByRole('button', { name: filtered.items[0].title, exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText(filtered.items[0].description);
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/jobs-live-mobile.png', fullPage: true });
});
