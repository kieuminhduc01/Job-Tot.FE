# Gross–Net 2026

Route `/tools/gross-net`. No API or database writes: amounts stay in component state. CareerResources, AuthHeader, AuthFooter and PageBreadcrumb are the same shared components used by the company directory. The tools hub and common Gross–Net card link to this route.

Scope: resident Vietnamese employee with an employment contract of at least three months, full-month salary and standard contribution rates. Other deductions, personal union membership dues, nonresident taxation and reduced/exempt employer contributions are outside this model. The user explicitly enters any eligible tax-exempt income already included in Gross; an allowance is not automatically tax-exempt.

## Parameters and sources checked on 2026-10-04

- Monthly deduction: VND 15,500,000 personal; VND 6,200,000 for each eligible dependent. [Decree 253/2026, family deductions](https://xaydungchinhsach.chinhphu.vn/quy-dinh-giam-tru-gia-canh-119260703144038062.htm).
- Five monthly tax slices: first 10m at 5%; next 20m at 10%; next 30m at 20%; next 40m at 30%; remainder at 35%. [Tax withholding rules](https://xaydungchinhsach.chinhphu.vn/quy-dinh-moi-ve-khau-tru-thue-thu-nhap-ca-nhan-119260703150410707.htm). [2026 tax-period applicability](https://xaydungchinhsach.chinhphu.vn/gioi-thieu-luat-thue-thu-nhap-ca-nhan-so-109-2025-qh15-119260123145437408.htm).
- Regional monthly minima: I 5.31m, II 4.73m, III 4.14m, IV 3.7m, from January 2026. Select region using the actual workplace locality in [Decree 293/2025](https://xaydungchinhsach.chinhphu.vn/nghi-dinh-so-293-2025-nd-cp-quy-dinh-muc-luong-toi-thieu-doi-voi-nguoi-lao-dong-lam-viec-theo-hop-dong-lao-dong-119251110172808433.htm).
- Social/health reference: 2.34m in January–June; 2.53m in July–December. Ceiling is 20 times that amount: 46.8m or 50.6m. [Reference change](https://xaydungchinhsach.chinhphu.vn/tu-01-7-chinh-phu-tang-luong-co-so-119260517100243881.htm), [BHXH guidance](https://baohiemxahoi.gov.vn/tintuc/pages/linh-vuc-bao-hiem-y-te.aspx?CateID=0&ItemID=26780).
- Employee: social 8%, health 1.5%, unemployment 1%. Employer: social and occupational accident/disease 17.5%, health 3%, unemployment 1%. [BHXH contribution breakdown](https://baohiemxahoi.gov.vn/tintuc/Pages/tin-tuc-su-kien.aspx?CateID=0&ItemID=24900), [BHXH confirmation](https://baohiemxahoi.gov.vn/chuyen-trang-bhxh-bhyt/tu-van-hoi-dap/Pages/default.aspx?ItemID=28516).
- Unemployment base is capped independently at 20 times regional minimum. [Employment Law 74/2025](https://xaydungchinhsach.chinhphu.vn/toan-van-luat-viec-lam-119250711173403835.htm).
- Employer union funding 2% of capped social-insurance payroll can be toggled; it is separate from the 21.5% insurance total and is not deducted from employee Net. [Decree 105/2026](https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/4/105-ndcp.signed.pdf). Exemptions/reductions are not inferred.

Net = Gross − employee insurance − progressive income tax. Taxable income = max(0, Gross − eligible exempt income − employee insurance − family deductions). Employer cost = Gross + employer insurance + optional union funding.

Amounts are rounded to whole VND per contribution and per tax slice. Net→Gross uses bounded binary search plus a small local scan to handle rounding boundaries. Inputs are checked; a custom insurance salary must be at least the selected regional minimum and not above the resulting Gross. Calculations are estimates for this scope, not a guarantee of every payroll policy. The UI keeps the last calculation visible and marks it stale when any input changes.

Example from the supplied design: Gross 30m, one dependent, eligible exempt income 730k, insurance on Gross → insurance 3.15m, taxable 4.42m, tax 221k, Net 26.629m. Employer insurance is 6.45m; union funding 600k; total 37.05m. The design's employer total was not copied because it does not match these rates.

Tests: `npm run test:salary`; `npx playwright test tests/salary.spec.js tests/tools.spec.js`; `npm run check`. Algorithm tests cover caps, periods, regions, tax slices, inverse conversions and invalid inputs.
