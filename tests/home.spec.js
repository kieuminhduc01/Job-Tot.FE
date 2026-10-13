import { test, expect } from '@playwright/test';

const company = { id: 'company-1', name: 'Công ty Công nghệ Việt', industry: 'Công nghệ', province: 'Hà Nội', openJobCount: 1, isVerified: true, hiringTitles: ['Kỹ sư phần mềm'] };

test('home reuses directory resources and supports search and company jobs navigation', async ({ page }) => {
  await page.route('**/api/candidate/auth/me', route => route.fulfill({ status: 401 }));
  await page.route('**/api/companies/filters', route => route.fulfill({ json: {
    stats: { totalCompanies: 1, openJobs: 1 }, provinces: [{ id: 'hanoi', name: 'Hà Nội' }], industries: [{ id: 'tech', name: 'Công nghệ' }],
  } }));
  await page.route('**/api/companies/featured', route => route.fulfill({ json: [company] }));
  await page.route(/\/api\/companies\?/, route => route.fulfill({ json: { items: [company], totalCount: 1 } }));
  await page.route('**/api/jobs?**', route => route.fulfill({ json: { items: [{ id: 'job-1', companyId: company.id, title: 'Kỹ sư phần mềm', location: 'Hà Nội', salaryMin: 25000000, createdAt: new Date().toISOString() }], totalCount: 1 } }));
  await page.goto('/');
  await expect(page).toHaveURL('/');
  await expect(page.locator('header')).toHaveCount(1);
  await expect(page.locator('footer')).toHaveCount(1);
  await expect(page.locator('.cv-templates')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Cẩm nang & Báo cáo thị trường tuyển dụng 2026' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Kho tiện ích hỗ trợ ứng viên chuẩn 2026' })).toBeVisible();
  await expect(page.locator('.home-job-card')).toContainText('Kỹ sư phần mềm');
  await page.setViewportSize({ width: 1284, height: 1000 });
  await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Remote / Hybrid' }).click();
  await expect(page.getByRole('heading', { name: 'Chưa có việc làm phù hợp' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Từ khóa công việc' }).fill('phần mềm');
  const request = page.waitForRequest(request => request.url().includes('/api/jobs?') && new URL(request.url()).searchParams.get('keyword') === 'phần mềm');
  await page.getByRole('button', { name: 'Tìm việc ngay' }).click();
  await request;
  await expect(page.locator('.home-job-card')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });
  await page.locator('.company-featured-grid .company-primary').click();
  await expect(page).toHaveURL('/companies/company-1#company-open-jobs');
  await expect(page.locator('#company-open-jobs')).toContainText('Kỹ sư phần mềm');
  await page.locator('header').getByRole('link', { name: 'Job Tốt — Trang chủ' }).click();
  await expect(page).toHaveURL('/');
});
