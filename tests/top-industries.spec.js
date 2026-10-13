import { test, expect } from '@playwright/test';

const industries = Array.from({ length: 18 }, (_, index) => ({ id: `industry-${index}`, name: index === 0 ? 'Công nghệ thông tin' : `Kinh doanh ${index}`, openJobs: 20 - index, newJobs: 3, salaryMin: 12000000, salaryMax: 35000000 }));
const jobs = Array.from({ length: 4 }, (_, index) => ({ id: `job-${index}`, companyId: 'company-1', title: 'Senior DevOps / Data Engineer', companyName: 'Panasonic R&D Center Việt Nam', salaryMin: 35000000, salaryMax: 55000000, location: 'Hà Nội', experienceLevel: '1-3', employmentType: 'full-time', createdAt: '2026-10-04T00:00:00Z' }));
async function setup(page) {
  const counts = { overview: 0, metadata: 0, jobs: 0 };
  await page.route('**/api/industries/overview', route => { counts.overview++; return route.fulfill({ json: industries }); });
  await page.route('**/api/companies/filters', route => { counts.metadata++; return route.fulfill({ json: { stats: { openJobs: 150, hiringCompanies: 20 }, provinces: [{ id: 'hanoi', name: 'Hà Nội' }] } }); });
  await page.route('**/api/candidate/auth/me', route => route.fulfill({ status: 401 }));
  await page.route(/\/api\/jobs\?.*$/, route => { counts.jobs++; return route.fulfill({ json: { items: jobs, totalCount: 4 } }); });
  return counts;
}
test('loads once under StrictMode and renders shared resources without mobile overflow', async ({ page }) => {
  const counts = await setup(page);
  await page.goto('/top-industries');
  await expect(page.locator('.ti-industry')).toHaveCount(8);
  await expect(page.locator('.ti-jobs .job-listing-card')).toHaveCount(4);
  expect(counts).toEqual({ overview: 1, metadata: 1, jobs: 1 });
  await expect(page.locator('header')).toBeVisible();
  await expect(page.locator('footer')).toHaveCount(1);
  await expect(page.getByRole('navigation', { name: 'Đường dẫn' })).toContainText('Top ngành nghề');
  await expect(page.getByRole('heading', { name: /Kho mẫu CV/ })).toHaveCount(1);
  await expect(page.getByRole('heading', { name: /Cẩm nang & Báo cáo/ })).toHaveCount(1);
  await expect(page.getByRole('heading', { name: /Kho tiện ích/ })).toHaveCount(1);
  await page.setViewportSize({ width: 1284, height: 950 });
  await page.screenshot({ path: 'test-results/top-industries-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/top-industries-mobile.png', fullPage: true });
});
test('directory filters, expands and sends real IDs to job search', async ({ page }) => {
  await setup(page);
  await page.goto('/top-industries');
  await expect(page.locator('.ti-directory>a')).toHaveCount(15);
  await page.getByRole('button', { name: 'Xem tất cả 18 ngành' }).click();
  await expect(page.locator('.ti-directory>a')).toHaveCount(18);
  await page.getByRole('button', { name: 'Kỹ thuật & Công nghệ', exact: true }).click();
  await expect(page.locator('.ti-directory>a')).toHaveCount(1);
  await expect(page.locator('.ti-directory>a')).toHaveAttribute('href', '/jobs?industryId=industry-0');
  await page.getByRole('textbox', { name: 'Từ khóa công việc' }).fill('Developer');
  await page.getByRole('combobox', { name: 'Địa điểm', exact: true }).selectOption('hanoi');
  await page.getByRole('combobox', { name: 'Ngành nghề', exact: true }).selectOption('industry-0');
  await page.getByRole('button', { name: 'Tìm việc ngay', exact: true }).click();
  await expect(page).toHaveURL(/\/jobs\?keyword=Developer&provinceId=hanoi&industryId=industry-0/);
});
test('failed overview can be retried', async ({ page }) => {
  await setup(page);
  let failed = true;
  await page.route('**/api/industries/overview', route => failed ? route.fulfill({ status: 500 }) : route.fulfill({ json: industries }));
  await page.goto('/top-industries');
  await expect(page.getByRole('alert')).toContainText('Không thể tải');
  failed = false;
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.locator('.ti-industry')).toHaveCount(8);
});
