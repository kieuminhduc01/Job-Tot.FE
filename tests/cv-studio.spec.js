import { test, expect } from '@playwright/test';
import { seedTokens, tokenSession } from './token-fixtures.js';

const document = { fullName: 'NGUYỄN HOÀNG NAM', headline: 'Senior Fullstack Architect & Cloud DevOps Lead', email: 'nam@example.com', phone: '0900123456', address: 'Hà Nội', website: 'linkedin.com/in/nam', layout: 'one-column', color: '#ff5722', font: 'Roboto', fontSize: 10.5, margin: 15, sections: [
  { id: 'summary', title: 'TÓM TẮT CHUYÊN MÔN', body: 'Kỹ sư phần mềm với 6 năm kinh nghiệm thiết kế hệ thống.\nTập trung vào chất lượng sản phẩm và hiệu quả vận hành.', visible: true },
  { id: 'experience', title: 'KINH NGHIỆM LÀM VIỆC', body: 'Tech Lead & Principal Software Engineer • VNG Corporation\nThiết kế API Gateway và tối ưu hiệu năng hệ thống.\nTối ưu hạ tầng cloud và triển khai Kubernetes.\n\nSenior Fullstack Developer • FPT Software\nXây dựng ứng dụng React, Node.js và PostgreSQL.', visible: true },
  { id: 'skills', title: 'KỸ NĂNG CHUYÊN MÔN', body: 'KIẾN TRÚC & BACKEND\nGolang, TypeScript, Node.js, Python, Microservices\n\nFRONTEND & GIAO DIỆN WEB\nReact.js, Next.js, Tailwind CSS\n\nCLOUD, DEVOPS & CI/CD\nAWS, Kubernetes, Terraform, GitHub Actions', visible: true },
  { id: 'education', title: 'HỌC VẤN & CHỨNG CHỈ', body: 'Đại học Bách Khoa Hà Nội (HUST) • 2014 – 2019\nKỹ sư Khoa học Máy tính\nAWS Certified Solutions Architect', visible: true },
] };
const templates = Array.from({ length: 12 }, (_, i) => ({ id: `template-${i}`, name: i === 0 ? 'Tiên Phong IT 2026' : `Mẫu chuyên nghiệp ${i}`, description: 'Bố cục rõ ràng, tập trung vào kinh nghiệm và thành tựu.', category: i === 0 ? 'IT & Công nghệ' : 'Chuyên nghiệp', publicationState: 'published', version: `template-version-${i}`, document: { ...document, layout: ['one-column', 'two-column', 'sidebar', 'bento'][i % 4], color: ['#ff5722', '#243044', '#8a42ed', '#009879'][i % 4] } }));
async function setup(page, authenticated = false) {
  if (authenticated) await seedTokens(page);
  await page.route('**/api/candidate/auth/me', route => route.fulfill(authenticated ? { json: tokenSession().account } : { status: 401 }));
  await page.route('**/api/employer/auth/me', route => route.fulfill({ status: 401 }));
  await page.route('**/api/candidate/header', route => route.fulfill({ json: { messages: [], notifications: [] } }));
  await page.route('**/api/candidate/saved-jobs', route => route.fulfill({ json: [] }));
  await page.route('**/api/cv-templates', route => route.fulfill({ json: templates }));
  await page.route('**/api/cv-templates/template-0', route => route.fulfill({ json: templates[0] }));
  await page.route('**/api/candidate/online-cvs/cv-1', route => route.fulfill({ json: { id: 'cv-1', title: 'CV Senior Fullstack Architect', version: 'v1', document } }));
}
test('gallery loads once under StrictMode, searches, paginates and reuses common sections', async ({ page }) => {
  await setup(page);
  let requests = 0;
  page.on('request', request => { if (new URL(request.url()).pathname === '/api/cv-templates') requests++; });
  await page.goto('/cv-templates');
  await expect(page.locator('.cv-gallery-card')).toHaveCount(9);
  expect(requests).toBe(1);
  await expect(page.getByRole('heading', { name: /Kho mẫu CV và công cụ/ })).toHaveCount(1);
  await expect(page.getByRole('heading', { name: /Cẩm nang & Báo cáo/ })).toHaveCount(1);
  await expect(page.getByRole('heading', { name: /Kho tiện ích/ })).toHaveCount(1);
  await page.setViewportSize({ width: 1284, height: 950 });
  await page.screenshot({ path: 'test-results/cv-gallery-desktop.png', fullPage: true });
  await page.getByRole('navigation', { name: 'Phân trang mẫu CV' }).getByRole('button', { name: '2', exact: true }).click();
  await expect(page.locator('.cv-gallery-card')).toHaveCount(3);
  await page.getByRole('textbox', { name: 'Tìm mẫu CV' }).fill('Tiên Phong');
  await expect(page.locator('.cv-gallery-card')).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('candidate creates own CV and editor serializes autosaves with returned versions', async ({ page }) => {
  await setup(page, true);
  let creates = 0; let gets = 0;
  const writes = [];
  await page.route('**/api/candidate/online-cvs/from-template/template-0', route => { creates++; return route.fulfill({ status: 201, json: { id: 'cv-1' } }); });
  await page.route('**/api/candidate/online-cvs/cv-1', async route => {
    if (route.request().method() === 'GET') { gets++; return route.fulfill({ json: { id: 'cv-1', title: 'CV Senior Fullstack Architect', version: 'v1', document } }); }
    const input = route.request().postDataJSON(); writes.push(input);
    if (writes.length === 1) await new Promise(resolve => setTimeout(resolve, 700));
    return route.fulfill({ json: { ...input, id: 'cv-1', version: `v${writes.length + 1}` } });
  });
  await page.goto('/cv-templates/template-0');
  await page.getByRole('button', { name: 'Dùng mẫu này', exact: true }).click();
  await expect(page).toHaveURL(/\/my-cvs\/cv-1\/edit/);
  const name = page.getByRole('textbox', { name: 'Họ và tên', exact: true });
  await name.fill('NGUYỄN VĂN AN');
  await expect.poll(() => writes.length).toBe(1);
  await page.getByRole('textbox', { name: 'Vị trí ứng tuyển', exact: true }).fill('Tech Lead');
  await expect(page.locator('.cv-save-status')).toHaveText('Đã lưu');
  await expect.poll(() => writes.length).toBe(2);
  expect(writes[0].version).toBe('v1'); expect(writes[1].version).toBe('v2');
  expect(writes[1].document.fullName).toBe('NGUYỄN VĂN AN'); expect(writes[1].document.headline).toBe('Tech Lead');
  expect(creates).toBe(1); expect(gets).toBe(1);
  await page.setViewportSize({ width: 1284, height: 950 });
  await page.screenshot({ path: 'test-results/cv-editor-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/cv-editor-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('header')).toBeHidden();
  await expect(page.locator('.cv-common-resources')).toBeHidden();
  await expect(page.locator('.cv-print-document')).toContainText('NGUYỄN VĂN AN');
  await page.pdf({ path: 'test-results/cv-print-verification.pdf', printBackground: true, preferCSSPageSize: true });
});
test('layout, theme and sections are editable; conflict does not overwrite server version', async ({ page }) => {
  await setup(page, true);
  let writes = 0;
  await page.route('**/api/candidate/online-cvs/cv-1', route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { id: 'cv-1', title: 'My CV', version: 'v1', document } });
    writes++; return route.fulfill({ status: 409, json: { detail: 'CV đã được chỉnh sửa ở tab khác.' } });
  });
  await page.goto('/my-cvs/cv-1/edit');
  await page.getByRole('button', { name: '2 Cột Cân Bằng', exact: true }).click();
  await expect(page.locator('.cv-paper-wrap .cv-sheet')).toHaveClass(/cv-layout-two-column/);
  await page.getByRole('button', { name: 'Màu & Font', exact: true }).click();
  await page.getByRole('button', { name: 'Màu #009879', exact: true }).click();
  await page.getByRole('button', { name: /Thêm mục/ }).click();
  await expect(page.getByRole('textbox', { name: 'Nội dung MỤC MỚI', exact: true })).toBeVisible();
  await expect(page.locator('.cv-edit-heading')).toContainText('CV đã được chỉnh sửa ở tab khác.');
  await expect(page.getByRole('button', { name: 'Lưu CV', exact: true })).toBeDisabled();
  expect(writes).toBe(1);
  await page.getByRole('link', { name: '← CV của tôi', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('CV có thay đổi chưa lưu');
  await page.getByRole('button', { name: 'Tiếp tục chỉnh sửa', exact: true }).click();
  await expect(page).toHaveURL(/\/my-cvs\/cv-1\/edit/);
});
test('admin logs in, creates and publishes a template using same editor', async ({ page }) => {
  await setup(page);
  await page.route('**/api/admin/auth/me', route => route.fulfill({ json: { id: 'admin', fullName: 'Admin' } }));
  await page.route('**/api/admin/auth/login', route => route.fulfill({ json: { accessToken: 'admin-token', fullName: 'Admin', expiresAt: '2099-01-01T00:00:00Z' } }));
  await page.route('**/api/admin/cv-templates', route => route.request().method() === 'GET' ? route.fulfill({ json: [] }) : route.fulfill({ json: { ...route.request().postDataJSON(), id: 'new-template', version: 'v2' } }));
  await page.route('**/api/admin/cv-templates/new-template', route => route.fulfill({ json: { ...templates[0], id: 'new-template', name: 'Mẫu admin mới', version: 'v2' } }));
  await page.goto('/admin/cv-templates');
  await page.getByRole('textbox', { name: 'Email ho\u1eb7c s\u1ed1 \u0111i\u1ec7n tho\u1ea1i', exact: true }).fill('admin@example.com');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('password123');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.locator('.admin-sidebar')).toBeVisible();
  await expect(page.locator('.admin-nav-item.active')).toHaveText('Mẫu CV');
  await expect(page.getByRole('link', { name: 'Việc làm', exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Tạo mẫu CV', exact: true }).click();
  await expect(page.locator('.admin-sidebar')).toBeVisible();
  await expect(page.locator('.admin-nav-item.active')).toHaveText('Mẫu CV');
  await page.getByRole('textbox', { name: 'Tên mẫu', exact: true }).fill('Mẫu admin mới');
  await page.getByRole('combobox', { name: 'Trạng thái', exact: true }).selectOption('published');
  const request = page.waitForRequest(request => request.url().endsWith('/api/admin/cv-templates') && request.method() === 'POST');
  await page.getByRole('button', { name: 'Lưu mẫu CV', exact: true }).click();
  const posted = (await request).postDataJSON();
  expect(posted.name).toBe('Mẫu admin mới'); expect(posted.publicationState).toBe('published');
  await expect(page).toHaveURL(/\/admin\/cv-templates\/new-template\/edit/);
});
