import { test, expect } from '@playwright/test';

test('tools hub reuses common resources and fits desktop and mobile', async ({ page }) => {
  await page.route('**/api/candidate/auth/me', route => route.fulfill({ status: 401 }));
  await page.goto('/tools');
  await expect(page.getByRole('heading', { name: 'Trung Tâm Tài Nguyên & Công Cụ Hỗ Trợ Ứng Viên Toàn Diện' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Đường dẫn' })).toContainText('Tiện ích');
  await expect(page.locator('.tools-hub-card')).toHaveCount(4);
  await expect(page.locator('.cv-templates')).toHaveCount(1);
  await expect(page.locator('.career-knowledge')).toHaveCount(1);
  await expect(page.locator('.career-tools')).toHaveCount(1);
  await expect(page.locator('header')).toHaveCount(1);
  await expect(page.locator('footer')).toHaveCount(1);
  await page.setViewportSize({ width: 1284, height: 1000 });
  await page.screenshot({ path: 'test-results/tools-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/tools-mobile.png', fullPage: true });
  await expect(page.getByRole('link', { name: 'Sử dụng công cụ', exact: true })).toHaveAttribute('href', '/tools/gross-net');
  await expect(page.getByRole('link', { name: 'Tính thuế TNCN ngay', exact: true })).toHaveAttribute('href', '/tools/income-tax');
  await expect(page.locator('.tools-hub-cv-card').getByRole('link')).toHaveAttribute('href', '/cv-templates');
  await page.locator('.tools-hub-cv-card').getByRole('link').click();
  await expect(page).toHaveURL(/\/cv-templates$/);
});

test('tool links open at the top and calculator breadcrumbs include the tools hub', async ({ page }) => {
  await page.route('**/api/candidate/auth/me', route => route.fulfill({ status: 401 }));
  await page.goto('/tools');
  await expect(page.locator('header').getByRole('button', { name: /AI Job/ })).toHaveCount(0);
  await page.locator('.career-tools').getByRole('link', { name: 'Dùng ngay', exact: true }).first().click();
  await expect(page).toHaveURL(/\/tools\/gross-net$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  for (const [path, current] of [
    ['/tools/gross-net', 'Tính lương Gross – Net 2026'],
    ['/tools/income-tax', 'Tính thuế thu nhập cá nhân 2026'],
    ['/tools/social-insurance', 'Tính BHXH một lần 2026'],
    ['/tools/unemployment-insurance', 'Tính bảo hiểm thất nghiệp 2026'],
  ]) {
    await page.goto(path);
    const breadcrumb = page.getByRole('navigation', { name: 'Đường dẫn' });
    await expect(breadcrumb.getByRole('link', { name: 'Trang chủ', exact: true })).toHaveAttribute('href', '/');
    await expect(breadcrumb.getByRole('link', { name: 'Tiện ích', exact: true })).toHaveAttribute('href', '/tools');
    await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText(current);
  }
});
