import { test, expect } from '@playwright/test'
import { seedTokens } from './token-fixtures.js'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/candidate/header', route => route.fulfill({ json: { messages: [], notifications: [] } }));
});

test('unauthenticated profile redirects to login without showing sample data', async ({ page }) => {
  let resolveSession
  const sessionReady = new Promise(resolve => { resolveSession = resolve })
  let profileRequests = 0
  await page.route('**/api/candidate/auth/me', async route => {
    await sessionReady
    await route.fulfill({ status: 401 })
  })
  await page.route('**/api/candidate/profile', route => {
    profileRequests += 1
    return route.fulfill({ status: 401 })
  })
  await page.goto('/profile')
  await expect(page.getByRole('status')).toContainText('Đang kiểm tra đăng nhập')
  await expect(page.locator('.profile-hero')).toHaveCount(0)
  await expect(page.getByText('Nguyễn Hoàng Nam', { exact: true })).toHaveCount(0)
  resolveSession()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.locator('.profile-hero')).toHaveCount(0)
  expect(profileRequests).toBe(0)
})

test('candidate edits and reloads profile and uploads CV', async ({ page }) => {
  await seedTokens(page)
  let profileLoads = 0
  let stored = { fullName: 'Ứng viên kiểm thử', headline: '', location: '', birthDate: null, gender: '', summary: '', readyStatus: 'looking', expectedSalaryMin: null, expectedSalaryMax: null, desiredPosition: '', workType: '', desiredLocation: '', experiences: [], skills: [], education: [], certificates: [], projects: [] }
  const cvs = []
  await page.route('**/api/candidate/auth/me', route => route.fulfill({ json: { id: 'candidate', fullName: stored.fullName } }))
  await page.route('**/api/candidate/profile', async route => {
    if (route.request().method() === 'GET') profileLoads += 1
    if (route.request().method() === 'PUT') {
      expect(route.request().headers().authorization).toBe('Bearer test-access')
      stored = route.request().postDataJSON()
    }
    await route.fulfill({ json: { profile: stored, email: 'candidate@example.com', phone: null, cvs } })
  })
  await page.route('**/api/candidate/profile/cvs', async route => {
    expect(route.request().headers().authorization).toBe('Bearer test-access')
    cvs.push({ id: 'cv', title: 'resume.pdf', isDefault: true })
    await route.fulfill({ json: cvs[0] })
  })
  await page.goto('/profile')
  await page.getByRole('button', { name: 'Thêm kinh nghiệm', exact: true }).click()
  expect(profileLoads).toBe(1)
  await page.getByLabel('Tiêu đề', { exact: true }).fill('Frontend Engineer')
  await page.getByLabel('Tổ chức / Vai trò').fill('Job Tốt')
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect(page.getByRole('heading', { name: 'Frontend Engineer', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Frontend Engineer', exact: true })).toBeVisible()
  await expect(page.locator('.profile-status')).toHaveCount(0)
  await page.locator('input[type=file][accept="application/pdf,.pdf"]').setInputFiles({ name: 'resume.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7\n') })
  await expect(page.getByText('resume.pdf', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Chỉnh sửa Frontend Engineer' }).click()
  await page.getByRole('button', { name: 'Xóa mục' }).click()
  await expect(page.getByRole('heading', { name: 'Frontend Engineer', exact: true })).toHaveCount(0)
})

test('failed save retains the editor and candidate input', async ({ page }) => {
  await seedTokens(page)
  await page.route('**/api/candidate/auth/me', route => route.fulfill({ json: { id: 'candidate', fullName: 'Test' } }))
  await page.route('**/api/candidate/profile', route => route.fulfill(route.request().method() === 'PUT'
    ? { status: 500 }
    : { json: { profile: { fullName: 'Test', readyStatus: 'looking', experiences: [], skills: [], education: [], certificates: [], projects: [] }, cvs: [] } }))
  await page.goto('/profile')
  await page.getByRole('button', { name: 'Thêm kỹ năng', exact: true }).click()
  await page.getByLabel('Tiêu đề', { exact: true }).fill('React')
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByLabel('Tiêu đề', { exact: true })).toHaveValue('React')
  await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible()
})

test('preferences require catalog choices and persist province ID across reload', async ({ page }) => {
  await seedTokens(page)
  const provinceId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  let stored = { fullName: 'Ứng viên kiểm thử', readyStatus: 'looking', workType: '', desiredLocation: '', experiences: [], skills: [], education: [], certificates: [], projects: [] }
  let puts = 0
  let metadataRequests = 0
  await page.route('**/api/candidate/auth/me', route => route.fulfill({ json: { id: 'candidate', fullName: stored.fullName } }))
  await page.route('**/api/candidate/profile', route => {
    if (route.request().method() === 'PUT') { stored = route.request().postDataJSON(); puts += 1 }
    return route.fulfill({ json: { profile: stored, cvs: [] } })
  })
  await page.route('**/api/companies/filters', route => {
    metadataRequests += 1
    return route.fulfill({ json: { provinces: [{ id: provinceId, name: 'Thành phố Hà Nội', count: 0 }, { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', name: 'Tỉnh Đồng Nai', count: 3 }] } })
  })
  await page.goto('/profile')
  await page.getByRole('button', { name: 'Cập nhật tiêu chí', exact: true }).click()
  const workType = page.getByRole('combobox', { name: 'Hình thức làm việc', exact: true })
  const location = page.getByRole('combobox', { name: 'Địa điểm ưu tiên', exact: true })
  await expect(location).toBeEnabled()
  expect(metadataRequests).toBe(1)
  await expect(workType.locator('option')).toHaveText(['Chọn hình thức làm việc', 'Toàn thời gian', 'Bán thời gian', 'Làm việc từ xa', 'Kết hợp (Hybrid)'])
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  expect(puts).toBe(0)
  await workType.selectOption('Kết hợp (Hybrid)')
  await location.selectOption(provinceId)
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(stored).toMatchObject({ workType: 'Kết hợp (Hybrid)', desiredProvinceId: provinceId, desiredLocation: 'Thành phố Hà Nội' })
  await page.reload()
  await page.getByRole('button', { name: 'Cập nhật tiêu chí', exact: true }).click()
  await expect(workType).toHaveValue('Kết hợp (Hybrid)')
  await expect(location).toHaveValue(provinceId)
  await page.getByRole('button', { name: 'Hủy', exact: true }).click()
  await page.getByRole('button', { name: 'Chỉnh sửa thông tin cá nhân' }).click()
  const address = page.getByRole('combobox', { name: 'Địa chỉ', exact: true })
  const gender = page.getByRole('combobox', { name: 'Giới tính', exact: true })
  await expect(address).toBeEnabled()
  await expect(gender.locator('option')).toHaveText(['Chọn giới tính', 'Nam', 'Nữ', 'Khác'])
  await address.selectOption(provinceId)
  await gender.selectOption('Nữ')
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(stored).toMatchObject({ provinceId, location: 'Thành phố Hà Nội', gender: 'Nữ' })
  await page.reload()
  await page.getByRole('button', { name: 'Chỉnh sửa thông tin cá nhân' }).click()
  await expect(address).toHaveValue(provinceId)
  await expect(gender).toHaveValue('Nữ')
})

test('shared date picker displays dd/mm/yyyy, rejects invalid days and saves ISO values', async ({ page }) => {
  await seedTokens(page);
  await page.route('**/api/candidate/auth/me', route => route.fulfill({ json: { id: 'date-candidate', fullName: 'Date candidate' } }));
  let saves = 0;
  await page.route('**/api/companies/filters', route => route.fulfill({ json: { provinces: [{ id: 'date-province', name: 'H? N?i' }] } }));
  let profile = { provinceId: 'date-province', location: 'H? N?i', gender: 'Nam', fullName: 'Date candidate', birthDate: '1990-01-02', readyStatus: 'looking', experiences: [], skills: [], education: [], certificates: [], projects: [] };
  await page.route('**/api/candidate/profile', route => {
    if (route.request().method() === 'PUT') { saves++; profile = route.request().postDataJSON(); }
    return route.fulfill({ json: { profile, cvs: [] } });
  });
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Chỉnh sửa thông tin cá nhân', exact: true }).click();
  const input = page.getByLabel('Ngày sinh', { exact: true });
  await expect(input).toHaveValue('02/01/1990');
  await input.fill('31/02/2000');
  await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
  expect(saves).toBe(0);
  await input.fill('29/02/2000');
  await page.getByRole('dialog').getByRole('button', { name: /Chọn ngày:/ }).click();
  await expect(page.locator('.date-picker-panel')).toBeVisible();
  await expect(page.locator('.date-picker-panel').getByRole('button', { name: '29/02/2000', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.date-picker-panel').screenshot({ path: 'test-results/shared-date-picker-mobile.png' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('.date-picker-panel').getByRole('button', { name: 'Xong', exact: true }).click();
  await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(profile.birthDate).toBe('2000-02-29');
});
