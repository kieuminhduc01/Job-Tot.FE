import { test, expect } from '@playwright/test';

test('verify fix for base-select line break', async ({ page }) => {
  await page.setContent(`
    <style>
      :root select:not([multiple]):not([size]),
      :root select:not([multiple]):not([size])::picker(select) { appearance: base-select; }
      :root select:not([multiple]):not([size]) {
        box-sizing: border-box;
        min-height: 40px;
        padding-inline: 12px;
        background-color: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 9px;
      }
      :root select::picker-icon {
        content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23758399' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
        width: 16px;
        height: 16px;
        flex-shrink: 0;
        margin-inline: auto 3px;
      }
      
      /* BROKEN: display: block */
      .broken-select {
        display: block;
        width: 100%;
        min-height: 40px;
        padding-inline: 12px 36px;
        font-size: 13px;
      }
      
      /* FIXED: display: flex */
      .fixed-select {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        min-height: 40px;
        padding-inline: 12px;
        font-size: 13px;
      }
    </style>
    <div style="width: 204px; padding: 20px; font-family: Roboto, sans-serif;">
      <p>Broken (display: block):</p>
      <select id="broken" class="broken-select"><option>Tuyển Pro Player Pickleball</option></select>
      <div style="height: 20px;"></div>
      <p>Fixed (display: flex):</p>
      <select id="fixed" class="fixed-select"><option>Tuyển Pro Player Pickleball</option></select>
    </div>
  `);

  const brokenHeight = await page.evaluate(() => document.getElementById('broken').getBoundingClientRect().height);
  const fixedHeight = await page.evaluate(() => document.getElementById('fixed').getBoundingClientRect().height);

  console.log('BROKEN_HEIGHT:', brokenHeight);
  console.log('FIXED_HEIGHT:', fixedHeight);
  
  await page.screenshot({ path: 'test-results/verify-fix.png' });
});
