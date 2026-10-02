import { test, expect } from '@playwright/test'
import { seedTokens } from './token-fixtures.js'

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

test('candidate edits and reloads profile, changes status and uploads CV', async ({ page }) => {
  await seedTokens(page)
  let stored = { fullName: 'Ứng viên kiểm thử', headline: '', location: '', birthDate: null, gender: '', summary: '', readyStatus: 'looking', expectedSalaryMin: null, expectedSalaryMax: null, desiredPosition: '', workType: '', desiredLocation: '', experiences: [], skills: [], education: [], certificates: [], projects: [] }
  const cvs = []
  await page.route('**/api/candidate/auth/me', route => route.fulfill({ json: { id: 'candidate', fullName: stored.fullName } }))
  await page.route('**/api/candidate/profile', async route => {
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
  await page.getByLabel('Tiêu đề', { exact: true }).fill('Frontend Engineer')
  await page.getByLabel('Tổ chức / Vai trò').fill('Job Tốt')
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect(page.getByRole('heading', { name: 'Frontend Engineer', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Frontend Engineer', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Cân nhắc', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Cân nhắc', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.locator('input[type=file]').setInputFiles({ name: 'resume.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7\n') })
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
