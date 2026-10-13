import {test,expect} from '@playwright/test';
const session={account:{id:'verified-user',fullName:'Verified user',accountType:'Candidate'},accessToken:'verified-access',refreshToken:'verified-refresh',expiresAt:'2099-01-01T00:00:00Z',refreshExpiresAt:'2099-01-01T00:00:00Z'};
test.beforeEach(async({page})=>{
  await page.route('**/api/candidate/auth/me',route=>route.fulfill({status:401}));
  await page.route('**/api/employer/auth/me',route=>route.fulfill({status:401}));
  await page.route('**/api/candidate/header',route=>route.fulfill({json:{messages:[],notifications:[]}}));
  await page.route('**/api/candidate/saved-jobs',route=>route.fulfill({json:[]}));
  await page.route('**/api/jobs?**',route=>route.fulfill({json:{items:[],totalCount:0,page:1,pageSize:10}}));
  await page.route('**/api/jobs/filters',route=>route.fulfill({json:{salaryBands:[],experienceLevels:[],positionLevels:[],employmentTypes:[]}}));
});
test('registration waits for email code before sending registration',async({page})=>{
  let registered=0;
  await page.route('**/api/candidate/auth/email/request',route=>route.fulfill({json:{challengeId:'challenge'}}));
  await page.route('**/api/candidate/auth/email/verify',route=>{expect(route.request().postDataJSON()).toEqual({email:'verify@example.com',challengeId:'challenge',code:'123456'});return route.fulfill({json:{verificationToken:'proof'}});});
  await page.route('**/api/candidate/auth/register',route=>{registered++;expect(route.request().postDataJSON().emailVerificationToken).toBe('proof');return route.fulfill({status:201,json:session});});
  await page.goto('/register');
  await page.locator('#fullName').fill('Verified user');await page.locator('#identity').fill('verify@example.com');await page.locator('#password').fill('password123!');await page.locator('#confirmPassword').fill('password123!');
  await page.getByRole('button',{name:'Đăng ký tài khoản miễn phí',exact:true}).click();
  await expect(page.getByLabel('Mã xác thực email',{exact:true})).toBeVisible();expect(registered).toBe(0);
  await page.getByLabel('Mã xác thực email',{exact:true}).fill('123456');
  await page.getByRole('button',{name:'Đăng ký tài khoản miễn phí',exact:true}).click();
  await expect.poll(()=>registered).toBe(1);
});
test('temporary password forces a new password before login tokens are saved',async({page})=>{
  let logins=0,changed=0;
  await page.route('**/api/candidate/auth/login',route=>{logins++;if(logins===1)return route.fulfill({status:428,json:{detail:'Đặt mật khẩu mới',changeToken:'change-proof'}});expect(route.request().postDataJSON().password).toBe('newpassword456!');return route.fulfill({json:session});});
  await page.route('**/api/candidate/auth/email/change-temporary-password',route=>{changed++;expect(route.request().postDataJSON()).toEqual({token:'change-proof',password:'newpassword456!',confirmPassword:'newpassword456!'});return route.fulfill({status:204});});
  await page.goto('/login');await page.locator('#identity').fill('verify@example.com');await page.locator('#password').fill('temporary-password');
  await page.getByRole('button',{name:'Đăng nhập ngay',exact:true}).click();
  await expect(page.getByLabel('Mật khẩu mới',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>sessionStorage.getItem('jobtot.candidate.tokens'))).toBeNull();
  await page.getByLabel('Mật khẩu mới',{exact:true}).fill('newpassword456!');await page.getByLabel('Xác nhận mật khẩu mới',{exact:true}).fill('newpassword456!');
  await page.getByRole('button',{name:'Đăng nhập ngay',exact:true}).click();
  await expect.poll(()=>changed).toBe(1);await expect.poll(()=>logins).toBe(2);
});
