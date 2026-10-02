import { test, expect } from '@playwright/test';
import { seedTokens, tokenSession } from './token-fixtures.js';

test('concurrent expired requests rotate once and retry with the new bearer token', async ({ page }) => {
  await seedTokens(page);
  await page.route('**/api/candidate/auth/me', route => route.fulfill({ json: tokenSession().account }));
  let refreshRequests = 0;
  let csrfRequests = 0;
  await page.route('**/api/candidate/auth/csrf', route => { csrfRequests++; return route.fulfill({ status: 404 }); });
  await page.route('**/api/candidate/auth/refresh', async route => {
    refreshRequests++;
    expect(route.request().postDataJSON()).toEqual({ refreshToken: 'test-refresh' });
    await route.fulfill({ json: { ...tokenSession(), accessToken: 'new-access', refreshToken: 'new-refresh' } });
  });
  await page.route('**/api/candidate/profile', route => route.fulfill(
    route.request().headers().authorization === 'Bearer new-access'
      ? { json: { success: true } } : { status: 401 }));
  await page.goto('/jobs');
  const statuses = await page.evaluate(async () => {
    const { candidateFetch } = await import('/src/shared/api/candidate-session.js');
    return Promise.all([1, 2, 3].map(async () => (await candidateFetch('profile')).status));
  });
  expect(statuses).toEqual([200, 200, 200]);
  expect(refreshRequests).toBe(1);
  expect(csrfRequests).toBe(0);
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem('jobtot.candidate.tokens')).refreshToken)).toBe('new-refresh');
});

test('rejected refresh clears the account and redirects the private profile to login', async ({ page }) => {
  await seedTokens(page);
  await page.route('**/api/candidate/auth/me', route => route.fulfill({ status: 401 }));
  await page.route('**/api/candidate/auth/refresh', route => route.fulfill({ status: 401 }));
  await page.goto('/profile');
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => sessionStorage.getItem('jobtot.candidate.tokens'))).toBeNull();
});

test('logout during refresh cannot restore tokens when the refresh response arrives', async ({ page }) => {
  await seedTokens(page);
  await page.route('**/api/candidate/auth/me', route => route.fulfill({ json: tokenSession().account }));
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/api/candidate/profile', route => route.fulfill({ status: 401 }));
  await page.route('**/api/candidate/auth/refresh', async route => {
    await gate;
    await route.fulfill({ json: { ...tokenSession(), accessToken: 'new-access', refreshToken: 'new-refresh' } });
  });
  await page.route('**/api/candidate/auth/logout', route => route.fulfill({ status: 204 }));
  await page.goto('/jobs');
  const refreshRequested = page.waitForRequest('**/api/candidate/auth/refresh');
  await page.evaluate(async () => {
    const { candidateFetch } = await import('/src/shared/api/candidate-session.js');
    window.pendingProfile = candidateFetch('profile');
  });
  await refreshRequested;
  await page.evaluate(async () => {
    const { candidateAuth } = await import('/src/features/authenticate/api/candidate-auth.js');
    await candidateAuth.logout();
  });
  release();
  await page.evaluate(() => window.pendingProfile);
  expect(await page.evaluate(() => sessionStorage.getItem('jobtot.candidate.tokens'))).toBeNull();
});
