import { test, expect } from '@playwright/test';

const campaignId = '11111111-1111-4111-8111-111111111111';
const provinceId = '22222222-2222-4222-8222-222222222222';
const firstId = '33333333-3333-4333-8333-333333333333';
const secondId = '44444444-4444-4444-8444-444444444444';
const firstName = 'Nguyễn Minh Anh';
const candidates = [
  {
    candidateId: firstId, accountId: 'account-1', isInterested: false, isSaved: false, talentId: null,
    profile: {
      name: firstName, headline: 'Senior Frontend Engineer', summary: 'Xây dựng sản phẩm React và hệ thống thiết kế.',
      avatarUrl: null, location: 'Hà Nội', provinceId, yearsExperience: 5, readyStatus: 'looking',
      desiredPosition: 'Senior Engineer', workType: 'Kết hợp (Hybrid)', desiredLocation: 'Hà Nội',
      skills: ['React', 'TypeScript', 'Accessibility'],
    },
    match: {
      score: 92, campaignId, campaignTitle: 'Senior Frontend Engineer',
      reasons: ['Khớp 2/3 kỹ năng của chiến dịch', 'Kinh nghiệm đáp ứng yêu cầu', 'Cùng địa điểm tuyển dụng'],
      matchedSkills: ['React', 'TypeScript'], missingSkills: ['GraphQL'],
    },
  },
  {
    candidateId: secondId, accountId: 'account-2', isInterested: false, isSaved: false, talentId: null,
    profile: {
      name: 'Trần Quang Huy', headline: 'Operations Specialist', summary: 'Tối ưu vận hành và chuỗi cung ứng.',
      avatarUrl: null, location: 'Đà Nẵng', provinceId: 'danang', yearsExperience: 2, readyStatus: 'considering',
      desiredPosition: 'Chuyên viên', workType: 'Toàn thời gian', desiredLocation: 'Đà Nẵng', skills: ['Excel', 'Logistics'],
    },
    match: {
      score: 65, campaignId, campaignTitle: 'Senior Frontend Engineer',
      reasons: ['Đang cân nhắc cơ hội việc làm'], matchedSkills: [], missingSkills: ['React', 'TypeScript', 'GraphQL'],
    },
  },
];
const professionalEntries = {
  experiences: [{ title: 'Frontend Engineer', organization: 'Lotus Software', period: '2021 – nay', description: 'Phát triển ứng dụng React cho 20.000 người dùng.', tags: 'React' }],
  education: [{ title: 'Kỹ sư công nghệ thông tin', organization: 'Đại học Bách Khoa', period: '2017 – 2021', description: 'Chuyên ngành kỹ thuật phần mềm.', tags: '' }],
  certificates: [{ title: 'AWS Certified Developer', organization: 'Amazon Web Services', period: '2025', description: 'Chứng chỉ phát triển ứng dụng cloud.', tags: '' }],
  projects: [{ title: 'Design System', organization: 'Dự án nội bộ', period: '2024', description: 'Thư viện giao diện với hỗ trợ bàn phím.', tags: 'Accessibility' }],
};

async function setup(page, overrides = {}) {
  await page.addInitScript(() => sessionStorage.setItem('jobtot.employer.tokens', JSON.stringify({ accessToken: 'hr-access', refreshToken: 'hr-refresh' })));
  await page.route('**/api/employer/auth/me', route => route.fulfill({ json: { id: 'hr-1', fullName: 'HR Test', companyId: 'company-1', accountType: 'Employer' } }));
  await page.route('**/api/candidate/auth/me', route => route.fulfill({ status: 401 }));
  await page.route('**/api/employer/header', route => route.fulfill({ json: { companyLogoUrl: null, messages: [], notifications: [] } }));
  const state = { items: structuredClone(candidates), metadataSkills: ['React', 'TypeScript', 'GraphQL', 'Excel', 'Logistics'], metadataGets: 0, queries: [], detailQueries: [], detailFlags: {}, mutations: [], failList: false, failMutation: false, ...overrides };
  const stats = () => ({ discoverable: state.items.length, recommended: state.items.filter(item => item.match?.score >= 70).length, interested: state.items.filter(item => item.isInterested).length, saved: state.items.filter(item => item.isSaved).length });
  await page.route('**/api/employer/talent-discovery**', async route => {
    const request = route.request(), url = new URL(request.url());
    expect(request.headers().authorization).toBe('Bearer hr-access');
    if (url.pathname.endsWith('/metadata')) {
      state.metadataGets++;
      return route.fulfill({ json: {
        company: { id: 'company-1', name: 'Lotus Technology', provinceId, province: 'Hà Nội' },
        campaigns: [{ id: campaignId, title: 'Senior Frontend Engineer', department: 'Engineering', province: 'Hà Nội', skills: ['React', 'TypeScript', 'GraphQL'], experienceMinYears: 3 }],
        provinces: [{ id: provinceId, name: 'Hà Nội' }, { id: 'danang', name: 'Đà Nẵng' }],
        skills: state.metadataSkills, stats: stats(),
        matchingExplanation: 'Điểm gợi ý dựa trên kỹ năng, kinh nghiệm và địa điểm tuyển dụng.',
      } });
    }
    if (request.method() === 'PUT') {
      const action = url.pathname.split('/').at(-1), candidate = state.items.find(item => url.pathname.includes(item.candidateId));
      const body = request.postDataJSON();
      state.mutations.push({ action, candidateId: candidate?.candidateId, body });
      if (state.failMutation) return route.fulfill({ status: 503, json: { detail: 'Chưa thể lưu thay đổi. Vui lòng thử lại.' } });
      if (!candidate) return route.fulfill({ status: 404 });
      Object.assign(candidate, state.detailFlags[candidate.candidateId]);
      delete state.detailFlags[candidate.candidateId];
      if (action === 'interest') candidate.isInterested = body.interested;
      if (action === 'saved') { candidate.isSaved = body.saved; candidate.talentId = body.saved ? 'talent-1' : null; }
      return route.fulfill({ json: { isInterested: candidate.isInterested, isSaved: candidate.isSaved, talentId: candidate.talentId } });
    }
    const detail = state.items.find(item => url.pathname.endsWith(`/${item.candidateId}`));
    if (detail) {
      state.detailQueries.push(Object.fromEntries(url.searchParams));
      if (state.detailGate) await state.detailGate;
      return route.fulfill({ json: { ...detail, ...state.detailFlags[detail.candidateId], profile: { ...detail.profile, ...professionalEntries, email: 'private@example.com', phone: '0988999999', birthDate: '1995-01-01', gender: 'Private gender' } } });
    }
    state.queries.push(Object.fromEntries(url.searchParams));
    if (state.failList) return route.fulfill({ status: 503, json: { detail: 'Không thể tải danh sách hồ sơ lúc này.' } });
    let items = state.items.filter(item => {
      const params = url.searchParams, profile = item.profile;
      const keyword = params.get('keyword')?.toLocaleLowerCase('vi-VN');
      return (!keyword || [profile.name, profile.headline, ...profile.skills].some(value => value.toLocaleLowerCase('vi-VN').includes(keyword)))
        && (!params.get('provinceId') || profile.provinceId === params.get('provinceId'))
        && (!params.get('readiness') || profile.readyStatus === params.get('readiness'))
        && (!params.get('skill') || profile.skills.includes(params.get('skill')))
        && (!params.get('minYears') || profile.yearsExperience >= Number(params.get('minYears')))
        && (!params.get('minScore') || item.match?.score >= Number(params.get('minScore')))
        && (params.get('collection') !== 'interested' || item.isInterested)
        && (params.get('collection') !== 'saved' || item.isSaved);
    });
    const totalCount = items.length, pageNumber = Number(url.searchParams.get('page')) || 1, pageSize = Number(url.searchParams.get('pageSize')) || 6;
    items = items.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
    return route.fulfill({ json: { items, totalCount, page: pageNumber, pageSize, stats: stats() } });
  });
  return state;
}

test('discovery loads authenticated real results once and supports search and campaign filters', async ({ page }) => {
  const state = await setup(page);
  await page.goto('/employer/discover');
  const recruitmentTabs = page.getByRole('navigation', { name: 'Quản lý tuyển dụng', exact: true });
  await expect(recruitmentTabs.getByRole('link')).toHaveCount(4);
  await expect(recruitmentTabs.getByRole('link', { name: 'Tìm nhân tài', exact: true })).toHaveAttribute('aria-current', 'page');
  const tabsBounds = await recruitmentTabs.boundingBox();
  const heroBounds = await page.locator('.td-hero').boundingBox();
  expect(tabsBounds.y + tabsBounds.height).toBeLessThanOrEqual(heroBounds.y);
  await expect(page.getByRole('heading', { name: firstName, exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Trần Quang Huy', exact: true })).toBeVisible();
  expect(state.metadataGets).toBe(1);
  expect(state.queries).toHaveLength(1);
  await page.getByLabel('Đối chiếu chiến dịch', { exact: true }).selectOption(campaignId);
  await expect.poll(() => state.queries.at(-1)?.campaignId).toBe(campaignId);
  await page.getByLabel('Tìm hồ sơ ứng viên', { exact: true }).fill('React');
  await page.getByLabel('Tìm hồ sơ ứng viên', { exact: true }).press('Enter');
  await expect.poll(() => state.queries.at(-1)?.keyword).toBe('React');
  await expect(page.getByRole('heading', { name: 'Trần Quang Huy', exact: true })).toHaveCount(0);
  await page.getByLabel('Địa điểm ứng viên', { exact: true }).selectOption(provinceId);
  await page.getByRole('button', { name: 'Kỹ năng', exact: true }).click();
  await page.getByRole('option', { name: 'React', exact: true }).click();
  await page.getByLabel('Kinh nghiệm tối thiểu', { exact: true }).selectOption('3');
  await page.getByLabel('Trạng thái tìm việc', { exact: true }).selectOption('looking');
  await page.getByLabel('Mức phù hợp tối thiểu', { exact: true }).selectOption('70');
  await page.getByLabel('Sắp xếp hồ sơ', { exact: true }).selectOption('experience');
  await expect.poll(() => state.queries.at(-1)).toMatchObject({ keyword: 'React', campaignId, provinceId, skill: 'React', minYears: '3', readiness: 'looking', minScore: '70', sort: 'experience', page: '1' });
  await expect(page.getByRole('heading', { name: firstName, exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Tìm hồ sơ ứng viên', { exact: true })).toHaveValue('React');
  await expect(page.getByLabel('Đối chiếu chiến dịch', { exact: true })).toHaveValue(campaignId);
  await expect(page.getByRole('button', { name: 'Kỹ năng', exact: true })).toHaveText('React');
  await expect(page.getByLabel('Kinh nghiệm tối thiểu', { exact: true })).toHaveValue('3');
  await expect(page.getByRole('heading', { name: firstName, exact: true })).toBeVisible();
});

test('skill dropdown searches locally, preserves exact values, supports keyboard and fits mobile', async ({ page }) => {
  const items = structuredClone(candidates);
  items[0].profile.skills.push('Đàm phán');
  const state = await setup(page, {
    items,
    metadataSkills: ['React', 'React Native', 'TypeScript', 'Đàm phán', 'Kỹ năng giao tiếp và phối hợp với nhiều nhóm trong dự án'],
  });
  await page.goto('/employer/discover');
  await expect(page.getByRole('heading', { name: firstName, exact: true })).toBeVisible();
  const trigger = page.getByRole('button', { name: 'Kỹ năng', exact: true });
  const popup = page.getByRole('dialog', { name: 'Chọn kỹ năng', exact: true });
  const search = page.getByRole('combobox', { name: 'Tìm kỹ năng', exact: true });
  const options = page.getByRole('listbox', { name: 'Danh sách kỹ năng', exact: true });
  const initialQueries = state.queries.length;
  await trigger.click();
  await expect(search).toBeFocused();
  await search.fill('DAM PHAN');
  await expect(options.getByRole('option', { name: 'Đàm phán', exact: true })).toBeVisible();
  await expect(options.getByRole('option', { name: 'React', exact: true })).toHaveCount(0);
  await expect(options.getByRole('option', { name: 'Tất cả kỹ năng', exact: true })).toBeVisible();
  expect(state.queries).toHaveLength(initialQueries);
  expect(new URL(page.url()).searchParams.has('skill')).toBe(false);
  await options.getByRole('option', { name: 'Đàm phán', exact: true }).click();
  await expect(popup).toHaveCount(0);
  await expect(trigger).toHaveText('Đàm phán');
  await expect(trigger).toBeFocused();
  await expect.poll(() => state.queries.at(-1)?.skill).toBe('Đàm phán');
  expect(new URL(page.url()).searchParams.get('skill')).toBe('Đàm phán');
  await expect(page.getByRole('heading', { name: firstName, exact: true })).toBeVisible();

  await trigger.click();
  await expect(search).toHaveValue('');
  const selectedQueries = state.queries.length;
  await search.fill('nothing matches this skill');
  await expect(popup.getByRole('status')).toHaveText('Không tìm thấy kỹ năng phù hợp.');
  await options.getByRole('option', { name: 'Tất cả kỹ năng', exact: true }).click();
  await expect(trigger).toHaveText('Tất cả kỹ năng');
  await expect.poll(() => state.queries.length).toBe(selectedQueries + 1);
  expect(state.queries.at(-1).skill).toBeUndefined();
  expect(new URL(page.url()).searchParams.has('skill')).toBe(false);

  await trigger.click();
  await search.fill('REA');
  await search.press('Home');
  await search.press('ArrowDown');
  await search.press('ArrowDown');
  await search.press('ArrowUp');
  await search.press('End');
  await search.press('ArrowUp');
  await search.press('Enter');
  await expect(trigger).toHaveText('React');
  await expect.poll(() => state.queries.at(-1)?.skill).toBe('React');
  await expect(trigger).toBeFocused();

  await trigger.click();
  await expect(search).toHaveValue('');
  await search.fill('TypeScript');
  await search.press('Escape');
  await expect(popup).toHaveCount(0);
  await expect(trigger).toHaveText('React');
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(search).toHaveValue('');
  await page.getByRole('heading', { name: 'Bộ lọc hồ sơ', exact: true }).click();
  await expect(popup).toHaveCount(0);
  await expect(trigger).toHaveText('React');

  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await trigger.click();
    await expect(popup).toBeVisible();
    const bounds = await popup.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
    expect(await popup.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/employer-discovery-skills-${width}.png` });
    await search.press('Escape');
  }
});

test('interest and talent saving persist, collection tabs filter, and failed writes retain state', async ({ page }) => {
  const state = await setup(page);
  await page.goto('/employer/discover');
  const interest = page.getByRole('button', { name: `Quan tâm ${firstName}`, exact: true });
  await expect(interest).toBeVisible();
  state.failMutation = true;
  await interest.click();
  await expect(page.getByRole('alert').filter({ hasText: 'Chưa thể lưu thay đổi' }).first()).toBeVisible();
  await expect(interest).toBeEnabled();
  expect(state.items[0].isInterested).toBe(false);
  state.failMutation = false;
  await interest.click();
  await expect(page.getByRole('button', { name: `Bỏ quan tâm ${firstName}`, exact: true })).toBeVisible();
  await page.getByRole('button', { name: `Lưu tài năng ${firstName}`, exact: true }).click();
  await expect(page.getByRole('button', { name: `Bỏ lưu ${firstName}`, exact: true })).toBeVisible();
  expect(state.mutations.at(-1)).toEqual({ action: 'saved', candidateId: firstId, body: { saved: true } });
  await page.reload();
  await expect(page.getByRole('button', { name: `Bỏ quan tâm ${firstName}`, exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: `Bỏ lưu ${firstName}`, exact: true })).toBeVisible();
  await page.getByRole('navigation', { name: 'Danh sách hồ sơ' }).getByRole('button', { name: /Đang quan tâm/ }).click();
  await expect.poll(() => state.queries.at(-1)?.collection).toBe('interested');
  await expect(page.getByRole('heading', { name: 'Trần Quang Huy', exact: true })).toHaveCount(0);
  await page.getByRole('navigation', { name: 'Danh sách hồ sơ' }).getByRole('button', { name: /Đã lưu tài năng/ }).click();
  await expect.poll(() => state.queries.at(-1)?.collection).toBe('saved');
  await page.getByRole('button', { name: `Bỏ lưu ${firstName}`, exact: true }).click();
  await expect(page.getByRole('heading', { name: firstName, exact: true })).toHaveCount(0);
  expect(state.items[0].isInterested).toBe(true);
  expect(state.items[0].isSaved).toBe(false);
});

test('professional profile detail and discovery layout remain usable on desktop and mobile', async ({ page }) => {
  const state = await setup(page);
  await page.goto('/employer/discover');
  await expect(page.getByRole('heading', { name: firstName, exact: true })).toBeVisible();
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    const overflow = await page.evaluate(() => [...document.querySelectorAll('body *')].map(element => ({ tag: element.tagName, className: String(element.className), right: element.getBoundingClientRect().right })).filter(element => element.right > innerWidth + 1));
    const fits = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    if (!fits) await page.screenshot({ path: `test-results/employer-discovery-overflow-${width}.png`, fullPage: true });
    expect(fits, `Page overflow at ${width}px: ${JSON.stringify(overflow.slice(0, 12))}`).toBe(true);
  }
  await page.screenshot({ path: 'test-results/employer-discovery-desktop.png', fullPage: true });
  await page.getByLabel('Đối chiếu chiến dịch', { exact: true }).selectOption(campaignId);
  await expect(page.getByRole('heading', { name: firstName, exact: true })).toBeVisible();
  await page.getByRole('button', { name: `Xem hồ sơ ${firstName}`, exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Lotus Software');
  await expect(dialog).toContainText('Đại học Bách Khoa');
  await expect(dialog).toContainText('AWS Certified Developer');
  await expect(dialog).toContainText('Design System');
  expect(state.detailQueries.at(-1)?.campaignId).toBe(campaignId);
  await expect(dialog).not.toContainText('private@example.com');
  await expect(dialog).not.toContainText('0988999999');
  await expect(dialog).not.toContainText('1995-01-01');
  await expect(dialog).not.toContainText('Private gender');
  await page.screenshot({ path: 'test-results/employer-discovery-detail-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/employer-discovery-detail-mobile.png' });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await page.screenshot({ path: 'test-results/employer-discovery-mobile.png', fullPage: true });
});

test('collection refetch and profile detail use the latest shared company state', async ({ page }) => {
  const state = await setup(page);
  await page.goto('/employer/discover');
  await page.getByRole('button', { name: `Quan tâm ${firstName}`, exact: true }).click();
  await expect(page.getByRole('button', { name: `Bỏ quan tâm ${firstName}`, exact: true })).toBeVisible();

  // A second recruiter removes interest after this browser's mutation completed.
  state.items[0].isInterested = false;
  await page.getByLabel('Sắp xếp hồ sơ', { exact: true }).selectOption('newest');
  await expect.poll(() => state.queries.at(-1)?.sort).toBe('newest');
  await expect(page.getByRole('button', { name: `Quan tâm ${firstName}`, exact: true })).toBeVisible();

  // The detail response is newer than the list's earlier snapshot.
  state.detailFlags[firstId] = { isInterested: true, isSaved: true, talentId: 'talent-1' };
  let releaseDetail;
  state.detailGate = new Promise(resolve => { releaseDetail = resolve; });
  await page.getByRole('button', { name: `Xem hồ sơ ${firstName}`, exact: true }).click();
  const dialog = page.getByRole('dialog');
  try {
    await expect(dialog.getByRole('button', { name: `Quan tâm ${firstName}`, exact: true })).toBeDisabled();
    await expect(dialog.getByRole('button', { name: `Lưu tài năng ${firstName}`, exact: true })).toBeDisabled();
  } finally { releaseDetail(); state.detailGate = null; }
  await expect(dialog.getByRole('button', { name: `Bỏ quan tâm ${firstName}`, exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: `Bỏ lưu ${firstName}`, exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: `Bỏ quan tâm ${firstName}`, exact: true }).click();
  await expect(dialog.getByRole('button', { name: `Quan tâm ${firstName}`, exact: true })).toBeVisible();
  expect(state.mutations.at(-1)).toEqual({ action: 'interest', candidateId: firstId, body: { interested: false } });
  await dialog.getByRole('button', { name: `Bỏ lưu ${firstName}`, exact: true }).click();
  await expect(dialog.getByRole('button', { name: `Lưu tài năng ${firstName}`, exact: true })).toBeVisible();
  expect(state.mutations.at(-1)).toEqual({ action: 'saved', candidateId: firstId, body: { saved: false } });
});

test('list failure offers retry without discarding the selected campaign', async ({ page }) => {
  const state = await setup(page);
  await page.goto('/employer/discover');
  await expect(page.getByRole('heading', { name: firstName, exact: true })).toBeVisible();
  state.failList = true;
  await page.getByLabel('Đối chiếu chiến dịch', { exact: true }).selectOption(campaignId);
  await expect(page.getByRole('alert').filter({ hasText: 'Không thể tải danh sách hồ sơ lúc này' })).toBeVisible();
  await expect(page.getByLabel('Đối chiếu chiến dịch', { exact: true })).toHaveValue(campaignId);
  state.failList = false;
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.getByRole('heading', { name: firstName, exact: true })).toBeVisible();
  expect(state.queries.at(-1).campaignId).toBe(campaignId);
});
