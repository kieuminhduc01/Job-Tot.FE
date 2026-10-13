import { test, expect } from '@playwright/test';
import { seedTokens } from './token-fixtures.js';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4n6D3HwAGfAKNNP+fVwAAAABJRU5ErkJggg==', 'base64');
test('avatar upload, replacement, failure and removal persist across reload', async ({ page }) => {
  await seedTokens(page);
  const profile = { fullName: 'Ứng viên Avatar', readyStatus: 'looking', gender: '', experiences: [], skills: [], education: [], certificates: [], projects: [], avatarUrl: null };
  let fail = false;
  let uploads = 0;
  await page.route('**/api/candidate/auth/me', route => route.fulfill({ json: { id: 'candidate', fullName: profile.fullName } }));
  await page.route('**/api/candidate/header', route => route.fulfill({ json: { messages: [], notifications: [] } }));
  await page.route('**/api/employer/auth/me', route => route.fulfill({ status: 401 }));
  await page.route('**/uploads/avatars/*.png', route => route.fulfill({ contentType: 'image/png', body: png }));
  await page.route('**/api/candidate/profile', route => route.fulfill({ json: { profile, cvs: [] } }));
  await page.route('**/api/candidate/profile/avatar', route => {
    expect(route.request().headers().authorization).toBe('Bearer test-access');
    if (fail) return route.fulfill({ status: 500, json: { detail: 'Không thể lưu ảnh' } });
    if (route.request().method() === 'DELETE') profile.avatarUrl = null;
    else { uploads++; profile.avatarUrl = `/uploads/avatars/${String(uploads).padStart(32, '0')}.png`; }
    return route.fulfill({ json: { profile, cvs: [] } });
  });
  await page.goto('/profile');
  for (const name of ['avatar.png', 'replacement.png']) {
    await page.getByRole('button', { name: 'Chỉnh sửa ảnh đại diện', exact: true }).click();
    await page.getByLabel('Chọn ảnh đại diện', { exact: true }).setInputFiles({ name, mimeType: 'image/png', buffer: png });
    await expect(page.getByAltText('Xem trước ảnh đại diện')).toBeVisible();
    await page.getByRole('button', { name: 'Lưu ảnh', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByAltText('Ảnh đại diện của bạn')).toBeVisible();
    await expect.poll(() => page.locator('.profile-avatar img').evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
    await page.reload();
    await expect(page.getByAltText('Ảnh đại diện của bạn')).toBeVisible();
  }
  expect(uploads).toBe(2);
  await page.getByRole('button', { name: 'Chỉnh sửa ảnh đại diện', exact: true }).click();
  await page.getByLabel('Chọn ảnh đại diện', { exact: true }).setInputFiles({ name: 'bad.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') });
  await expect(page.locator('.toast-region')).toContainText('Chọn ảnh PNG hoặc JPG tối đa 2 MB');
  await expect(page.getByRole('button', { name: 'Lưu ảnh', exact: true })).toBeDisabled();
  fail = true;
  await page.getByRole('button', { name: 'Xóa ảnh', exact: true }).click();
  await expect(page.locator('.toast-region')).toContainText('Không thể lưu ảnh');
  await expect(page.locator('.profile-avatar img')).toHaveAttribute('src', profile.avatarUrl);
  fail = false;
  await page.getByRole('button', { name: 'Xóa ảnh', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByAltText('Ảnh đại diện của bạn')).toHaveCount(0);
  await page.reload();
  await expect(page.getByAltText('Ảnh đại diện của bạn')).toHaveCount(0);
});
