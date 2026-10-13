import { test, expect } from '@playwright/test';

const companyId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const provinceId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const jobs = Array.from({ length: 14 }, (_, index) => ({
  id: `bbbbbbbb-bbbb-4bbb-8bbb-${String(index).padStart(12, '0')}`, companyId,
  title: index === 0 ? 'Nhân viên Phục vụ / Pha chế Part-time (Xoay ca linh hoạt)' : `Nhân viên phục vụ ${index + 1}`,
  companyName: 'Hệ thống The Coffee House & Highlands Coffee Hà Nội', isVerified: true,
  companyLogoUrl: null, description: 'Phục vụ khách hàng và pha chế đồ uống.\nCa làm linh hoạt theo lịch đăng ký.',
  location: 'Cầu Giấy & Đống Đa, Hà Nội', salaryMin: 25000, salaryMax: 32000, salaryPeriod: 'hourly', salaryNote: 'Tips',
  createdAt: '2026-10-03T01:00:00Z', expiresAt: '2027-01-01T00:00:00Z', workSchedule: 'Ca 4h – 6h/ngày',
  benefits: 'Nhận lương theo tuần|Hỗ trợ xoay ca học linh hoạt', experienceLevel: 'none', positionLevel: 'employee', employmentType: 'part-time',
}));
const filters = {
  totalJobs: 14, totalCompanies: 3,
  salaryBands: [{ value: 'under-10', label: 'Dưới 10 triệu', count: 4 }, { value: '10-15', label: '10 – 15 triệu', count: 3 }, { value: '15-20', label: '15 – 20 triệu', count: 2 }, { value: '20-30', label: '20 – 30 triệu', count: 1 }, { value: 'over-30', label: 'Trên 30 triệu', count: 1 }, { value: 'negotiable', label: 'Thỏa thuận', count: 3 }],
  experienceLevels: [{ value: 'none', label: 'Chưa có kinh nghiệm', count: 6 }, { value: 'under-1', label: 'Dưới 1 năm', count: 2 }, { value: '1-3', label: '1 – 3 năm', count: 3 }, { value: '3-5', label: '3 – 5 năm', count: 2 }, { value: 'over-5', label: 'Trên 5 năm', count: 1 }],
  positionLevels: [{ value: 'intern', label: 'Thực tập sinh / Sinh viên', count: 2 }, { value: 'employee', label: 'Nhân viên', count: 8 }, { value: 'supervisor', label: 'Trưởng nhóm / Giám sát', count: 2 }, { value: 'manager', label: 'Quản lý / Trưởng phòng', count: 1 }, { value: 'director', label: 'Giám đốc & Cấp cao', count: 1 }],
  employmentTypes: [{ value: 'full-time', label: 'Toàn thời gian', count: 4 }, { value: 'part-time', label: 'Bán thời gian', count: 5 }, { value: 'internship', label: 'Thực tập', count: 2 }, { value: 'remote', label: 'Remote / Từ xa', count: 2 }, { value: 'flexible', label: 'Hybrid linh hoạt', count: 1 }],
};

async function setup(page) {
  await page.route('**/api/candidate/auth/me', route => route.fulfill({ status: 401 }));
  await page.route('**/api/jobs/filters', route => route.fulfill({ json: filters }));
  await page.route('**/api/companies/filters', route => route.fulfill({ json: { provinces: [{ id: provinceId, name: 'Thành phố Hà Nội' }], industries: [{ id: companyId, name: 'Dịch vụ' }] } }));
  await page.route('**/api/jobs?**', route => {
    const params = new URL(route.request().url()).searchParams;
    const pageNumber = Number(params.get('page')) || 1;
    const size = Number(params.get('pageSize')) || 6;
    const ids = params.getAll('jobIds');
    const items = ids.length ? jobs.filter(job => ids.includes(job.id)) : jobs;
    return route.fulfill({ json: { items: items.slice((pageNumber - 1) * size, pageNumber * size), totalCount: items.length, page: pageNumber, pageSize: size } });
  });
}

test('jobs uses shared resources, six API results and responsive reference layout', async ({ page }) => {
  await setup(page);
  const requests = [];
  page.on('request', request => { if (new URL(request.url()).pathname === '/api/jobs') requests.push(request.url()); });
  await page.goto('/jobs');
  await expect(page.locator('.job-listing-card')).toHaveCount(6);
  expect(requests).toHaveLength(1);
  expect(new URL(requests[0]).searchParams.get('pageSize')).toBe('6');
  await expect(page.locator('header')).toHaveCount(1);
  await expect(page.locator('footer')).toHaveCount(1);
  await expect(page.locator('.cv-templates')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Cẩm nang & Báo cáo thị trường tuyển dụng 2026' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Kho tiện ích hỗ trợ ứng viên chuẩn 2026' })).toBeVisible();
  await expect(page.locator('.job-listing-card').first()).toContainText('25.000 – 32.000 đ/giờ + Tips');
  await expect(page.locator('.job-directory-pagination')).toContainText('Hiển thị 1 – 6 trong tổng số 14 việc làm');
  await page.setViewportSize({ width: 1284, height: 1000 });
  await page.screenshot({ path: 'test-results/jobs-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('.job-directory-filters')).toBeHidden();
  await page.getByRole('button', { name: 'Bộ lọc việc làm', exact: true }).click();
  await expect(page.locator('.job-directory-filters')).toBeVisible();
  await page.screenshot({ path: 'test-results/jobs-mobile.png', fullPage: true });
  await expect(page.getByRole('link', { name: jobs[0].title, exact: true }).first()).toHaveAttribute('href', `/jobs/${jobs[0].id}`);
});

test('search, multiple filters and pagination reach API and survive reload', async ({ page }) => {
  await setup(page);
  await page.goto('/jobs');
  await expect(page.locator('.job-listing-card')).toHaveCount(6);
  await page.getByRole('button', { name: 'Trang 2', exact: true }).click();
  await expect(page.locator('.job-directory-pagination')).toContainText('Hiển thị 7 – 12');
  await page.getByRole('radio', { name: '15 – 20 triệu' }).click();
  await expect(page.getByRole('radio', { name: '15 – 20 triệu' })).toBeChecked();
  await expect(page.getByRole('button', { name: 'Trang 1', exact: true })).toHaveAttribute('aria-current', 'page');
  await page.getByRole('checkbox', { name: '1 – 3 năm' }).click();
  await expect(page.getByRole('checkbox', { name: '1 – 3 năm' })).toBeChecked();
  await page.getByRole('checkbox', { name: 'Chưa có kinh nghiệm' }).click();
  await expect(page.getByRole('checkbox', { name: 'Chưa có kinh nghiệm' })).toBeChecked();
  await page.getByRole('checkbox', { name: 'Nhân viên', exact: false }).click();
  await expect(page.getByRole('checkbox', { name: 'Nhân viên', exact: false })).toBeChecked();
  await page.getByRole('button', { name: 'Bán thời gian', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Chỉ hiển thị NTD có Job Tốt Shield', exact: false }).click();
  await expect(page.getByRole('checkbox', { name: 'Chỉ hiển thị NTD có Job Tốt Shield', exact: false })).toBeChecked();
  await page.getByRole('textbox', { name: 'Từ khóa công việc' }).fill('Phục vụ');
  await page.getByRole('combobox', { name: 'Địa điểm' }).selectOption(provinceId);
  await page.getByRole('combobox', { name: 'Ngành nghề' }).selectOption(companyId);
  const request = page.waitForRequest(request => new URL(request.url()).pathname === '/api/jobs' && new URL(request.url()).searchParams.get('keyword') === 'Phục vụ');
  await page.getByRole('button', { name: 'Tìm việc ngay' }).click();
  const query = new URL((await request).url()).searchParams;
  expect(query.get('page')).toBe('1');
  expect(query.get('provinceId')).toBe(provinceId);
  expect(query.has('location')).toBe(false);
  expect(query.get('industryId')).toBe(companyId);
  expect(query.getAll('experienceLevels')).toEqual(['1-3', 'none']);
  expect(query.get('positionLevels')).toBe('employee');
  expect(query.get('employmentTypes')).toBe('part-time');
  expect(query.get('salaryBand')).toBe('15-20');
  expect(query.get('verifiedOnly')).toBe('true');
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Từ khóa công việc' })).toHaveValue('Phục vụ');
  await expect(page.getByRole('combobox', { name: 'Ngành nghề' })).toHaveValue(companyId);
  await expect(page.getByRole('combobox', { name: 'Địa điểm' })).toHaveValue(provinceId);
  await expect(page.getByRole('radio', { name: '15 – 20 triệu' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: '1 – 3 năm' })).toBeChecked();
  await page.getByRole('button', { name: 'Thiết lập lại bộ lọc', exact: true }).click();
  await expect(page).toHaveURL('/jobs');
});

test('guest saved jobs persist locally and private dashboard asks for login', async ({ page }) => {
  await setup(page);
  await page.goto('/jobs');
  await page.getByRole('button', { name: `Lưu ${jobs[0].title}`, exact: true }).click();
  await expect(page.locator('.app-toast')).toContainText(`Đã lưu ${jobs[0].title}.`);
  await page.reload();
  await expect(page.getByRole('button', { name: `Bỏ lưu ${jobs[0].title}`, exact: true })).toBeVisible();
  await page.getByRole('button', { name: `Bỏ lưu ${jobs[0].title}`, exact: true }).click();
  await expect(page.locator('.app-toast')).toContainText(`Đã bỏ lưu ${jobs[0].title}.`);
  await page.goto('/saved-jobs');
  await expect(page).toHaveURL('/my-jobs?tab=saved');
  await expect(page.getByRole('link', { name: 'Đăng nhập để tiếp tục' })).toBeVisible();
});

test('failed and empty API responses provide retry and never use frontend sample jobs', async ({ page }) => {
  await setup(page);
  let failed = true;
  await page.route('**/api/jobs?**', route => route.fulfill(failed ? { status: 500 } : { json: { items: [], totalCount: 0 } }));
  await page.goto('/jobs');
  await expect(page.locator('.job-directory-results').getByRole('alert')).toBeVisible();
  failed = false;
  await page.locator('.job-directory-results').getByRole('button', { name: 'Thử lại' }).click();
  await expect(page.getByRole('heading', { name: 'Không tìm thấy việc làm phù hợp' })).toBeVisible();
  await expect(page.locator('.job-listing-card')).toHaveCount(0);
});

test('old location links resolve the Province catalog and request jobs by province ID', async ({ page }) => {
  await setup(page);
  const requests = [];
  page.on('request', request => { if (new URL(request.url()).pathname === '/api/jobs') requests.push(new URL(request.url()).searchParams); });
  await page.goto('/jobs?location=Th%C3%A0nh+ph%E1%BB%91+H%C3%A0+N%E1%BB%99i');
  await expect(page).toHaveURL(`/jobs?provinceId=${provinceId}`);
  await expect(page.locator('.job-listing-card')).toHaveCount(6);
  await expect(page.getByRole('combobox', { name: 'Địa điểm' })).toHaveValue(provinceId);
  expect(requests).toHaveLength(1);
  expect(requests[0].get('provinceId')).toBe(provinceId);
  expect(requests[0].has('location')).toBe(false);
});
