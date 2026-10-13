import { test, expect } from '@playwright/test';
import { seedTokens, tokenSession } from './token-fixtures.js';

test('profile can promote and demote a CV through the private API', async ({ page }) => {
  await seedTokens(page);
  await page.route('**/api/candidate/auth/me', route => route.fulfill({ json: tokenSession().account }));
  await page.route('**/api/employer/auth/me', route => route.fulfill({ status: 401 }));
  await page.route('**/api/candidate/header', route => route.fulfill({ json: { messages: [], notifications: [] } }));
  const cvs = [{ id: 'cv-one', title: 'one.pdf', isDefault: true }, { id: 'cv-two', title: 'two.pdf', isDefault: false }];
  await page.route('**/api/candidate/profile', route => route.fulfill({ json: { profile: { fullName: 'Test Candidate', experiences: [], skills: [], education: [], certificates: [], projects: [] }, cvs } }));
  await page.route('**/api/candidate/profile/cvs/*/default', route => {
    const id = new URL(route.request().url()).pathname.split('/').at(-2);
    const { isDefault } = route.request().postDataJSON();
    for (const cv of cvs) { if (isDefault || cv.id === id) cv.isDefault = cv.id === id && isDefault; }
    return route.fulfill({ json: cvs });
  });
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Đặt làm CV chính', exact: true }).click();
  await expect(page.locator('.cv-document').filter({ hasText: 'two.pdf' })).toContainText('CV chính');
  await expect(page.locator('.cv-document').filter({ hasText: 'one.pdf' })).toContainText('CV bổ sung');
  await page.getByRole('button', { name: 'Đặt làm CV bổ sung', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Đặt làm CV chính', exact: true })).toHaveCount(2);
});

test('updating the session avatar does not restart the profile request', async ({ page }) => {
  await seedTokens(page);
  const avatarUrl = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="green"/></svg>';
  await page.route('**/api/candidate/auth/me', route => route.fulfill({ json: { ...tokenSession().account, avatarUrl } }));
  await page.route('**/api/employer/auth/me', route => route.fulfill({ status: 401 }));
  await page.route('**/api/candidate/header', route => route.fulfill({ json: { avatarUrl, messages: [], notifications: [] } }));
  const profile = { fullName: 'Test Candidate', avatarUrl, readyStatus: 'looking', experiences: [], skills: [], education: [], certificates: [], projects: [] };
  let calls = 0;
  await page.route('**/api/candidate/profile', route => { calls += 1; return route.fulfill({ json: { profile, cvs: [] } }); });
  await page.route('**/api/candidate/profile/avatar', route => route.fulfill({ json: { profile: { ...profile, avatarUrl: null }, cvs: [] } }));
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Chỉnh sửa ảnh đại diện', exact: true }).click();
  expect(calls).toBe(1);
  await page.getByRole('button', { name: 'Xóa ảnh', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('header .header-user-avatar img')).toHaveCount(0);
  await page.waitForTimeout(150);
  expect(calls).toBe(1);
});

test('session avatar appears without opening profile even if notifications fail', async ({ page }) => {
  await seedTokens(page);
  const avatarUrl = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="green"/></svg>';
  await page.route('**/api/candidate/auth/me', route => route.fulfill({ json: { ...tokenSession().account, avatarUrl } }));
  await page.route('**/api/employer/auth/me', route => route.fulfill({ status: 401 }));
  await page.route('**/api/candidate/header', route => route.fulfill({ status: 500 }));
  await page.route('**/api/candidate/messages', route => route.fulfill({ json: [] }));
  let profileCalls = 0;
  page.on('request', request => { if (new URL(request.url()).pathname === '/api/candidate/profile') profileCalls += 1; });
  await page.goto('/messages');
  await expect(page.locator('header').getByAltText('Avatar của Test Candidate')).toHaveAttribute('src', avatarUrl);
  await expect(page.locator('header').getByAltText('Avatar của Test Candidate')).toBeVisible();
  expect(profileCalls).toBe(0);
});

test('signed-in header shows avatar, real badges and readable responsive notifications', async ({ page }) => {
  await seedTokens(page);
  await page.route('**/api/candidate/auth/me', route => route.fulfill({ json: tokenSession().account }));
  await page.route('**/api/employer/auth/me', route => route.fulfill({ status: 401 }));
  await page.route('**/api/candidate/messages', route => route.fulfill({ json: [] }));
  let calls = 0;
  let isRead = false;
  await page.route('**/api/candidate/header/read', route => {
    expect(route.request().postDataJSON()).toEqual({ ids: ['notice-1'] });
    isRead = true;
    return route.fulfill({ status: 204 });
  });
  await page.route('**/api/candidate/header', route => {
    calls += 1;
    return route.fulfill({ json: {
      avatarUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="orange"/></svg>',
      messages: [{ conversationId: 'chat-1', sentAt: new Date().toISOString() }],
      notifications: [{ isRead, id: 'notice-1', kind: 'view', title: 'Hồ sơ đã được xem', text: 'Test Company đã xem hồ sơ của bạn.', at: new Date().toISOString(), href: '/my-jobs' }],
    } });
  });
  await page.goto('/messages');
  const header = page.locator('header');
  await expect(header.getByAltText('Avatar của Test Candidate')).toBeVisible();
  await expect(header.getByRole('button', { name: 'Thông báo', exact: true })).toContainText('1');
  expect(calls).toBe(1);
  await header.getByRole('link', { name: 'Kho tiện ích', exact: true }).click();
  await expect(page).toHaveURL(/\/tools$/);
  await expect(header.getByAltText('Avatar của Test Candidate')).toBeVisible();
  expect(calls).toBe(1);
  await header.getByRole('link', { name: 'Tin nhắn', exact: true }).last().click();
  await expect(page).toHaveURL(/\/messages$/);
  expect(calls).toBe(1);
  await header.getByRole('button', { name: 'Thông báo', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Danh sách thông báo' })).toContainText('Test Company');
  await page.getByRole('button', { name: 'Đánh dấu tất cả đã đọc' }).click();
  await expect(header.getByRole('button', { name: 'Thông báo', exact: true }).locator('.header-action-count')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('region', { name: 'Danh sách thông báo' })).toHaveCount(0);
  await page.reload();
  await expect(header.getByAltText('Avatar của Test Candidate')).toBeVisible();
  await expect(header.getByRole('button', { name: 'Thông báo', exact: true }).locator('.header-action-count')).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await header.getByRole('button', { name: 'Thông báo', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/header-notifications-mobile.png' });
  await page.setViewportSize({ width: 1284, height: 900 });
  await page.screenshot({ path: 'test-results/header-notifications-desktop.png' });
  await header.getByRole('link', { name: 'Tin nhắn', exact: true }).last().click();
  await expect(page).toHaveURL(/\/messages$/);
});
