import { test, expect } from '@playwright/test';

async function setup(page, signedIn = true) {
  if (signedIn) await page.addInitScript(() => sessionStorage.setItem('jobtot.admin.session', JSON.stringify({ accessToken: 'admin-token', fullName: 'Admin', expiresAt: '2099-01-01T00:00:00Z' })));
  await page.route('**/api/candidate/auth/me', route => route.fulfill({ status: 401 }));
  await page.route('**/api/employer/auth/me', route => route.fulfill({ status: 401 }));
  const calls = { me: 0, companies: 0, users: 0, industries: 0 };
  const companies = [{ id: 'company-one', name: 'Acme', legalName: 'Acme Ltd', email: 'hr@acme.test', taxCode: '0101234567', addressLine: 'Hà Nội', verificationStatus: 'Pending', status: 'Active' }];
  const users = [{ id: 'candidate-one', fullName: 'Test Candidate', email: 'candidate@test.com', accountType: 'Candidate', status: 'Active' }, { id: 'admin-one', fullName: 'Admin', email: 'admin@test.com', accountType: 'Admin', status: 'Active' }];
  const industries = [{ id: 'industry-one', name: 'Công nghệ thông tin', status: 'Active', companyCount: 1 }];
  await page.route('**/api/admin/auth/me', route => {
    calls.me += 1;
    expect(route.request().headers().authorization).toBe('Bearer admin-token');
    return route.fulfill({ json: { id: 'admin-one', fullName: 'Admin', accountType: 'Admin' } });
  });
  await page.route('**/api/admin/auth/login', route => route.fulfill({ json: { accessToken: 'admin-token', fullName: 'Admin', expiresAt: '2099-01-01T00:00:00Z' } }));
  await page.route('**/api/admin/auth/logout', route => route.fulfill({ status: 204 }));
  for (const [section, rows] of Object.entries({ companies, users, industries })) {
    await page.route(`**/api/admin/${section}?*`, route => {
      calls[section] += 1;
      const query = new URL(route.request().url()).searchParams;
      const filtered = rows.filter(row => (!query.get('status') || row.status === query.get('status'))
        && (!query.get('keyword') || (row.name || row.fullName).includes(query.get('keyword'))));
      return route.fulfill({ json: { items: filtered, total: filtered.length, page: 1, size: 20 } });
    });
  }
  return { calls, companies, users, industries };
}

test('admin login and initial company requests run once under StrictMode; verifies company', async ({ page }, testInfo) => {
  const { calls, companies } = await setup(page, false);
  let updates = 0;
  await page.route('**/api/admin/companies/company-one/verification', route => {
    updates += 1;
    expect(route.request().headers().authorization).toBe('Bearer admin-token');
    companies[0].verificationStatus = route.request().postDataJSON().verificationStatus;
    return route.fulfill({ status: 204 });
  });
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Đăng nhập quản trị' })).toBeVisible();
  expect(calls.me).toBe(0); expect(calls.companies).toBe(0);
  await page.getByLabel('Email hoặc số điện thoại').fill('admin@test.com');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('admin-password123');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Acme hr@acme.test' })).toBeVisible();
  expect(calls.me).toBe(1); expect(calls.companies).toBe(1);
  await page.screenshot({ path: testInfo.outputPath('admin-companies-desktop.png'), animations: 'disabled' });
  await page.getByRole('button', { name: 'Xem & xác minh' }).click();
  await expect(page.getByRole('dialog')).toContainText('Acme Ltd');
  await page.getByLabel('Kết quả xác minh').selectOption('Verified');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Đã xác minh', exact: true })).toBeVisible();
  expect(updates).toBe(1);
  const notice = page.locator('.app-toast-success').filter({ hasText: 'Đã cập nhật thành công.' });
  await expect(notice).toBeVisible();
  await expect(page.locator('.admin-main .admin-notice')).toHaveCount(0);
  await notice.getByRole('button', { name: 'Đóng thông báo' }).click();
  await expect(notice).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: testInfo.outputPath('admin-companies-mobile.png'), animations: 'disabled' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('company deactivation requires confirmation, and can be reversed', async ({ page }) => {
  const { companies } = await setup(page);
  let updates = 0;
  await page.route('**/api/admin/companies/company-one/status', route => {
    updates += 1;
    companies[0].status = route.request().postDataJSON().active ? 'Active' : 'Inactive';
    return route.fulfill({ status: 204 });
  });
  await page.goto('/admin/companies');
  await page.getByRole('button', { name: 'Ngừng hoạt động', exact: true }).click();
  await page.getByRole('button', { name: 'Hủy', exact: true }).click();
  expect(updates).toBe(0);
  await page.getByRole('button', { name: 'Ngừng hoạt động', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Ngừng hoạt động', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Kích hoạt', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Đang hoạt động', exact: true })).toBeVisible();
  expect(updates).toBe(2);
});

test('users can change passwords and status, retaining password form on API failure', async ({ page }) => {
  const { calls, users } = await setup(page);
  let passwords = 0;
  await page.route('**/api/admin/users/candidate-one/password', route => {
    passwords += 1;
    expect(route.request().postDataJSON().password).toBe('new-password123');
    return passwords === 1 ? route.fulfill({ status: 500, json: { detail: 'Không thể lưu mật khẩu' } }) : route.fulfill({ status: 204 });
  });
  await page.route('**/api/admin/users/candidate-one/status', route => {
    users[0].status = route.request().postDataJSON().active ? 'Active' : 'Inactive';
    return route.fulfill({ status: 204 });
  });
  await page.goto('/admin/users');
  const candidate = page.getByRole('row').filter({ hasText: 'Test Candidate' });
  await expect(candidate).toBeVisible();
  expect(calls.users).toBe(1); expect(calls.me).toBe(1);
  await expect(page.getByRole('row').filter({ hasText: 'admin@test.com' }).getByRole('button', { name: 'Ngừng hoạt động' })).toBeDisabled();
  await candidate.getByRole('button', { name: 'Đổi mật khẩu' }).click();
  await page.getByLabel('Mật khẩu mới').fill('new-password123');
  await page.getByLabel('Xác nhận mật khẩu').fill('different-password');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('không khớp'); expect(passwords).toBe(0);
  await page.getByLabel('Xác nhận mật khẩu').fill('new-password123');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Không thể lưu mật khẩu');
  await expect(page.getByLabel('Mật khẩu mới')).toHaveValue('new-password123');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await candidate.getByRole('button', { name: 'Ngừng hoạt động' }).click();
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(candidate).toContainText('Ngừng hoạt động');
  await page.getByRole('combobox', { name: 'Lọc trạng thái' }).selectOption('Inactive');
  await expect(page.getByRole('row').filter({ hasText: 'admin@test.com' })).toHaveCount(0);
});

test('industry creation, editing and status management use the private API', async ({ page }) => {
  const { industries, calls } = await setup(page);
  await page.route('**/api/admin/industries', route => {
    industries.push({ id: 'industry-two', name: route.request().postDataJSON().name, status: 'Active', companyCount: 0 });
    return route.fulfill({ status: 201, json: industries[1] });
  });
  await page.route('**/api/admin/industries/industry-two', route => {
    industries[1].name = route.request().postDataJSON().name;
    return route.fulfill({ status: 204 });
  });
  await page.route('**/api/admin/industries/industry-two/status', route => {
    industries[1].status = route.request().postDataJSON().active ? 'Active' : 'Inactive';
    return route.fulfill({ status: 204 });
  });
  await page.goto('/admin/industries');
  await expect(page.getByRole('cell', { name: 'Công nghệ thông tin', exact: true })).toBeVisible();
  expect(calls.industries).toBe(1);
  await page.getByRole('button', { name: 'Thêm nhóm ngành' }).click();
  await page.getByLabel('Tên nhóm ngành').fill('Tài chính');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  const row = page.getByRole('row').filter({ hasText: 'Tài chính' });
  await row.getByRole('button', { name: 'Sửa tên' }).click();
  await page.getByLabel('Tên nhóm ngành').fill('Tài chính ngân hàng');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await row.getByRole('button', { name: 'Ngừng hoạt động' }).click();
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(row).toContainText('Ngừng hoạt động');
  await page.getByRole('textbox', { name: 'Tìm kiếm', exact: true }).fill('Tài chính');
  await page.getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Công nghệ thông tin', exact: true })).toHaveCount(0);
});

test('expired admin authorization returns to login, and logout clears local session', async ({ page }) => {
  await setup(page);
  await page.route('**/api/admin/auth/me', route => route.fulfill({ status: 401 }));
  await page.goto('/admin/users');
  await expect(page.getByRole('heading', { name: 'Đăng nhập quản trị' })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('jobtot.admin.session'))).toBeNull();
  await page.unroute('**/api/admin/auth/me');
  await page.route('**/api/admin/auth/me', route => route.fulfill({ json: { id: 'admin-one', fullName: 'Admin', accountType: 'Admin' } }));
  await page.getByLabel('Email hoặc số điện thoại').fill('admin@test.com');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('admin-password123');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Đăng nhập quản trị' })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('jobtot.admin.session'))).toBeNull();
});
