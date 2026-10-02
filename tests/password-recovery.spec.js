import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/candidate/auth/me', route => route.fulfill({ status: 401 }))
})

test('recovery sends only the email and shows delivery errors', async ({ page }) => {
  let loginRequests = 0
  await page.route('**/api/candidate/auth/login', route => { loginRequests++; return route.fulfill({ status: 401 }) })
  await page.route('**/api/candidate/auth/forgot-password', route => {
    expect(route.request().postDataJSON()).toEqual({ email: 'candidate@example.com' })
    expect(route.request().headers()['x-csrf-token']).toBeUndefined()
    return route.fulfill({ json: { message: 'Nếu email liên kết với tài khoản, bạn sẽ nhận được hướng dẫn.' } })
  })
  await page.goto('/login')
  await page.getByRole('button', { name: 'Quên mật khẩu?' }).click()
  await page.getByRole('dialog').getByLabel('Email', { exact: true }).fill('candidate@example.com')
  await page.getByRole('button', { name: 'Gửi yêu cầu khôi phục' }).click()
  await expect(page.getByRole('dialog').getByRole('status')).toContainText('bạn sẽ nhận được hướng dẫn')
  expect(loginRequests).toBe(0)
  await page.route('**/api/candidate/auth/forgot-password', route => route.fulfill({ status: 500 }))
  await page.getByRole('button', { name: 'Gửi yêu cầu khôi phục' }).click()
  await expect(page.getByRole('dialog').getByRole('status')).toContainText('Máy chủ đang gặp sự cố')
})

test('reset validates confirmation, handles expired token and completes reset', async ({ page }) => {
  let requests = 0
  await page.route('**/api/candidate/auth/reset-password', route => {
    requests++
    expect(route.request().postDataJSON()).toEqual({ token: 'reset-token', password: 'newpassword123', confirmPassword: 'newpassword123' })
    return route.fulfill({ status: 400, json: { detail: 'Liên kết đã hết hạn.' } })
  })
  await page.goto('/reset-password#token=reset-token')
  await page.getByLabel('Mật khẩu mới', { exact: true }).fill('newpassword123')
  await page.getByLabel('Xác nhận mật khẩu mới').fill('different123')
  await page.getByRole('button', { name: 'Cập nhật mật khẩu' }).click()
  await expect(page.getByRole('alert')).toHaveText('Mật khẩu xác nhận không khớp.')
  expect(requests).toBe(0)
  await page.getByLabel('Xác nhận mật khẩu mới').fill('newpassword123')
  await page.getByRole('button', { name: 'Cập nhật mật khẩu' }).click()
  await expect(page.getByRole('alert')).toHaveText('Liên kết đã hết hạn.')
  await page.route('**/api/candidate/auth/reset-password', route => route.fulfill({ status: 204 }))
  await page.getByRole('button', { name: 'Cập nhật mật khẩu' }).click()
  await expect(page.getByRole('status')).toContainText('Mật khẩu đã được cập nhật')
  await expect(page).toHaveURL(/\/reset-password$/)
  await page.getByRole('link', { name: 'Quay lại đăng nhập' }).click()
  await expect(page.locator('#password')).toBeVisible()
})

test('reset requires a recovery link', async ({ page }) => {
  await page.goto('/reset-password')
  await expect(page.getByRole('alert')).toContainText('Liên kết khôi phục không hợp lệ')
  await expect(page.getByRole('button', { name: 'Cập nhật mật khẩu' })).toHaveCount(0)
})
