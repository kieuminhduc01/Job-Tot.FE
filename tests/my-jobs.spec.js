import { test, expect } from '@playwright/test';
import { seedTokens } from './token-fixtures.js';
test.use({ timezoneId: 'Asia/Bangkok' });
const companyId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const jobs = Array.from({ length: 7 }, (_, index) => ({ id: `aaaaaaaa-aaaa-4aaa-8aaa-${String(index + 1).padStart(12, '0')}`, companyId, title: `Nhân viên Phục vụ / Pha chế Part-time ${index + 1} (Xoay ca linh hoạt)`, companyName: 'Hệ thống The Coffee House & Highlands Coffee Hà Nội', description: 'Phục vụ khách hàng và pha chế đồ uống.', location: 'Cầu Giấy & Đống Đa, Hà Nội', salaryMin: 25000, salaryMax: 32000, salaryPeriod: 'hourly', salaryNote: 'Tips', workSchedule: 'Ca 4h – 6h/ngày', benefits: 'Nhận lương theo tuần|Hỗ trợ xoay ca linh hoạt', experienceLevel: 'none', employmentType: 'part-time', isVerified: true, createdAt: '2026-10-03T00:00:00Z', expiresAt: '2027-10-03T00:00:00Z' }));
function interviewFixtures(start = new Date(Date.now() + 2 * 3600000)) {
  return [
    { id: 'interview-online', jobTitle: 'Senior Fullstack Engineer (Vue/NodeJS & AWS)', companyName: 'FPT Software',
      start: start.toISOString(), end: new Date(start.getTime() + 3600000).toISOString(), meetingUrl: 'https://meet.example.com/interview',
      location: 'Hòa Lạc Campus / Hà Nội', status: 'confirmed', companyId, companyVerified: true, stageName: 'Phỏng vấn kỹ thuật', stageOrder: 2,
      recruiterName: 'Trần Mai Phương', recruiterTitle: 'Lead Tech Recruiter', recruiterEmail: 'hr@example.com', preparation: 'Chuẩn bị chia sẻ hai dự án thực tế và tài khoản GitHub.' },
    { id: 'interview-proposed', jobTitle: 'Principal Backend Architect (Go / High-Concurrency)', companyName: 'Shopee Việt Nam',
      start: new Date(start.getTime() + 2 * 86400000).toISOString(), end: new Date(start.getTime() + 2 * 86400000 + 45 * 60000).toISOString(),
      meetingUrl: 'https://meet.example.com/proposal', status: 'pending', companyId, companyVerified: true,
      stageName: 'Văn hóa & Quản trị kỹ thuật', stageOrder: 3, recruiterName: 'Engineering Director', recruiterEmail: 'hr@example.com', preparation: 'Chuẩn bị tài khoản GitHub.' },
    { id: 'interview-onsite', jobTitle: 'Senior DevOps / Data Platform Engineer', companyName: 'Panasonic R&D Center Việt Nam',
      start: new Date(start.getTime() + 5 * 86400000).toISOString(), end: new Date(start.getTime() + 5 * 86400000 + 3600000).toISOString(),
      location: 'Tầng 28, Tòa Keangnam Landmark 72, Hà Nội', status: 'confirmed', companyId, companyVerified: true,
      stageName: 'Final', stageOrder: 3, recruiterEmail: 'hr@example.com' },
  ];
}
const interviewDay = value => new Date(value).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
function applicationFixtures() {
  const states = [
    ...Array.from({ length: 4 }, () => ({ status: 'interview', progress: { currentStep: 2, label: 'Đang phỏng vấn' } })),
    { status: 'reviewed', progress: { currentStep: 1, label: 'Mới ứng tuyển' } },
    { status: 'rejected', progress: { currentStep: 5, label: 'Không phù hợp', stopped: true } },
    { status: 'hired', progress: { currentStep: 4, label: 'Đã nhận việc', completed: true } },
    { status: 'accepted', progress: { currentStep: 1, label: 'Mới ứng tuyển' } },
    ...Array.from({ length: 6 }, () => ({ status: 'submitted', progress: { currentStep: 1, label: 'Mới ứng tuyển' } })),
  ];
  return states.map((state, index) => {
    const job = { ...jobs[0], id: `cccccccc-cccc-4ccc-8ccc-${String(index + 1).padStart(12, '0')}`,
      title: 'Senior DevOps / Data Engineer', companyName: 'Công ty TNHH Panasonic R&D Center Việt Nam',
      location: 'Hà Nội (Keangnam Landmark 72)', salaryMin: 35000000, salaryMax: 55000000, salaryPeriod: 'monthly', salaryNote: null };
    return { job, application: { id: `application-${index}`, jobId: job.id, ...state,
      appliedAt: '2026-08-14T03:00:00Z', reviewedAt: state.progress.currentStep > 1 ? '2026-08-15T03:00:00Z' : null,
      cvTitle: 'CV Tiên phong IT 2026', recruiterEmail: 'hr@example.com' } };
  });
}
async function setup(page, { failDelete = false, failConfirm = false, profile = { avatarUrl: null }, interviews = interviewFixtures(), applied = applicationFixtures() } = {}) {
  await seedTokens(page);
  await page.route('**/api/candidate/header', route => route.fulfill({ json: { avatarUrl: null, messages: [], notifications: [] } }));
  let saved = jobs.map(job => job.id);
  let readyStatus = 'looking';
  const interests = Array.from({ length: 7 }, (_, index) => ({
    id: `interest-${index}`, companyId, companyName: 'Panasonic R&D Center Việt Nam',
    location: 'Nam Từ Liêm, Hà Nội', companySizeMin: 500, companySizeMax: 1000, openJobCount: 42,
    interestedAt: new Date(Date.now() - (15 + index) * 60000).toISOString(),
    recruiterName: "Trần Mai Phương", recruiterTitle: "Lead Talent Acquisition", recruiterEmail: "hr@example.com",
    position: { ...jobs[0], title: 'Senior DevOps / Data Platform Engineer', salaryMin: 35000000,
      salaryMax: 55000000, salaryPeriod: 'monthly', salaryNote: null, recruiterName: 'Trần Mai Phương',
      recruiterTitle: 'Lead Talent Acquisition', recruiterEmail: 'hr@example.com' },
  }));
  await page.route('**/api/candidate/profile', route => route.fulfill({ json: { profile: { avatarUrl: null } } }));
  await page.route('**/api/candidate/auth/me', route => route.fulfill({ json: { id: 'candidate', fullName: 'Nguyễn Văn An' } }));
  await page.route('**/api/candidate/saved-jobs', route => route.fulfill({ json: saved }));
  await page.route('**/api/candidate/saved-jobs/*', route => {
    const id = route.request().url().split('/').pop();
    if (failDelete) return route.fulfill({ status: 500 });
    if (route.request().method() === 'DELETE') saved = saved.filter(value => value !== id);
    else saved = [...new Set([...saved, id])];
    return route.fulfill({ status: 204 });
  });
  await page.route('**/api/candidate/my-jobs/status', route => { readyStatus = route.request().postDataJSON().readyStatus; return route.fulfill({ status: 204 }); });
  await page.route('**/api/candidate/interviews/*/confirm', route => {
    if (failConfirm) return route.fulfill({ status: 500, json: { detail: 'Không thể xác nhận lịch phỏng vấn.' } });
    const id = route.request().url().split('/').at(-2);
    const interview = interviews.find(item => item.id === id);
    if (!interview) return route.fulfill({ status: 404 });
    interview.status = 'confirmed';
    return route.fulfill({ status: 204 });
  });
  await page.route('**/api/candidate/my-jobs?**', route => {
    const params = new URL(route.request().url()).searchParams;
    const tab = params.get('tab'); const pageNumber = Number(params.get('page')) || 1;
    const items = jobs.filter(job => saved.includes(job.id));
    const activeInterviews = interviews.filter(item => !['cancelled', 'canceled', 'declined'].includes(item.status));
    const selectedInterviews = activeInterviews.filter(item => !params.get('interviewDate') || interviewDay(item.start) === params.get('interviewDate'));
    const selectedApplications = tab === "hired" ? applied.filter(item => item.application.status.toLowerCase() === "hired") : applied;
    const appliedPage = selectedApplications.slice((pageNumber - 1) * 4, pageNumber * 4);
    return route.fulfill({ json: {
      fullName: 'Nguyễn Văn An', avatarUrl: profile.avatarUrl, headline: 'Senior Fullstack Developer', cvTitle: 'CV Tiên phong IT 2026', readyStatus, openToWork: readyStatus === 'looking',
      stats: { applied: selectedApplications.length, viewed: 28, interviews: interviews.length, saved: items.length, followedCompanies: 99, interestedEmployers: interests.length, hired: applied.filter(item => item.application.status === "hired").length }, tab, page: pageNumber, pageSize: tab === 'companies' ? 6 : ['applied', 'hired'].includes(tab) ? 4 : 3,
      totalCount: tab === 'saved' ? items.length : tab === 'companies' ? interests.length : tab === 'interviews' ? selectedInterviews.length : selectedApplications.length,
      jobs: tab === 'saved' ? items.slice((pageNumber - 1) * 3, pageNumber * 3) : ['applied', 'hired'].includes(tab) ? appliedPage.map(item => item.job) : [],
      applications: ['applied', 'hired'].includes(tab) ? appliedPage.map(item => item.application) : [],
      nextInterview: ['applied', 'hired'].includes(tab) ? interviews[0] || null : null,
      companies: tab === 'companies' ? [{ id: companyId, name: 'Công ty Coffee (Demo)', description: 'Company', hiringTitles: [], openJobCount: 3 }] : [],
      employerInterests: tab === 'companies' ? interests.slice((pageNumber - 1) * 6, pageNumber * 6) : [],
      interviews: tab === 'interviews' ? selectedInterviews.slice((pageNumber - 1) * 3, pageNumber * 3) : [],
      interviewCalendar: tab === 'interviews' ? activeInterviews.filter(item => interviewDay(item.start).startsWith(params.get('calendarMonth')))
        .map(item => ({ id: item.id, jobTitle: item.jobTitle, start: item.start, online: Boolean(item.meetingUrl) })) : [],
      deadlines: [{ ...jobs[0], title: 'Senior DevOps – Panasonic R&D', expiresAt: new Date(Date.now() + 18 * 3600000).toISOString() }],
      recommendations: jobs.slice(0, 3).map((job, index) => ({ ...job, title: ['Tech Lead (AI & Cloud Solutions)', 'Principal Backend Architect', 'Cloud Solution Architect'][index] })),
    } });
  });
}
test('my jobs uses the dashboard profile avatar without an extra profile request under StrictMode', async ({ page }) => {
  const profile = { avatarUrl: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><rect width="1600" height="900" fill="orange"/></svg>')}` };
  await setup(page, { profile });
  let requests = 0;
  let dashboardRequests = 0;
  page.on('request', request => {
    if (request.url().includes('/api/candidate/my-jobs?')) dashboardRequests += 1;
  });
  await page.route('**/api/candidate/profile', route => {
    requests += 1;
    return route.fulfill({ json: { profile } });
  });
  await page.goto('/my-jobs');
  await expect(page.locator('.mj-avatar img')).toHaveAttribute('src', profile.avatarUrl);
  expect(requests).toBe(0);
  expect(dashboardRequests).toBe(1);
  for (const width of [1284, 390]) {
    await page.setViewportSize({ width, height: 844 });
    const frame = await page.locator('.mj-avatar').boundingBox();
    const image = await page.locator('.mj-avatar img').boundingBox();
    expect(image.x).toBeCloseTo(frame.x, 0);
    expect(image.y).toBeCloseTo(frame.y, 0);
    expect(image.width).toBeCloseTo(frame.width, 0);
    expect(image.height).toBeCloseTo(frame.height, 0);
  }
  await page.getByRole('link', { name: /Việc làm đã ứng tuyển \(14\)/ }).click();
  await expect(page.locator('.mj-applied-card')).toHaveCount(4);
  expect(requests).toBe(0);
  profile.avatarUrl = null;
  await page.reload();
  await expect(page.locator('.mj-avatar')).toContainText('N');
  await expect(page.locator('.mj-avatar img')).toHaveCount(0);
  expect(requests).toBe(0);
});
test('employer interest tab shows HR activity rather than followed companies and fits desktop/mobile', async ({ page }) => {
  await setup(page);
  let dashboardRequests = 0;
  page.on('request', request => {
    if (request.url().includes('/api/candidate/my-jobs?')) dashboardRequests += 1;
  });
  await page.goto('/my-jobs?tab=companies');
  await expect(page.locator('.mj-employer-card')).toHaveCount(6);
  const card = page.locator('.mj-employer-card').first();
  await expect(card).toContainText('Trần Mai Phương');
  await expect(card).toContainText('Lead Talent Acquisition');
  await expect(card).toContainText('15 phút trước');
  await expect(card).toContainText('Nhà tuyển dụng quan tâm hồ sơ của bạn');
  await expect(card).not.toContainText('VỊ TRÍ ĐANG NHẮM TỚI BẠN');
  await expect(card.getByRole('link', { name: 'Phản hồi & Nhắn tin với HR' })).toHaveAttribute('href', '/messages?hr=hr%40example.com');
  await expect(card.getByRole('link', { name: 'Xem 42 việc đang tuyển' })).toHaveAttribute('href', `/companies/${companyId}#company-open-jobs`);
  await expect(page.getByRole('link', { name: /NTD Quan Tâm bạn \(7\)/ })).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.company-card')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Bỏ theo dõi/ })).toHaveCount(0);
  expect(dashboardRequests).toBe(1);
  await page.setViewportSize({ width: 1284, height: 1000 });
  await page.screenshot({ path: 'test-results/employer-interests-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect((await card.locator('.mj-employer-company').boundingBox()).width).toBeGreaterThan(180);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/employer-interests-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Trang 2', exact: true }).click();
  await expect(page.locator('.mj-employer-card')).toHaveCount(1);
  await expect(page.locator('.mj-pagination')).toContainText('Hiển thị 7 – 7');
  await expect(page.locator('.cv-templates')).toHaveCount(0);
});
test('interview design supports calendar filtering, confirmation, online and onsite schedules', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2030-08-15T04:45:00Z'));
  await setup(page, { interviews: interviewFixtures(new Date('2030-08-15T07:30:00Z')) });
  let requests = 0;
  page.on('request', request => { if (request.url().includes('/api/candidate/my-jobs?')) requests += 1; });
  await page.goto('/my-jobs?tab=interviews&month=2030-08');
  await expect(page.locator('.mj-schedule-card')).toHaveCount(3);
  expect(requests).toBe(1);
  await expect(page.locator('.mj-schedule-card.is-urgent')).toContainText('DIỄN RA TRONG 24 GIỜ TỚI');
  await expect(page.locator('.mj-schedule-card.is-urgent')).toContainText('14:30 – 15:30 (60 phút)');
  await expect(page.locator('.mj-schedule-card.is-urgent')).toContainText('Còn 2 giờ 45 phút');
  await expect(page.locator('.mj-schedule-card.is-pending')).toContainText('Chờ bạn xác nhận lịch');
  await expect(page.locator('.mj-schedule-card').last()).toContainText('Keangnam');
  await expect(page.locator('.mj-schedule-card').last().getByRole('link', { name: 'Nhắn tin với HR' })).toHaveAttribute('href', '/messages?hr=hr%40example.com');
  await expect(page.getByRole('link', { name: 'Tham gia phỏng vấn trực tuyến', exact: true }).first()).toHaveAttribute('href', 'https://meet.example.com/interview');
  await expect(page.locator('.mj-calendar-legend')).toContainText('Trực tuyến (2)');
  await expect(page.locator('.mj-calendar-legend')).toContainText('Trực tiếp (1)');
  await expect(page.locator('.mj-side-card.mj-matching')).toHaveCount(0);
  await expect(page.locator('.cv-templates')).toHaveCount(0);
  await page.setViewportSize({ width: 1284, height: 1000 });
  await page.screenshot({ path: 'test-results/interview-schedule-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await page.locator('.mj-schedule-identity').first().boundingBox()).width).toBeGreaterThan(170);
  await page.screenshot({ path: 'test-results/interview-schedule-mobile.png', fullPage: true });
  await page.locator('.mj-schedule-card').first().screenshot({ path: 'test-results/interview-card-mobile.png' });
  await page.getByRole('button', { name: 'Tháng trước' }).click();
  await expect(page.locator('.mj-calendar-heading')).toContainText('Tháng 07, 2030');
  await expect(page.locator('.mj-calendar-legend')).toContainText('Trực tuyến (0)');
  await page.getByRole('button', { name: 'Tháng sau' }).click();
  await expect(page.locator('.mj-calendar-legend')).toContainText('Trực tuyến (2)');
  await page.getByRole('button', { name: /20\/08\/2030, 1 lịch phỏng vấn/ }).click();
  await expect(page.locator('.mj-schedule-card')).toHaveCount(1);
  await expect(page.locator('.mj-schedule-card')).toContainText('Panasonic');
  await page.getByRole('button', { name: 'Xem tất cả lịch phỏng vấn' }).click();
  await expect(page.locator('.mj-schedule-card')).toHaveCount(3);
  await page.getByRole('button', { name: 'Xác nhận tham gia', exact: true }).click();
  await expect(page.locator('#interview-interview-proposed')).toContainText('Đã xác nhận tham gia');
  await expect(page.getByRole('button', { name: 'Xác nhận tham gia', exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.locator('#interview-interview-proposed')).toContainText('Đã xác nhận tham gia');
});
test('interview confirmation failure preserves pending state and calendar load failures support retry', async ({ page }) => {
  await setup(page, { failConfirm: true });
  await page.goto('/my-jobs?tab=interviews');
  await page.getByRole('button', { name: 'Xác nhận tham gia', exact: true }).click();
  await expect(page.locator('.toast-region')).toContainText('Không thể xác nhận lịch phỏng vấn.');
  await expect(page.locator('#interview-interview-proposed')).toContainText('Chờ bạn xác nhận lịch');
  await expect(page.getByRole('button', { name: 'Xác nhận tham gia', exact: true })).toBeEnabled();
  await page.route('**/api/candidate/my-jobs?**', route => route.fulfill({ status: 500, json: { detail: 'Lỗi tải lịch.' } }));
  await page.getByRole('button', { name: 'Tháng sau' }).click();
  await expect(page.locator('.mj-error')).toContainText('Lỗi tải lịch.');
  await expect(page.locator('.mj-calendar-notice')).toContainText('Không thể tải lịch tháng');
  await expect(page.getByRole('button', { name: 'Thử lại', exact: true })).toBeVisible();
});
test('applied design shows recorded progress, nearest interview and private API pagination', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-08-14T05:00:00Z'));
  const interviews = interviewFixtures(new Date('2026-08-18T03:00:00Z'));
  interviews[0].companyName = 'Panasonic R&D Center Việt Nam';
  interviews[0].jobTitle = 'Senior DevOps / Data Engineer';
  await setup(page, { interviews });
  const requests = [];
  page.on('request', request => { if (request.url().includes('/api/candidate/my-jobs?')) requests.push(request.url()); });
  await page.goto('/my-jobs?tab=applied');
  await expect(page.locator('.mj-applied-card')).toHaveCount(4);
  expect(requests).toHaveLength(1);
  expect(new URL(requests[0]).searchParams.get('pageSize')).toBe('4');
  const card = page.locator('.mj-applied-card').first();
  await expect(card).toContainText('Senior DevOps / Data Engineer');
  await expect(card).toContainText('Đang phỏng vấn');
  await expect(card).toContainText('Nộp ngày 14/08/2026');
  await expect(card.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
  await expect(card.locator('.mj-application-progress-track .is-done')).toHaveCount(1);
  await expect(card.locator('.mj-application-progress-track .is-current')).toContainText('2. Đang phỏng vấn');
  await expect(card.getByRole('link', { name: 'Nhắn tin với HR' })).toHaveAttribute('href', '/messages?hr=hr%40example.com');
  await expect(page.locator('.mj-upcoming-interview-card')).toContainText('Panasonic R&D Center Việt Nam');
  await expect(page.locator('.mj-upcoming-interview-card')).toContainText('18/08/2026');
  await expect(page.locator('.mj-upcoming-interview-card')).toContainText('10:00');
  await expect(page.locator('.job-listing-card')).toHaveCount(0);
  await expect(page.locator('.cv-templates')).toHaveCount(0);
  await expect(page.locator('.mj-pagination')).toContainText('Hiển thị 1 – 4 trong tổng số 14 việc làm đã ứng tuyển');
  await page.setViewportSize({ width: 1284, height: 1000 });
  await page.screenshot({ path: 'test-results/applied-jobs-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await card.locator('.mj-applied-identity').boundingBox()).width).toBeGreaterThan(170);
  await page.screenshot({ path: 'test-results/applied-jobs-mobile.png', fullPage: true });
  await card.screenshot({ path: 'test-results/applied-card-mobile.png' });
  await page.getByRole('button', { name: 'Trang 2', exact: true }).click();
  await expect(page.locator('.mj-applied-card')).toHaveCount(4);
  await expect(page.locator('.mj-applied-card').first().getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
  await expect(page.locator('.mj-applied-card').nth(1)).toContainText('Không phù hợp');
  await expect(page.locator('.mj-applied-card').nth(2).locator('.mj-application-progress-track .is-done')).toHaveCount(4);
  await expect(page.locator('.mj-pagination')).toContainText('Hiển thị 5 – 8');
  await page.reload();
  await expect(page.locator('.mj-pagination')).toContainText('Hiển thị 5 – 8');
  await page.locator('.mj-upcoming-interview-card').getByRole('link', { name: 'Xem lịch phỏng vấn' }).click();
  await expect(page).toHaveURL('/my-jobs?tab=interviews');
  await expect(page.locator('.mj-schedule-card')).toHaveCount(3);
});
test('applied tab supports empty data, closed jobs, missing HR contacts and API retry', async ({ page }) => {
  const applied = applicationFixtures().slice(0, 1);
  applied[0].job.isClosed = true;
  applied[0].application.recruiterEmail = null;
  applied[0].application.progress = { currentStep: 1, label: 'Mới ứng tuyển' };
  await setup(page, { applied, interviews: [] });
  await page.goto('/my-jobs?tab=applied');
  await expect(page.locator('.mj-applied-card')).toContainText('Đã ngừng tuyển');
  await expect(page.locator('.mj-applied-card').getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
  await expect(page.locator('.mj-applied-card').getByRole('link', { name: 'Nhắn tin với HR' })).toHaveCount(0);
  await expect(page.locator('.mj-applied-card').getByRole('link', { name: 'Xem chi tiết công việc' })).toHaveAttribute('href', `/jobs/${applied[0].job.id}`);
  await expect(page.locator('.mj-upcoming-interview-card')).toContainText('Chưa có lịch phỏng vấn sắp tới');
  applied.splice(0);
  await page.reload();
  await expect(page.locator('.mj-empty')).toContainText('Bạn chưa gửi hồ sơ ứng tuyển');
  await expect(page.locator('.mj-pagination')).toHaveCount(0);
  let failed = true;
  await page.route('**/api/candidate/my-jobs?**', route => failed
    ? route.fulfill({ status: 500, json: { detail: 'Không thể tải đơn ứng tuyển.' } }) : route.fallback());
  await page.reload();
  await expect(page.locator('.mj-error')).toContainText('Không thể tải đơn ứng tuyển.');
  failed = false;
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.locator('.mj-empty')).toContainText('Bạn chưa gửi hồ sơ ứng tuyển');
});
test('saved dashboard uses API, shared resources, tabs, pagination and mobile layout', async ({ page }) => {
  await setup(page);
  const requests = [];
  page.on('request', request => { if (request.url().includes('/api/candidate/my-jobs?')) requests.push(request.url()); });
  await page.goto('/my-jobs');
  await expect(page.locator('.job-listing-card')).toHaveCount(3);
  expect(requests).toHaveLength(1);
  await expect(page.locator('.mj-stat-grid')).toContainText('7');
  await expect(page.locator('.mj-pagination')).toContainText('Hiển thị 1 – 3 trong tổng số 7 việc làm đã lưu');
  await expect(page.locator('header')).toHaveCount(1); await expect(page.locator('footer').filter({ hasText: '©' })).toHaveCount(1);
  await expect(page.locator('.cv-templates')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Cẩm nang & Báo cáo thị trường tuyển dụng 2026' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Kho tiện ích hỗ trợ ứng viên chuẩn 2026' })).toBeVisible();
  await page.setViewportSize({ width: 1284, height: 1000 });
  await page.screenshot({ path: 'test-results/my-jobs-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Trang 2', exact: true }).click();
  await expect(page).toHaveURL('/my-jobs?tab=saved&page=2');
  await expect(page.locator('.mj-pagination')).toContainText('Hiển thị 4 – 6');
  await page.reload(); await expect(page.locator('.mj-pagination')).toContainText('Hiển thị 4 – 6');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/my-jobs-mobile.png', fullPage: true });
  await page.getByRole('link', { name: /Việc làm đã ứng tuyển \(14\)/ }).click();
  await expect(page.locator('.mj-applied-card').first()).toContainText('Đang phỏng vấn');
  await page.getByRole('link', { name: /Lịch phỏng vấn \(3\)/ }).click();
  await expect(page.locator('.mj-schedule-card').first()).toContainText('Senior Fullstack Engineer');
  await page.getByRole('link', { name: /NTD Quan Tâm bạn \(7\)/ }).click();
  await expect(page.locator('.mj-employer-card').first()).toContainText('Panasonic R&D Center Việt Nam');
});
test('unsaving updates server counts, survives reload and availability is persisted', async ({ page }) => {
  await setup(page);
  await page.goto('/saved-jobs'); await expect(page).toHaveURL('/my-jobs?tab=saved');
  await expect(page.locator('.job-listing-card')).toHaveCount(3);
  await page.getByRole('button', { name: `Bỏ lưu ${jobs[0].title}`, exact: true }).click();
  await expect(page.locator('.toast-region')).toContainText('Đã bỏ lưu');
  await expect(page.locator('.mj-pagination')).toContainText('tổng số 6 việc làm đã lưu');
  await page.reload(); await expect(page.locator('.mj-pagination')).toContainText('tổng số 6 việc làm đã lưu');
  await expect(page.getByRole('button', { name: `Bỏ lưu ${jobs[0].title}`, exact: true })).toHaveCount(0);
  for (const label of ['Cân nhắc', 'Tạm khóa', 'Tìm việc']) {
    await page.getByRole('button', { name: label, exact: true }).click();
    await expect(page.getByRole('button', { name: label, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.toast-region')).toContainText(`Đã cập nhật trạng thái tìm việc: ${label}`);
    await page.reload();
    await expect(page.getByRole('button', { name: label, exact: true })).toHaveAttribute('aria-pressed', 'true');
  }
  await page.route('**/api/candidate/my-jobs/status', route => route.fulfill({ status: 500 }));
  await page.getByRole('button', { name: 'Cân nhắc', exact: true }).click();
  await expect(page.locator('.toast-region').getByRole('alert')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tìm việc', exact: true })).toHaveAttribute('aria-pressed', 'true');
});
test('save failures never report success or remove saved data and guests see login', async ({ page }) => {
  await setup(page, { failDelete: true });
  await page.goto('/my-jobs');
  await page.getByRole('button', { name: `Bỏ lưu ${jobs[0].title}`, exact: true }).click();
  await expect(page.locator('.toast-region').getByRole('alert')).toBeVisible();
  await expect(page.locator('.mj-pagination')).toContainText('tổng số 7 việc làm đã lưu');
  await expect(page.getByRole('button', { name: `Bỏ lưu ${jobs[0].title}`, exact: true })).toBeVisible();
  await page.route('**/api/candidate/auth/me', route => route.fulfill({ status: 401 }));
  await page.reload(); await expect(page.getByRole('link', { name: 'Đăng nhập để tiếp tục' })).toBeVisible();
  await expect(page.locator('.mj-stat-grid')).toHaveCount(0);
});

test('unsaving last item clamps pagination and API errors support retry and empty results', async ({ page }) => {
  await setup(page);
  await page.goto('/my-jobs?tab=saved&page=3');
  await expect(page.locator('.job-listing-card')).toHaveCount(1);
  await page.getByRole('button', { name: `Bỏ lưu ${jobs[6].title}`, exact: true }).click();
  await expect(page).toHaveURL('/my-jobs?tab=saved&page=2');
  await expect(page.locator('.mj-pagination')).toContainText('Hiển thị 4 – 6 trong tổng số 6');
  let failed = true;
  await page.route('**/api/candidate/my-jobs?**', route => route.fulfill(failed ? { status: 500 } : { json: {
    fullName: 'Nguyễn Văn An', openToWork: false, stats: { applied: 0, viewed: 0, interviews: 0, saved: 0, followedCompanies: 0 }, tab: 'saved', page: 1, pageSize: 3, totalCount: 0,
    jobs: [], applications: [], companies: [], interviews: [], deadlines: [], recommendations: [],
  } }));
  await page.goto('/my-jobs');
  await expect(page.locator('.mj-list-column').getByRole('alert')).toBeVisible();
  failed = false;
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Bạn chưa lưu việc làm nào' })).toBeVisible();
  await expect(page.locator('.job-listing-card')).toHaveCount(0);
});

test('hired tab only shows confirmed hires and persists after reload', async ({ page }) => {
  await setup(page);
  await page.goto('/my-jobs?tab=applied');
  await page.getByRole('link', { name: 'Đã nhận việc (1)', exact: true }).click();
  await expect(page).toHaveURL('/my-jobs?tab=hired');
  await expect(page.locator('.mj-applied-card')).toHaveCount(1);
  await expect(page.locator('.mj-applied-status')).toHaveText('Đã nhận việc');
  await expect(page.locator('.mj-application-progress-track .is-done')).toHaveCount(4);
  await expect(page.locator('.mj-application-progress-track .is-current')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.mj-applied-card')).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('interview cancellation refreshes when returning to the page and while it stays open', async ({ page }) => {
  await page.clock.install({ time: new Date('2030-08-15T04:45:00Z') });
  const interviews = interviewFixtures(new Date('2030-08-15T07:30:00Z'));
  await setup(page, { interviews });
  await page.goto('/my-jobs?tab=interviews&month=2030-08');
  await expect(page.locator('.mj-schedule-card')).toHaveCount(3);
  interviews[0].status = 'cancelled';
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.locator('.mj-schedule-card')).toHaveCount(2);
  await expect(page.locator('#interview-interview-online')).toHaveCount(0);
  interviews[1].status = 'cancelled';
  await page.clock.fastForward(31000);
  await expect(page.locator('.mj-schedule-card')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Xác nhận tham gia', exact: true })).toHaveCount(0);
});
