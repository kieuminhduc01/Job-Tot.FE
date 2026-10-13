import { test, expect } from '@playwright/test';
test('income tax calculator works with shared sections and fits mobile', async ({ page }) => {
  const requests = new Map();
  page.on('request', request => {
    if (new URL(request.url()).pathname.startsWith('/api/')) requests.set(request.url(), (requests.get(request.url()) || 0) + 1);
  });
  await page.route('**/api/candidate/auth/me', route => route.fulfill({ status: 401 }));
  await page.goto('/tools/income-tax');
  await expect(page.locator('.salary-main-value')).toContainText('257.500');
  await expect(page.locator('.salary-tax-table tbody tr')).toHaveCount(5);
  await expect(page.locator('.tax-comparison')).toContainText('710.000');
  for (const selector of ['header', 'footer', '.cv-templates', '.career-knowledge', '.career-tools']) await expect(page.locator(selector)).toHaveCount(1);
  await page.getByRole('textbox', {name:'Tổng thu nhập trước thuế (Lương Gross)',exact:true}).fill('35000000');
  await expect(page.locator('.salary-stale')).toBeVisible();
  await page.getByRole('button', {name:/Tính thuế thu nhập cá nhân ngay/}).click();
  await expect(page.locator('.salary-main-value')).toContainText('481.250');
  await page.getByRole('textbox', {name:'Đóng góp từ thiện, nhân đạo và khuyến học',exact:true}).fill('730000');
  await page.getByRole('button', {name:/Tính thuế thu nhập cá nhân ngay/}).click();
  await expect(page.locator('.salary-main-value')).toContainText('444.750');
  await page.setViewportSize({width:1284,height:1000});
  await page.screenshot({path:'test-results/income-tax-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/income-tax-mobile.png',fullPage:true});
  // The app runs in StrictMode; no endpoint is requested twice and calculations stay local.
  for (const count of requests.values()) expect(count).toBe(1);
  expect([...requests.keys()].filter(url => !url.includes('/auth/me'))).toEqual([]);
});
