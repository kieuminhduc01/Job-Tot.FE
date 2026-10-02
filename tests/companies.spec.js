import { test, expect } from '@playwright/test';
import { seedTokens, tokenSession } from './token-fixtures.js';

const companies = ['CÔNG TY TNHH PANASONIC R&D CENTER VIỆT NAM', 'SHOPEE VIỆT NAM – SPX LOGISTICS', 'NGÂN HÀNG TMCP VIỆT NAM THỊNH VƯỢNG', 'TẬP ĐOÀN VINGROUP'].map((name, index) => ({
  id: `company-${index}`, name, description: 'Môi trường làm việc chuyên nghiệp',
  industry: ['Công nghệ thông tin', 'Thương mại điện tử', 'Ngân hàng', 'Đa lĩnh vực'][index],
  province: 'Hà Nội', address: 'Quận Cầu Giấy', sizeMin: 500, sizeMax: 1000,
  logoUrl: null, coverUrl: null, isVerified: true, openJobCount: [42, 86, 105, 64][index],
  hiringTitles: ['Cloud Platform Engineer', 'Chuyên viên phát triển sản phẩm'],
}));
const metadata = {
  stats: { totalCompanies: 22, verifiedCompanies: 18, hiringCompanies: 12, openJobs: 78 },
  provinces: [{ id: 'hanoi', name: 'Hà Nội', count: 12 }, { id: 'hcm', name: 'TP. Hồ Chí Minh', count: 10 }],
  industries: [{ id: 'tech', name: 'Công nghệ thông tin', count: 12 }],
};

async function setup(page, authenticated = false) {
  if (authenticated) await seedTokens(page);
  await page.route('**/api/candidate/auth/me', route => route.fulfill(authenticated ? { json: tokenSession().account } : { status: 401 }));
  await page.route('**/api/candidate/followed-companies', route => route.fulfill({ json: [] }));
  await page.route('**/api/companies/filters', route => route.fulfill({ json: metadata }));
  await page.route('**/api/companies/featured', route => route.fulfill({ json: companies }));
  await page.route(/\/api\/companies\?.*$/, route => {
    const url = new URL(route.request().url());
    const pageNumber = Number(url.searchParams.get('page')) || 1;
    const filtered = url.searchParams.has('keyword');
    const items = filtered ? [companies[1]] : Array.from({ length: pageNumber === 3 ? 2 : 10 }, (_, index) => ({
      ...companies[index % 4], id: `listing-${(pageNumber - 1) * 10 + index}`, name: `${companies[index % 4].name}${index > 3 ? ` – Chi nhánh ${index}` : ''}`,
    }));
    return route.fulfill({ json: { items, totalCount: filtered ? 1 : 22, page: pageNumber, pageSize: 10 } });
  });
}

test('public company directory reuses the guest header and renders desktop and mobile', async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 1284, height: 1000 });
  await page.goto('/companies');
  await expect(page.getByRole('heading', { name: 'Khám phá doanh nghiệp & Nhà tuyển dụng hàng đầu' })).toBeVisible();
  await expect(page.locator('header').getByRole('link', { name: 'Đăng nhập', exact: true })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Đường dẫn' })).toContainText('Doanh nghiệp');
  await expect(page.locator('.company-list .company-card')).toHaveCount(10);
  await expect(page.locator('.company-featured-grid .company-card')).toHaveCount(4);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'test-results/companies-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/companies-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Bộ lọc', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Bộ lọc doanh nghiệp' })).toBeVisible();
  await page.locator('.company-featured-grid .company-follow').first().click();
  await expect(page.getByRole('status')).toContainText('Đăng nhập để theo dõi');
});

test('profile and companies render identical headers and footers on desktop and mobile', async ({ page }) => {
  await setup(page, true);
  await page.route('**/api/candidate/profile', route => route.fulfill({ json: {
    profile: { fullName: tokenSession().account.fullName, experiences: [], skills: [], education: [], certificates: [], projects: [] },
    cvs: [],
  } }));
  const footerAppearance = () => page.locator('footer').evaluate(footer =>
    [footer, ...footer.querySelectorAll('*')].map(element => {
      const styles = getComputedStyle(element);
      return { text: element.textContent, styles: Object.fromEntries(Array.from(styles, property => [property, styles.getPropertyValue(property)])) };
    }));
  for (const viewport of [{ width: 1284, height: 1000 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/profile');
    await expect(page.locator('.profile-hero')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const header = await page.locator('header').screenshot();
    const footer = await footerAppearance();
    await page.goto('/companies');
    await expect(page.locator('.company-list .company-card')).toHaveCount(10);
    await page.evaluate(() => document.fonts.ready);
    expect((await page.locator('header').screenshot()).equals(header), `Header at ${viewport.width}px`).toBe(true);
    expect(await footerAppearance(), `Footer at ${viewport.width}px`).toEqual(footer);
  }
});

test('search, filters, sorting and pagination are sent to the API and reflected in the URL', async ({ page }) => {
  await setup(page);
  await page.goto('/companies');
  await page.getByRole('button', { name: 'Trang 2', exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator('.company-results-footer')).toContainText('11 – 20');
  await page.getByRole('combobox', { name: 'Địa điểm', exact: true }).selectOption('hanoi');
  await expect(page).toHaveURL(/provinceId=hanoi/);
  expect(new URL(page.url()).searchParams.has('page')).toBe(false);
  const size = page.getByRole('radio', { name: 'Trên 1.000 nhân viên' });
  await size.click();
  await expect(size).toBeChecked();
  const verified = page.getByRole('checkbox', { name: 'Chỉ hiển thị doanh nghiệp đã xác thực' });
  await verified.click();
  await expect(verified).toBeChecked();
  await page.getByRole('button', { name: 'Nhiều việc làm nhất', exact: true }).click();
  await expect(page).toHaveURL(/sort=jobs/);
  await expect(page.locator('.company-sort button[aria-pressed="true"]')).toHaveCount(1);
  await expect(page.locator('.company-sort button').nth(1)).toHaveAttribute("aria-pressed", "true");
  await page.getByRole('textbox', { name: 'Từ khóa công ty' }).fill('Shopee');
  const request = page.waitForRequest(request => new URL(request.url()).pathname === '/api/companies' && new URL(request.url()).searchParams.get('keyword') === 'Shopee');
  await page.getByRole('button', { name: 'Tìm việc ngay', exact: true }).click();
  const url = new URL((await request).url());
  expect(url.searchParams.get('sort')).toBe('jobs');
  expect(url.searchParams.get('CompanySizeMin')).toBe('1001');
  expect(url.searchParams.has('CompanySizeMax')).toBe(false);
  expect(url.searchParams.has('size')).toBe(false);
  expect(url.searchParams.get('verifiedOnly')).toBe('true');
  await expect(page.locator('.company-list .company-card')).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Từ khóa công ty' })).toHaveValue('Shopee');
});

test('signed-in header, persisted following and company-specific jobs use real API contracts', async ({ page }) => {
  await setup(page, true);
  let followed = false;
  await page.route('**/api/candidate/followed-companies', route => route.fulfill({ json: followed ? [companies[0].id] : [] }));
  await page.route(`**/api/candidate/followed-companies/${companies[0].id}`, route => {
    expect(route.request().headers().authorization).toBe('Bearer test-access');
    followed = route.request().method() === 'PUT';
    return route.fulfill({ status: 204 });
  });
  await page.route('**/api/jobs?**', route => {
    expect(new URL(route.request().url()).searchParams.get('companyId')).toBe(companies[0].id);
    return route.fulfill({ json: { items: [{ id: 'job', title: 'Cloud Engineer', location: 'Hà Nội', description: 'Build secure cloud infrastructure.', salaryMin: 20000000, salaryMax: 30000000 }], totalCount: 1 } });
  });
  await page.goto('/companies');
  await expect(page.locator('header').getByRole('link', { name: 'Test Candidate', exact: true })).toBeVisible();
  const follow = page.locator('.company-featured-grid .company-follow').first();
  await follow.click();
  await expect(follow).toHaveAttribute('aria-pressed', 'true');
  await expect(follow).toHaveCSS('background-color', 'rgb(237, 75, 26)');
  await page.mouse.move(0, 0);
  await expect(follow).toHaveCSS('background-color', 'rgb(255, 96, 46)');
  await expect(follow.locator('svg')).toHaveCSS('fill', 'rgb(255, 255, 255)');
  await page.reload();
  await expect(page.locator('.company-featured-grid .company-follow').first()).toHaveAttribute('aria-pressed', 'true');
  await expect(follow).toHaveCSS('background-color', 'rgb(255, 96, 46)');
  await page.locator('.company-featured-grid .company-primary').first().click();
  await expect(page.getByRole('dialog')).toContainText('Cloud Engineer');
  await page.getByText('Cloud Engineer', { exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Build secure cloud infrastructure.');
  await page.keyboard.press('Escape');
  await page.locator('.company-featured-grid .company-follow').first().click();
  await expect(page.locator('.company-featured-grid .company-follow').first()).toHaveAttribute('aria-pressed', 'false');
  await expect(follow).toHaveCSS('background-color', 'rgb(248, 250, 252)');
  await expect(follow.locator('svg')).toHaveCSS('fill', 'none');
});

test('loading failures can be retried and empty results never display sample companies', async ({ page }) => {
  await setup(page);
  let failed = true;
  await page.route(/\/api\/companies\?.*$/, route => route.fulfill(failed ? { status: 500 } : { json: { items: [], totalCount: 0, page: 1, pageSize: 10 } }));
  await page.goto('/companies');
  await expect(page.locator('.company-results').getByRole('alert')).toBeVisible();
  failed = false;
  await page.locator('.company-results').getByRole('button', { name: 'Thử lại' }).click();
  await expect(page.getByRole('heading', { name: 'Chưa có doanh nghiệp trong hệ thống' })).toBeVisible();
  await expect(page.locator('.company-list .company-card')).toHaveCount(0);
});


test('company cards tolerate missing and null hiring details from the API', async ({ page }) => {
  await setup(page);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const items = [
    { id: 'legacy', name: 'Legacy Company', description: 'Basic API response' },
    { ...companies[0], id: 'null-titles', hiringTitles: null },
  ];
  await page.route('**/api/companies/featured', route => route.fulfill({ json: items }));
  await page.route(/\/api\/companies\?.*$/, route => route.fulfill({
    json: { items, totalCount: 2, page: 1, pageSize: 10 },
  }));
  await page.goto('/companies');
  await expect(page.locator('.company-list .company-card')).toHaveCount(2);
  await expect(page.locator('.company-featured-grid .company-card')).toHaveCount(2);
  const legacy = page.locator('.company-list .company-card').first();
  await expect(legacy).toContainText('Chưa cập nhật số việc làm');
  await expect(legacy.getByRole('button', { name: 'Xem việc làm', exact: true })).toBeVisible();
  await expect(page.locator('.company-list .company-card').nth(1)).toContainText('42 việc làm đang mở');
  expect(errors).toEqual([]);
});
