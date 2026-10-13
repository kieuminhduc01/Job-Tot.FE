import {test,expect} from '@playwright/test';
const id='11111111-1111-1111-1111-111111111111';
const account={id:'hr-1',fullName:'HR Test',companyId:'company-1',accountType:'Employer'};
const metadata={currentRecruiterId:'hr-1',isCompanyAdmin:true,canPublish:true,industries:[{id:'industry',name:'IT'}],provinces:[{id:'province',name:'Hà Nội'}],employmentTypes:[{id:'type',name:'Toàn thời gian'}],recruiters:[{id:'hr-1',name:'HR Test'}]};
const document={title:'Senior Engineer',department:'Technology',workAddress:'Hà Nội',description:'## Công việc\nBuild software',requirements:'Experience',industryId:'industry',provinceId:'province',employmentTypeId:'type',ownerRecruiterId:'hr-1',workMode:'hybrid',seniority:'employee',openings:2,startDate:'2026-01-01',endDate:'2027-01-01',salaryMin:35000000,salaryMax:55000000,salaryVisible:true,ageMin:null,ageMax:null,genderPreference:'any',campaignStatus:'Running',revision:'2026-10-05T00:00:00Z',skills:['Docker'],benefits:[{title:'Insurance',description:'Health care'}],stages:[{id:'stage-1',name:'Screening',kind:'Online'}]};
async function setup(page){
  await page.route('**/api/employer/header',route=>route.fulfill({json:{companyLogoUrl:null,avatarUrl:null,messages:[],notifications:[]}}));
  await page.addInitScript(()=>sessionStorage.setItem('jobtot.employer.tokens',JSON.stringify({accessToken:'hr-access',refreshToken:'hr-refresh'})));
  await page.route('**/api/employer/auth/me',route=>route.fulfill({json:account}));
  await page.route('**/api/candidate/auth/me',route=>route.fulfill({status:401}));
}
test('unsaved campaign warns on reload and navigation, and clears after saving',async({page})=>{
  await setup(page);let stored=structuredClone(document);
  await page.route('**/api/employer/campaigns**',route=>{
    if(new URL(route.request().url()).pathname==='/api/employer/campaigns')return route.fulfill({json:{items:[],totalCount:0,page:1,pageSize:5,stats:{running:0,applications:0,interviews:0,hired:0},interviews:[]}});
    if(route.request().url().endsWith('/metadata'))return route.fulfill({json:metadata});
    if(route.request().method()==='PUT')stored=route.request().postDataJSON();
    return route.fulfill({json:{id,document:stored}});
  });
  await page.goto(`/employer/campaigns/${id}/edit`);
  const title=page.getByLabel('Tiêu đề chiến dịch / Vị trí tuyển dụng',{exact:true});
  await expect(title).toHaveValue(document.title);
  await title.fill('Unsaved campaign');
  const warning=page.waitForEvent('dialog');
  const reload=page.reload({timeout:3000}).catch(()=>null);
  const dialog=await warning;expect(dialog.type()).toBe('beforeunload');await dialog.dismiss();await reload;
  await expect(title).toHaveValue('Unsaved campaign');
  await page.getByRole('link',{name:'Hủy bỏ / Quay lại'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button',{name:'Tiếp tục chỉnh sửa',exact:true}).click();
  await expect(title).toHaveValue('Unsaved campaign');
  await page.getByRole('button',{name:'Lưu',exact:true}).click();
  await expect(page.getByRole('status')).toHaveText('Đã lưu chiến dịch thành công.');
  await page.getByRole('link',{name:'Hủy bỏ / Quay lại'}).click();
  await expect(page).toHaveURL(/\/employer\/campaigns$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('list and editor load once in StrictMode, save changes and preserve inputs on failure',async({page})=>{
  await setup(page);let lists=0,metas=0,gets=0,stored=structuredClone(document),fail=false;
  await page.route('**/api/employer/campaigns**',route=>{
    const url=new URL(route.request().url());
    if(url.pathname.endsWith('/metadata')){metas++;return route.fulfill({json:metadata});}
    if(url.pathname.endsWith(id)){
      if(route.request().method()==='PUT'){
        expect(route.request().headers().authorization).toBe('Bearer hr-access');
        if(fail)return route.fulfill({status:503});
        stored={...route.request().postDataJSON(),revision:'2026-10-05T01:00:00Z'};
      }else gets++;
      return route.fulfill({json:{id,document:stored}});
    }
    lists++;return route.fulfill({json:{items:[{id,...stored,applications:12,fresh:3,interviews:2,offers:1}],totalCount:1,page:1,pageSize:5,stats:{running:1,applications:12,interviews:0,hired:2},interviews:[]}});
  });
  await page.goto('/employer/campaigns');await expect(page.getByRole('link',{name:'Senior Engineer',exact:true})).toBeVisible();expect(lists).toBe(1);
  await expect(page.locator('header').getByRole('link',{name:'Chiến dịch',exact:true})).toHaveAttribute('aria-current','page');
  await page.getByLabel('Ghi chú nhanh').fill('Duyệt CV');await page.getByRole('button',{name:'Thêm ghi chú',exact:true}).click();await expect(page.locator('.cp-notes')).toContainText('Duyệt CV');
  await page.setViewportSize({width:1284,height:1000});await page.screenshot({path:'test-results/campaign-list-desktop.png',fullPage:true});
  for (const width of [360, 390, 768, 1024, 1284]) {
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), `Page overflow at ${width}px`).toBe(true);
    expect(await page.locator('.cp-table-scroll').evaluate(el=>el.scrollWidth<=el.clientWidth), `Table overflow at ${width}px`).toBe(true);
    await expect(page.getByRole('link',{name:'Senior Engineer',exact:true})).toBeVisible();
    await page.screenshot({path:`test-results/campaign-list-${width}.png`,fullPage:true});
  }
  await page.getByRole('link',{name:'Senior Engineer',exact:true}).click();await expect(page.getByLabel('Tiêu đề chiến dịch / Vị trí tuyển dụng',{exact:true})).toHaveValue('Senior Engineer');expect(metas).toBe(1);expect(gets).toBe(1);
  await page.getByLabel('Kỹ năng mới').fill('Kubernetes');await page.getByLabel('Kỹ năng mới').press('Enter');
  fail=true;await page.getByRole('button',{name:'Lưu',exact:true}).click();await expect(page.getByRole('alert')).toBeVisible();await expect(page.locator('.cp-tags')).toContainText('Kubernetes');
  fail=false;await page.getByRole('button',{name:'Lưu',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Đã lưu chiến dịch thành công.');expect(stored.skills).toEqual(['Docker','Kubernetes']);
  await page.getByRole('button',{name:'Tạm dừng chiến dịch',exact:true}).click();await expect(page.getByRole('button',{name:'Tiếp tục chiến dịch',exact:true})).toBeVisible();expect(stored.campaignStatus).toBe('Paused');
  await page.screenshot({path:'test-results/campaign-editor-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/campaign-editor-mobile.png',fullPage:true});
  await expect(page.locator('footer')).toHaveCount(1);
});
test('new draft posts selected fields and navigates to its edit page',async({page})=>{
  await setup(page);let created;
  await page.route('**/api/employer/campaigns**',route=>{
    if(route.request().url().endsWith('/metadata'))return route.fulfill({json:metadata});
    if(route.request().method()==='POST')created=route.request().postDataJSON();
    return route.fulfill({json:{id,document:created||document}});
  });
  await page.goto('/employer/campaigns/new');await page.getByLabel('Tiêu đề chiến dịch / Vị trí tuyển dụng',{exact:true}).fill('New Engineer');
  await page.getByLabel('Phòng ban / Bộ phận tuyển dụng',{exact:true}).fill('Engineering');await page.getByLabel('Địa điểm làm việc văn phòng chính',{exact:true}).fill('Hà Nội');
  await page.getByLabel('Ngành nghề',{exact:true}).selectOption('industry');await page.getByLabel('Tỉnh / Thành',{exact:true}).selectOption('province');await page.getByLabel('Hình thức tuyển dụng',{exact:true}).selectOption('type');
  await page.getByRole('button',{name:'Lưu nháp',exact:true}).click();await expect(page).toHaveURL(new RegExp(`/employer/campaigns/${id}/edit`));expect(created.campaignStatus).toBe('Draft');expect(created.ownerRecruiterId).toBe('hr-1');
});

