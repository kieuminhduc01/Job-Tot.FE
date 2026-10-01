import { test, expect } from '@playwright/test'

for (const path of ['/', '/login', '/register']) {
  test(`restored session skips authentication at ${path}`, async ({ page }) => {
    const account = { id: 'remembered-candidate', fullName: 'Remembered Candidate', accountType: 'Candidate' }
    let resolveSession
    const sessionReady = new Promise(resolve => { resolveSession = resolve })
    await page.route('**/api/candidate/auth/me', async route => {
      await sessionReady
      await route.fulfill({ json: account })
    })
    await page.goto(path)
    await expect(page.getByRole('status')).toHaveText('Đang kiểm tra phiên đăng nhập…')
    await expect(page.locator('#password')).toHaveCount(0)
    resolveSession()
    await expect(page).toHaveURL(/\/jobs$/)
    await expect(page.getByText(`Xin chào, ${account.fullName}`)).toBeVisible()
  })
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/candidate/auth/me', route => route.fulfill({ status: 401 }))
  await page.route('**/api/candidate/auth/csrf', route => route.fulfill({ json: { token: 'test-csrf', headerName: 'X-CSRF-TOKEN' } }))
  await page.route('**/api/candidate/auth/register', route => route.fulfill({ status: 409, json: { detail: 'Email hoặc số điện thoại đã được đăng ký.' } }))
  await page.route('**/api/candidate/auth/login', route => route.fulfill({ status: 401 }))
})

test('registration validation, password visibility, and honest submission state', async ({ page }) => {
  await page.setViewportSize({ width: 1284, height: 1000 })
  await page.goto('/register')
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'test-results/register-desktop.png', fullPage: true })
  await page.getByRole('button', { name: 'Đăng ký tài khoản miễn phí' }).click()
  await expect(page.getByText('Vui lòng nhập họ và tên (ít nhất 2 ký tự).')).toBeVisible()
  await page.getByLabel('Họ và tên').fill('Nguyễn Văn A')
  await page.getByLabel('Email hoặc số điện thoại').fill('candidate@example.com')
  await page.locator('#password').fill('example123')
  await page.locator('#confirmPassword').fill('different')
  await page.getByRole('button', { name: 'Đăng ký tài khoản miễn phí' }).click()
  await expect(page.getByText('Mật khẩu xác nhận chưa khớp.')).toBeVisible()
  await page.locator('#confirmPassword').fill('example123')
  await page.getByRole('button', { name: 'Hiện mật khẩu', exact: true }).click()
  await expect(page.locator('#password')).toHaveAttribute('type', 'text')
  await page.getByRole('button', { name: 'Đăng ký tài khoản miễn phí' }).click()
  await expect(page.getByRole('status')).toContainText('đã được đăng ký')
  await page.getByRole('tab', { name: 'Nhà tuyển dụng' }).click()
  await expect(page).toHaveURL(/role=employer/)
  await expect(page.locator('#password')).toHaveValue('')
})

test('login, remember checkbox, recovery and mobile layout', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewportSize({ width: 1284, height: 1000 })
  await page.goto('/login')
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'test-results/login-desktop.png', fullPage: true })
  await page.getByLabel('Email hoặc Số điện thoại').fill('candidate@example.com')
  await page.locator('#password').fill('example123')
  await page.getByRole('checkbox').check()
  await expect(page.getByRole('checkbox')).toBeChecked()
  await page.getByRole('button', { name: 'Đăng nhập ngay' }).click()
  await expect(page.getByRole('status')).toContainText('mật khẩu không đúng')
  await page.getByRole('button', { name: 'Quên mật khẩu?' }).click()
  await page.getByRole('dialog').getByLabel('Email', { exact: true }).fill('candidate@example.com')
  await page.getByRole('button', { name: 'Gửi yêu cầu khôi phục' }).click()
  await expect(page.getByRole('dialog').getByRole('status')).toContainText('Chưa có email nào được gửi')
  await page.keyboard.press('Escape')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/register')
  await page.screenshot({ path: 'test-results/register-mobile.png', fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await expect(page.getByRole('button', { name: 'Đăng ký tài khoản miễn phí' })).toBeVisible()
  expect(errors).toEqual([])
})

for (const mode of ['login', 'register']) {
  test(`${mode}: submits candidate payload, restores session and logs out`, async ({ page }) => {
    const account = { id: 'candidate-1', fullName: 'Nguyễn Văn A', accountType: 'Candidate' }
    let authenticated = false
    await page.route('**/api/candidate/auth/me', route => route.fulfill(authenticated ? { json: account } : { status: 401 }))
    await page.route(`**/api/candidate/auth/${mode}`, async route => {
      const request = route.request()
      expect(request.headers()['x-csrf-token']).toBe('test-csrf')
      expect(request.postDataJSON()).toEqual(mode === 'register'
        ? { fullName: account.fullName, emailOrPhone: 'candidate@example.com', password: 'example123', confirmPassword: 'example123' }
        : { emailOrPhone: 'candidate@example.com', password: 'example123', rememberMe: true })
      authenticated = true
      await route.fulfill({ status: mode === 'register' ? 201 : 200, json: { account, expiresAt: '2027-01-01T00:00:00Z' } })
    })
    await page.route('**/api/candidate/auth/logout', async route => {
      expect(route.request().headers()['x-csrf-token']).toBe('test-csrf')
      authenticated = false
      await route.fulfill({ status: 204 })
    })
    await page.goto(`/${mode}`)
    if (mode === 'register') await page.locator('#fullName').fill(account.fullName)
    await page.locator('#identity').fill('candidate@example.com')
    await page.locator('#password').fill('example123')
    if (mode === 'register') await page.locator('#confirmPassword').fill('example123')
    else await page.getByRole('checkbox').check()
    await page.locator('button[type=submit]').click()
    await expect(page).toHaveURL(/\/jobs$/)
    await expect(page.getByText(`Xin chào, ${account.fullName}`)).toBeVisible()
    await page.reload()
    await expect(page.getByText(`Xin chào, ${account.fullName}`)).toBeVisible()
    await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click()
    await expect(page.getByRole('link', { name: 'Đăng nhập', exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('link', { name: 'Đăng nhập', exact: true })).toBeVisible()
  })
}

test('maps server validation and handles network failure and rate limiting', async ({ page }) => {
  await page.goto('/login')
  await page.locator('#identity').fill('candidate@example.com')
  await page.locator('#password').fill('example123')
  await page.route('**/api/candidate/auth/login', route => route.fulfill({ status: 400, json: { errors: { EmailOrPhone: ['Thông tin không hợp lệ.'] } } }))
  await page.locator('button[type=submit]').click()
  await expect(page.locator('#identity-error')).toHaveText('Thông tin không hợp lệ.')
  await page.route('**/api/candidate/auth/login', route => route.fulfill({ status: 429 }))
  await page.locator('button[type=submit]').click()
  await expect(page.getByRole('status')).toContainText('đợi một phút')
  await page.route('**/api/candidate/auth/csrf', route => route.abort())
  await page.locator('button[type=submit]').click()
  await expect(page.getByRole('status')).toContainText('Không thể kết nối')
  await expect(page.locator('button[type=submit]')).toBeEnabled()
})
