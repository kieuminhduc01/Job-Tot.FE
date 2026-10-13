import { test, expect } from '@playwright/test';

for (const viewport of [{ width: 1920, height: 1080 }, { width: 1280, height: 1400 }, { width: 390, height: 844 }]) {
  test(`shared footer follows content and fills viewport at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.route(/\/api\/(?!.*\.js(?:\?|$))/, route => {
      const url = route.request().url();
      if (url.includes('/auth/me')) return route.fulfill({ status: 401 });
      if (url.includes('/career-articles/missing')) return route.fulfill({ status: 404 });
      if (url.endsWith('/career-articles') || url.endsWith('/cv-templates')) return route.fulfill({ json: [] });
      return route.fulfill({ status: 503 });
    });
    for (const path of ['/career-articles', '/career-articles/missing', '/login', '/register', '/reset-password', '/companies', '/cv-templates', '/my-cvs', '/my-jobs', '/messages', '/tools', '/unknown-page']) {
      await page.goto(path);
      const footer = page.locator('.site-footer');
      await expect(footer, `Footer on ${path}`).toBeAttached();
      await expect.poll(() => footer.evaluate(element => {
        const rect = element.getBoundingClientRect();
        const main = element.parentElement.querySelector(':scope > main');
        return rect.bottom >= window.innerHeight - 1 && (!main || rect.top >= main.getBoundingClientRect().bottom - 1);
      }), { message: `Footer layout on ${path}` }).toBe(true);
      await footer.scrollIntoViewIfNeeded();
      expect(await footer.evaluate(element => Math.abs(element.getBoundingClientRect().bottom + window.scrollY - document.documentElement.scrollHeight))).toBeLessThanOrEqual(2);
    }
  });
}
