import { test, expect } from '@playwright/test';

test('province dropdown has a styled picker and supports keyboard selection and mobile', async ({ page }) => {
  await page.route('**/api/employer/auth/provinces', route => route.fulfill({ json: [
    { id: 'hanoi', name: 'Hà Nội' },
    { id: 'danang', name: 'Đà Nẵng' },
    ...Array.from({ length: 30 }, (_, index) => ({ id: `province-${index}`, name: `Tỉnh ${index + 1}` })),
  ] }));
  await page.goto('/register?role=employer');
  const select = page.getByRole('combobox');
  await expect(select).toBeEnabled();
  expect(await select.evaluate(element => getComputedStyle(element).appearance)).toBe('base-select');
  await select.click();
  await expect(select).toHaveJSProperty('value', '');
  expect(await select.evaluate(element => element.matches(':open'))).toBe(true);
  const picker = await select.evaluate(element => {
    const style = getComputedStyle(element, '::picker(select)');
    return { radius: style.borderRadius, background: style.backgroundColor, overflow: style.overflowY };
  });
  expect(picker).toEqual({ radius: '12px', background: 'rgb(255, 255, 255)', overflow: 'auto' });
  await page.screenshot({ path: 'test-results/select-province-desktop.png' });
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(select).toHaveValue('hanoi');
  await select.click();
  await page.keyboard.press('Escape');
  await expect(select).toHaveValue('hanoi');
  await page.setViewportSize({ width: 390, height: 844 });
  await select.click();
  await page.screenshot({ path: 'test-results/select-province-mobile.png' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
