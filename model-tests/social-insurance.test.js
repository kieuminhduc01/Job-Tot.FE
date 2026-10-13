import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSocialInsurance,coefficientFor,roundedYears } from '../src/pages/social-insurance/model/social-insurance.js';
const options={decisionMonth:'2026-10',reason:'wait',stopped:true,waitConfirmed:true};
test('2026 yearly adjustments and weighted months produce the detailed example',()=>{
  const result=calculateSocialInsurance([{from:'2019-01',to:'2021-12',salary:'5500000'},{from:'2022-01',to:'2022-04',salary:'6000000'}],options);
  assert.equal(result.totalMonths,40);
  assert.equal(result.adjustedSum,257640000);
  assert.equal(result.average,6441000);
  assert.equal(result.wageMonths,7);
  assert.equal(result.total,45087000);
  assert.deepEqual(result.yearly.map(row=>row.coefficient),[1.2,1.16,1.14,1.11]);
});
test('rounds only residual months and transfers pre-2014 residuals before rounding',()=>{
  for(const [months,expected] of [[0,0],[1,.5],[6,.5],[7,1],[11,1],[12,1],[13,1.5]]) assert.equal(roundedYears(months),expected);
  const mixed=calculateSocialInsurance([{from:'2012-12',to:'2014-01',salary:'1000000'}],options);
  assert.equal(mixed.beforeMonths,13);
  assert.equal(mixed.transferredMonths,1);
  assert.equal(mixed.beforeYears,1);
  assert.equal(mixed.afterYears,.5);
  assert.equal(mixed.wageMonths,2.5);
  const beforeOnly=calculateSocialInsurance([{from:'2012-01',to:'2013-01',salary:'1000000'}],options);
  assert.equal(beforeOnly.beforeYears,1.5);
  assert.equal(beforeOnly.wageMonths,2.25);
});
test('under one year uses contributions with a two-average-month ceiling',()=>{
  const eight=calculateSocialInsurance([{from:'2019-01',to:'2019-08',salary:'1000000'}],options);
  assert.equal(eight.total,2112000);
  assert.equal(eight.underOneYear,true);
  const eleven=calculateSocialInsurance([{from:'2019-01',to:'2019-11',salary:'1000000'}],options);
  assert.equal(eleven.total,2400000);
});
test('checks transition date, full twelve inactive months and retirement limits',()=>{
  const post= [{from:'2025-07',to:'2025-08',salary:'1000000'}];
  assert.equal(calculateSocialInsurance(post,options).eligible,false);
  assert.equal(calculateSocialInsurance(post,{...options,reason:'emigration'}).eligible,true);
  const gap=[{from:'2025-01',to:'2025-09',salary:'1000000'}];
  assert.equal(calculateSocialInsurance(gap,options).eligible,true);
  assert.equal(calculateSocialInsurance(gap,{...options,decisionMonth:'2026-09'}).eligible,false);
  assert.equal(calculateSocialInsurance(gap,{...options,stopped:false}).total,0);
  assert.equal(calculateSocialInsurance([{from:'2000-01',to:'2019-12',salary:'1000000'}],options).eligible,false);
  assert.equal(calculateSocialInsurance([{from:'2000-01',to:'2014-12',salary:'1000000'}],{...options,reason:'retirement'}).eligible,false);
});
test('rejects overlapping periods, invalid months, future dates and invalid salary',()=>{
  const base={from:'2019-01',to:'2019-12',salary:'1000000'};
  for(const rows of [[base,base],[{...base,from:'2019-13'}],[{...base,to:'2018-12'}],[{...base,to:'2027-01'}],[{...base,salary:'0'}],[]]) assert.throws(()=>calculateSocialInsurance(rows,options));
  assert.equal(coefficientFor(1994),5.81);
  assert.equal(coefficientFor(2026),1);
  assert.throws(()=>coefficientFor(2027));
});
