import { test, expect } from '@playwright/test';

const campaignId = '11111111-1111-4111-8111-111111111111';
const provinceId = '22222222-2222-4222-8222-222222222222';

test('debug discovery select layout with flex fix', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('jobtot.employer.tokens', JSON.stringify({ accessToken: 'hr-access', refreshToken: 'hr-refresh' })));
  await page.route('**/api/employer/auth/me', route => route.fulfill({ json: { id: 'hr-1', fullName: 'HR Test', companyId: 'company-1', accountType: 'Employer' } }));
  await page.route('**/api/candidate/auth/me', route => route.fulfill({ status: 401 }));
  await page.route('**/api/employer/header', route => route.fulfill({ json: { companyLogoUrl: null, messages: [], notifications: [] } }));
  await page.route('**/api/employer/talent-discovery**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/metadata')) {
      return route.fulfill({ json: {
        company: { id: 'company-1', name: 'Lotus Technology', provinceId, province: 'Hà Nội' },
        campaigns: [{ id: campaignId, title: 'Tuyển Pro Player Pickleball', department: 'Engineering', province: 'Hà Nội', skills: ['Pickleball'], experienceMinYears: 3 }],
        provinces: [{ id: provinceId, name: 'Hà Nội' }, { id: 'danang', name: 'Đà Nẵng' }],
        skills: ['Pickleball', 'Tennis'],
        stats: { discoverable: 10, recommended: 5, interested: 2, saved: 1 },
        matchingExplanation: 'Điểm gợi ý.',
      } });
    }
    return route.fulfill({ json: { items: [], totalCount: 0 } });
  });

  await page.goto('/employer/discover');
  await page.waitForSelector('.td-filter-panel select');
  
  // Inject the fix: display: flex on .td-filter-panel select
  await page.addStyleTag({
    content: `
      .td-filter-panel select {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
      }
    `
  });

  const info = await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('.td-filter-panel select'));
    const skillTrigger = document.querySelector('.td-skill-trigger');
    const skillRect = skillTrigger?.getBoundingClientRect();
    return {
      skillTriggerHeight: skillRect?.height,
      selects: selects.map(s => {
        const cs = getComputedStyle(s);
        const rect = s.getBoundingClientRect();
        return {
          label: s.getAttribute('aria-label'),
          text: s.selectedOptions?.[0]?.textContent,
          display: cs.display,
          width: rect.width,
          height: rect.height,
        };
      })
    };
  });
  console.log('SELECT_DEBUG_INFO_FIXED:', JSON.stringify(info, null, 2));
  await page.screenshot({ path: 'test-results/discovery-debug-fixed.png' });
});
