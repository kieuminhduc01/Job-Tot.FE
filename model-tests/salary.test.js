import { test } from 'node:test';
import assert from 'node:assert/strict';
import { convertSalary, calculateGross } from '../src/pages/salary/model/salary.js';
const options = { period: 'second', region: 0, insuranceMode: 'gross', insuranceSalary: 30000000, dependents: 1, allowance: 730000, includeUnion: true };
test('30m example matches net and separates employer costs', () => {
  const value = convertSalary(30000000, options);
  assert.equal(value.insurance, 3150000); assert.equal(value.taxable, 4420000); assert.equal(value.tax, 221000); assert.equal(value.net, 26629000);
  assert.equal(value.employerInsurance, 6450000); assert.equal(value.employer.union, 600000); assert.equal(value.employerCost, 37050000);
});
test('insurance caps depend on period and regional unemployment cap', () => {
  const value = convertSalary(150000000, { ...options, region: 3 });
  assert.equal(value.socialBase, 50600000); assert.equal(value.unemploymentBase, 74000000);
  assert.equal(value.social, 4048000); assert.equal(value.health, 759000); assert.equal(value.unemployment, 740000);
  assert.equal(convertSalary(150000000, { ...options, period: 'first' }).socialBase, 46800000);
});
test('five brackets apply to slices and deductions never generate negative tax', () => {
  const value = calculateGross(160000000, { ...options, allowance: 0, dependents: 0 });
  assert.deepEqual(value.taxes.slice(0, 4).map(row => row.tax), [500000, 2000000, 6000000, 12000000]);
  assert.equal(convertSalary(5310000, { ...options, dependents: 10, allowance: 0 }).tax, 0);
});
test('inverse conversion round-trips across caps, custom base and all regions', () => {
  for (const region of [0, 1, 2, 3]) for (const gross of [5310000, 15000000, 30000000, 50600000, 100000000, 200000000]) for (const insuranceMode of ['gross', 'custom']) {
    const config = { ...options, region, insuranceMode, insuranceSalary: 5310000, allowance: 0 };
    const value = convertSalary(gross, config);
    const inverse = convertSalary(value.net, config, 'net');
    assert.ok(Math.abs(inverse.net - value.net) <= 1);
    assert.ok(Math.abs(inverse.gross - gross) <= 3);
  }
});
test('rejects invalid amounts, fractional dependents and impossible custom base', () => {
  assert.throws(() => convertSalary(0, options)); assert.throws(() => convertSalary(NaN, options));
  assert.throws(() => convertSalary(30000000, { ...options, dependents: 1.5 }));
  assert.throws(() => convertSalary(30000000, { ...options, allowance: 31000000 }));
  assert.throws(() => convertSalary(30000000, { ...options, insuranceMode: 'custom', insuranceSalary: 40000000 }));
  assert.throws(() => convertSalary(1000, options, 'net'));
});
