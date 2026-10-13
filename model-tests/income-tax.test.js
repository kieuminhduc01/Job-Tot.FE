import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateIncomeTax, progressiveTax } from '../src/pages/income-tax/model/tax.js';
const options = { period: 'second', region: 0, insuranceMode: 'gross', insuranceSalary: 30000000, dependents: 1, allowance: 0, includeUnion: false };
test('shared insurance, family deduction and tax calculation agree', () => {
  const result = calculateIncomeTax(30000000, options);
  assert.equal(result.insurance, 3150000);
  assert.equal(result.taxable, 5150000);
  assert.equal(result.tax, 257500);
  assert.equal(result.oldTax, 967500);
  assert.equal(result.saving, 710000);
});
test('five bands tax only the slice in each band', () => {
  assert.deepEqual(progressiveTax(12742450).map(row => row.tax), [500000,274245,0,0,0]);
});
test('pension caps, donations, zero taxable income and validation', () => {
  const result = calculateIncomeTax(30000000, options, 730000, 6000000);
  assert.equal(result.pensionDeduction, 3000000);
  assert.equal(result.taxable, 1420000);
  assert.equal(result.tax, 71000);
  assert.equal(calculateIncomeTax(30000000, options, 99999999).tax, 0);
  assert.throws(() => calculateIncomeTax(30000000, options, -1));
  assert.throws(() => calculateIncomeTax(30000000, {...options, dependents: 1.5}));
});
