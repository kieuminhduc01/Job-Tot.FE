import { test, expect } from '@playwright/test';

const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const companyId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const relatedId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const cvId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const job = { id, companyId, title: 'Senior DevOps / Data Platform Engineer (AWS, Kubernetes, CI/CD)', companyName: 'Công ty TNHH Panasonic R&D Center Việt Nam (Demo)', description: 'Tham gia xây dựng hệ thống Cloud và Data Platform.\nThiết kế, xây dựng và quản trị hạ tầng Cloud-Native.\nTriển khai Kubernetes và tối ưu hệ thống CI/CD.\nGiám sát hệ thống, đảm bảo an toàn và độ ổn định.', location: 'Keangnam Landmark 72, Hà Nội', salaryMin: 35000000, salaryMax: 55000000, salaryPeriod: 'monthly', expiresAt: '2027-10-30T00:00:00Z', createdAt: '2026-10-03T00:00:00Z', isVerified: true, experienceLevel: '3-5', positionLevel: 'supervisor', employmentType: 'flexible', benefits: 'Thưởng KPIs 3 – 5 tháng lương|Bảo hiểm PVI Premium Care|Tài trợ 100% chứng chỉ quốc tế|MacBook Pro M3 Max + Màn 4K|Cơ hội Onsite Nhật Bản|15 ngày phép năm + Hybrid', requirements: 'Tối thiểu 3 năm kinh nghiệm Cloud Infrastructure.\nNắm vững Kubernetes, Docker và Terraform.\nKinh nghiệm AWS và tối ưu hệ thống CI/CD.\nThành thạo Python, Bash hoặc Golang.\nCó tinh thần chủ động và trách nhiệm.', hiringProcess: 'Nộp hồ sơ & Duyệt hồ sơ|Phản hồi trong vòng 24 – 48h\nPhỏng vấn với Talent Acquisition|Trao đổi về định hướng nghề nghiệp\nTechnical Deep-dive & Architecture Review|Đánh giá kỹ năng chuyên môn\nGặp gỡ Tech Director & Ban Giám đốc|Thảo luận mục tiêu công việc\nNhận thư mời Offer & Chào đón gia nhập|Hoàn tất hồ sơ và onboarding', vacancies: 2, genderRequirement: 'Không yêu cầu', ageRequirement: '24 – 38 tuổi', recruiterName: 'Trần Mai Phương (Demo)', recruiterTitle: 'Lead Talent Acquisition', recruiterEmail: 'hr@example.com' };
async function setup(page, { authenticated = false, closed = false, saved = false } = {}) {
  await page.route('**/api/candidate/saved-jobs', route => route.fulfill({ json: [] }));
  await page.route('**/api/candidate/auth/me', route => route.fulfill(authenticated ? { json: { id: 'candidate', fullName: 'Nguyễn Hoàng Nam' } } : { status: 401 }));
  await page.route(`**/api/jobs/${id}`, route => route.fulfill({ json: { ...job, isClosed: closed } }));
  await page.route(`**/api/jobs/${relatedId}`, route => route.fulfill({ json: { ...job, id: relatedId, title: 'Cloud Infrastructure Architect' } }));
  await page.route('**/api/companies?**', route => route.fulfill({ json: { items: [{ id: companyId, name: job.companyName, description: 'Trung tâm nghiên cứu phát triển công nghệ tại Hà Nội.', province: 'Thành phố Hà Nội', address: 'Keangnam Landmark 72', sizeMin: 500, sizeMax: 1000, coverUrl: '/uploads/companies/covers/2b6cdefba63f5c4e82af354ea34161b2.svg' }] } }));
  await page.route('**/api/jobs?**', route => route.fulfill({ json: { items: [{ ...job, id: relatedId, title: 'Cloud Infrastructure Architect' }], totalCount: 1 } }));
  await page.route('**/api/candidate/profile', route => route.fulfill({ json: { profile: { fullName: 'Nguyễn Hoàng Nam' }, phone: '0988234567', cvs: [{ id: cvId, title: 'CV Tiên phong IT 2026', isDefault: true }] } }));
  await page.route('**/api/candidate/profile/cvs', route => route.fulfill({ json: { id: cvId, title: 'CV mới.pdf', isDefault: true } }));
  const status = { id: 'submission', jobId: id, cvId, cvTitle: 'CV Tiên phong IT 2026', appliedAt: '2026-10-03T08:00:00Z', status: 'submitted' };
  let applied = saved;
  await page.route(`**/api/candidate/jobs/${id}/application`, route => {
    if (route.request().method() === 'POST') { applied = true; return route.fulfill({ status: 201, json: status }); }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(applied ? status : null) });
  });
}
test('detail uses API content, exact shared resources, responsive layout and related navigation', async ({ page }) => {
  await setup(page);
  await page.goto(`/jobs/${id}`);
  await expect(page.getByRole('heading', { name: job.title, exact: true })).toBeVisible();
  await expect(page.locator('.jd-benefits > div')).toHaveCount(6);
  await expect(page.locator('.jd-timeline li')).toHaveCount(5);
  await expect(page.locator('.jd-summary')).toContainText('35 – 55 triệu');
  await expect(page.locator('.jd-sidebar')).toContainText('2 nhân sự');
  await expect(page.locator('header')).toHaveCount(1);
  await expect(page.locator('footer')).toHaveCount(1);
  await expect(page.locator('.cv-templates')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Cẩm nang & Báo cáo thị trường tuyển dụng 2026' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Kho tiện ích hỗ trợ ứng viên chuẩn 2026' })).toBeVisible();
  await page.getByRole('button', { name: `Lưu ${job.title}`, exact: true }).click();
  await expect(page.locator('.toast-region')).toContainText('Đã lưu');
  await page.getByRole('link', { name: 'Ứng tuyển ngay', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Đăng nhập để ứng tuyển' })).toBeVisible();
  await page.evaluate(() => scrollTo(0, 0));
  await page.setViewportSize({ width: 1284, height: 1000 });
  await page.screenshot({ path: 'test-results/job-detail-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/job-detail-mobile.png', fullPage: true });
  await page.getByRole('link', { name: /Cloud Infrastructure Architect/ }).click();
  await expect(page).toHaveURL(`/jobs/${relatedId}`);
  await expect(page.getByRole('heading', { name: 'Cloud Infrastructure Architect', exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});
test('authenticated application uploads owned CV, posts real form values and survives reload', async ({ page }) => {
  await setup(page, { authenticated: true });
  const requests = [];
  page.on('request', request => requests.push(new URL(request.url()).pathname));
  await page.goto(`/jobs/${id}#job-application`);
  await expect(page.getByRole('form', { name: 'Hồ sơ ứng tuyển' })).toBeVisible();
  expect(requests.filter(path => path === `/api/jobs/${id}`)).toHaveLength(1);
  expect(requests.filter(path => path === '/api/candidate/profile')).toHaveLength(1);
  expect(requests.filter(path => path === `/api/candidate/jobs/${id}/application`)).toHaveLength(1);
  await page.getByLabel('Tải lên CV mới', { exact: true }).setInputFiles({ name: 'CV mới.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7 candidate CV') });
  await expect(page.locator('.jd-cv-options')).toContainText('CV mới.pdf');
  await page.getByRole('textbox', { name: /Thư giới thiệu/ }).fill('Tôi có kinh nghiệm AWS và Kubernetes.');
  const posted = page.waitForRequest(request => request.url().includes(`/jobs/${id}/application`) && request.method() === 'POST');
  await page.getByRole('button', { name: 'Nộp hồ sơ ứng tuyển ngay' }).click();
  const body = (await posted).postDataJSON();
  expect(body).toMatchObject({ cvId, fullName: 'Nguyễn Hoàng Nam', phone: '0988234567', coverLetter: 'Tôi có kinh nghiệm AWS và Kubernetes.' });
  await expect(page.locator('.jd-submitted')).toContainText('Đã gửi hồ sơ ứng tuyển');
  await expect(page.locator('.toast-region')).toContainText('Đã gửi hồ sơ ứng tuyển');
  await page.reload();
  await expect(page.locator('.jd-submitted')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nộp hồ sơ ứng tuyển ngay' })).toHaveCount(0);
});
test('closed jobs prevent submission and missing jobs provide a retry', async ({ page }) => {
  await setup(page, { authenticated: true, closed: true });
  await page.goto(`/jobs/${id}`);
  await expect(page.locator('#job-application')).toContainText('Việc làm đã ngừng nhận hồ sơ.');
  await expect(page.getByRole('link', { name: 'Ứng tuyển ngay', exact: true })).toHaveCount(0);
  await page.route(`**/api/jobs/${id}`, route => route.fulfill({ status: 404, json: { detail: 'Không tìm thấy việc làm.' } }));
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('Không tìm thấy việc làm.');
  await expect(page.getByRole('button', { name: 'Thử lại' })).toBeVisible();
});

test('login from application returns to the same job and keeps registration return path', async ({ page }) => {
  await setup(page);
  await page.route('**/api/candidate/auth/login', route => route.fulfill({ json: { account: { id: 'candidate', fullName: 'Nguyễn Hoàng Nam' }, accessToken: 'test-access', refreshToken: 'test-refresh' } }));
  await page.goto(`/jobs/${id}#job-application`);
  await page.getByRole('link', { name: 'Đăng nhập để ứng tuyển' }).click();
  await expect(page.getByRole('link', { name: 'Đăng ký mới', exact: true })).toHaveAttribute('href', `/register?returnTo=${encodeURIComponent(`/jobs/${id}#job-application`)}`);
  await page.getByLabel('Email hoặc số điện thoại').fill('candidate@example.com');
  await page.locator('#password').fill('matkhau123');
  await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
  await expect(page).toHaveURL(`/jobs/${id}#job-application`);
  await expect(page.getByRole('form', { name: 'Hồ sơ ứng tuyển' })).toBeVisible();
});
