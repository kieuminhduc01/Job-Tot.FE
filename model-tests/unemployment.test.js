import test from 'node:test';
import assert from 'node:assert/strict';
import { benefitDuration, calculateUnemployment, regions } from '../src/pages/unemployment/model/unemployment.js';
const input = { averageSalary: 10000000, region: 0, totalMonths: 36, recentMonths: 12, shortContract: false, lawfulTermination: true, filedInTime: true, waitingCondition: true };
test('10m average, 36 contribution months yields 6m monthly and 18m total', () => {
  const result = calculateUnemployment(input);
  assert.equal(result.monthly, 6000000);
  assert.equal(result.duration, 3);
  assert.equal(result.total, 18000000);
  assert.equal(result.cap, 26550000);
});
test('duration changes only after complete twelve-month increments, capped at 12', () => {
  for (const [months, expected] of [[0,0],[11,0],[12,3],[35,3],[36,3],[37,3],[47,3],[48,4],[59,4],[60,5],[131,10],[132,11],[143,11],[144,12],[160,12],[720,12]]) assert.equal(benefitDuration(months),expected, `${months} months`);
});
test('all four regional ceilings limit monthly benefit, not total award', () => {
  regions.forEach((minimum, region) => {
    const result = calculateUnemployment({ ...input, averageSalary: 100000000, region, totalMonths: 144 });
    assert.equal(result.monthly, minimum * 5);
    assert.equal(result.total, minimum * 5 * 12);
    assert.equal(result.capped, true);
  });
});
test('unconfirmed and insufficient eligibility never produce an awarded result', () => {
  for (const field of ['lawfulTermination','filedInTime','waitingCondition']) {
    const result = calculateUnemployment({...input,[field]:false});
    assert.equal(result.eligible,false);
    assert.equal(result.total,0);
    assert.equal(result.monthly,0);
    assert.equal(result.projectedMonthly,6000000);
    assert.equal(result.reasons.length,1);
  }
  assert.equal(calculateUnemployment({...input,totalMonths:11,recentMonths:11}).duration,0);
  assert.equal(calculateUnemployment({...input,recentMonths:11}).eligible,false);
  assert.equal(calculateUnemployment({...input,shortContract:true,recentMonths:36}).windowMonths,36);
});
test('rejects invalid salary, fractional months, inconsistent history and invalid region', () => {
  for (const change of [{averageSalary:0},{averageSalary:NaN},{averageSalary:1000000001},{region:4},{totalMonths:1.5},{totalMonths:721},{recentMonths:25},{totalMonths:12,recentMonths:13},{shortContract:'true'}]) assert.throws(() => calculateUnemployment({...input,...change}));
});
