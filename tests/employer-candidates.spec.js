import {test,expect} from '@playwright/test';
const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Ho_Chi_Minh'});
const profile={name:'Nguyễn Hoàng Long',email:'long@example.com',phone:'0988123456',headline:'Senior Cloud Engineer',yearsExperience:7,summary:'Kiến trúc Cloud và Kubernetes',readyStatus:'looking',avatarUrl:null,skills:['Kubernetes','Terraform','AWS Cloud']};
const campaign={id:'campaign-1',title:'Senior DevOps & Cloud Platform Lead',department:'R&D',campaignStatus:'Running',openings:3,hired:1,applications:1,owner:'Trần Mai Phương',endDate:'2027-01-01',stages:[{id:'stage-1',name:'Sơ loại HR',stageOrder:1,count:1},{id:'stage-2',name:'Đánh giá Tech',stageOrder:2,count:0}]};
const application={id:'application-1',candidateId:'candidate-1',campaignId:'campaign-1',campaign:campaign.title,stageId:'stage-1',stage:'Sơ loại HR',applicationStatus:'Applied',source:'Website',matchScore:null,appliedAt:`${today()}T08:00:00+07:00`,profile,hasCv:true};
const talent={id:'talent-1',candidateId:'candidate-1',readinessStatus:'ready',notes:'Ưu tiên vị trí Lead',revision:null,profile};
const interview={id:'interview-1',applicationId:'application-1',candidate:profile.name,headline:profile.headline,campaign:campaign.title,stage:'Đánh giá Tech',scheduledStart:`${today()}T01:00:00+07:00`,scheduledEnd:`${today()}T02:00:00+07:00`,meetingUrl:'https://example.com/meeting',location:'Room 1',interviewStatus:'pending',feedbacks:[]};
async function setup(page){
  await page.route('**/api/employer/header',route=>route.fulfill({json:{companyLogoUrl:null,messages:[],notifications:[]}}));
  await page.addInitScript(()=>sessionStorage.setItem('jobtot.employer.tokens',JSON.stringify({accessToken:'hr-access',refreshToken:'hr-refresh'})));
  await page.route('**/api/employer/auth/me',route=>route.fulfill({json:{id:'hr-1',fullName:'HR Test',companyId:'company-1',accountType:'Employer'}}));
  await page.route('**/api/candidate/auth/me',route=>route.fulfill({status:401}));
}
test('applications load once, move selected candidate, view CV and schedule interview',async({page})=>{
  await setup(page);let metaGets=0,listGets=0,move,schedule,status;
  await page.route('**/api/employer/candidates**',route=>{
    const url=new URL(route.request().url());
    if(url.pathname.endsWith('/metadata')){metaGets++;return route.fulfill({json:{campaigns:[campaign],pendingImports:0}});}
    if(url.pathname.endsWith('/cv'))return route.fulfill({json:{title:'CV Cloud Engineer',content:JSON.stringify({fullName:profile.name,summary:'Cloud Engineer'})}});
    if(url.pathname.endsWith('/move')){move=route.request().postDataJSON();return route.fulfill({json:{}});}
    if(url.pathname.endsWith('/status')){status=route.request().postDataJSON();return route.fulfill({json:{}});}
    if(url.pathname.endsWith('/interviews')){schedule=route.request().postDataJSON();return route.fulfill({json:{id:'interview-new'}});}
    listGets++;return route.fulfill({json:{items:[application],totalCount:1,page:1,pageSize:10}});
  });
  await page.goto('/employer/candidates');await expect(page.getByText(profile.name,{exact:true})).toBeVisible();expect(metaGets).toBe(1);expect(listGets).toBe(1);
  await expect(page.locator('header').getByRole('link',{name:'Quản lý CV',exact:true})).toHaveAttribute('aria-current','page');
  await page.locator('.er-table-card').screenshot({path:'test-results/applicant-list-desktop.png'});
  await page.getByRole('button', {name: profile.name, exact: true}).click();
  await expect(page.getByRole('dialog')).toContainText(profile.summary);
  await expect(page.getByRole('dialog').getByRole('heading', {name: 'Kinh nghiệm làm việc', exact: true})).toBeVisible();
  await page.getByRole('dialog').screenshot({path:'test-results/applicant-detail-desktop.png'});
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('dialog').screenshot({path:'test-results/applicant-detail-mobile.png'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.setViewportSize({width:1280,height:900});
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', {name: profile.name, exact: true})).toBeFocused();

  await page.getByRole('button',{name:`Chuyển vòng ${profile.name}`,exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('Vòng hiện tại: Sơ loại HR');
  await expect(page.getByLabel('Vòng tuyển dụng',{exact:true})).toHaveValue('stage-1');
  await expect(page.getByRole('dialog').getByRole('button',{name:'Lưu',exact:true})).toBeDisabled();
  await page.getByLabel('Vòng tuyển dụng',{exact:true}).selectOption('stage-2');
  await page.getByRole('dialog').getByRole('button',{name:'Lưu',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(move).toEqual({applicationIds:['application-1'],stageId:'stage-2'});
  await page.getByLabel(`Chọn ${profile.name}`,{exact:true}).check();await page.getByRole('button',{name:'Chuyển vòng tuyển dụng',exact:true}).click();await page.getByLabel('Vòng tuyển dụng',{exact:true}).selectOption('stage-2');await page.getByRole('dialog').getByRole('button',{name:'Lưu',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);expect(move).toEqual({applicationIds:['application-1'],stageId:'stage-2'});
  await page.getByLabel(`Lên lịch ${profile.name}`,{exact:true}).click();await page.getByLabel('Vòng phỏng vấn',{exact:true}).selectOption('stage-2');await page.getByLabel('Bắt đầu (giờ Việt Nam)',{exact:true}).fill('2027-01-01T10:00');await expect(page.getByLabel('Bắt đầu (giờ Việt Nam)',{exact:true})).toHaveValue('2027-01-01T10:00');await page.getByRole('button',{name:'Chọn ngày và giờ: Bắt đầu (giờ Việt Nam)',exact:true}).click();await expect(page.locator('.date-picker-panel')).toBeVisible();await page.locator('.date-picker-panel').getByRole('button',{name:'01/01/2027',exact:true}).click();await page.locator('.date-picker-panel').getByRole('button',{name:'Xong',exact:true}).click();await expect(page.getByLabel('Bắt đầu (giờ Việt Nam)',{exact:true})).toHaveValue('01/01/2027 10:00');await page.getByLabel('Kết thúc (giờ Việt Nam)',{exact:true}).fill('2027-01-01T11:00');await page.getByLabel('Địa điểm / Phòng họp',{exact:true}).fill('Room 2');await page.getByRole('dialog').getByRole('button',{name:'Lưu',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);expect(schedule.start).toBe('2027-01-01T10:00:00+07:00');expect(schedule.applicationId).toBe('application-1');
  await page.getByLabel(`Trạng thái ${profile.name}`,{exact:true}).click();await page.getByRole('dialog').getByLabel('Trạng thái xử lý',{exact:true}).selectOption('Hired');await page.getByRole('dialog').getByRole('button',{name:'Lưu',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);expect(status.state).toBe('Hired');
  await page.setViewportSize({width:1471,height:1000});await page.screenshot({path:'test-results/employer-applications-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/employer-applications-mobile.png',fullPage:true});
});
test('mutations and metadata refresh preserve campaign, stage, filters and pagination',async({page})=>{
  await setup(page);
  const secondCampaign={...campaign,id:'campaign-2',title:'Second campaign',stages:[{id:'stage-3',name:'Vòng chuyên môn',stageOrder:1,count:20}]};
  let metadataGets=0,releaseMetadata,holdMetadata=false;
  const queries=[];
  await page.route('**/api/employer/candidates**',async route=>{
    const url=new URL(route.request().url());
    if(url.pathname.endsWith('/metadata')){
      metadataGets++;
      if(holdMetadata)await new Promise(resolve=>{releaseMetadata=resolve;});
      return route.fulfill({json:{campaigns:[campaign,secondCampaign],pendingImports:0}});
    }
    if(route.request().method()==='PUT')return route.fulfill({json:{}});
    queries.push(Object.fromEntries(url.searchParams));
    return route.fulfill({json:{items:[{...application,campaignId:'campaign-2',stageId:'stage-3',stage:'Vòng chuyên môn'}],totalCount:20,page:Number(url.searchParams.get('page')),pageSize:10}});
  });
  await page.goto('/employer/candidates');
  await expect(page.getByText(profile.name,{exact:true})).toBeVisible();
  await page.getByLabel('Chọn chiến dịch',{exact:true}).selectOption('campaign-2');
  const stageButton=page.getByRole('button',{name:/V1\. Vòng chuyên môn/});
  await stageButton.click();
  await page.getByLabel('Tìm ứng viên',{exact:true}).fill('Long');
  await page.getByLabel('Tìm ứng viên',{exact:true}).press('Enter');
  await page.getByLabel('Trạng thái xử lý',{exact:true}).selectOption('Applied');
  await page.getByLabel('Nguồn ứng viên',{exact:true}).selectOption('Website');
  await page.getByLabel('Sắp xếp ứng viên',{exact:true}).selectOption('name');
  await page.getByRole('button',{name:'Trang sau',exact:true}).click();
  await expect.poll(()=>queries.at(-1)).toMatchObject({campaignId:'campaign-2',stageId:'stage-3',keyword:'Long',state:'Applied',source:'Website',sort:'name',page:'2'});
  const assertFilters=async()=>{
    await expect(page.getByLabel('Chọn chiến dịch',{exact:true})).toHaveValue('campaign-2');
    await expect(stageButton).toHaveAttribute('aria-pressed','true');
    await expect(page.getByLabel('Tìm ứng viên',{exact:true})).toHaveValue('Long');
    await expect(page.getByLabel('Trạng thái xử lý',{exact:true})).toHaveValue('Applied');
    await expect(page.getByLabel('Nguồn ứng viên',{exact:true})).toHaveValue('Website');
    await expect(page.getByLabel('Sắp xếp ứng viên',{exact:true})).toHaveValue('name');
    expect(queries.at(-1).page).toBe('2');
  };
  holdMetadata=true;
  await page.getByLabel(`Trạng thái ${profile.name}`,{exact:true}).click();
  await page.getByRole('dialog').getByLabel('Trạng thái xử lý',{exact:true}).selectOption('Interview');
  await page.getByRole('dialog').getByRole('button',{name:'Lưu',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(()=>!!releaseMetadata).toBe(true);
  try{await assertFilters();}finally{holdMetadata=false;releaseMetadata();}
  await expect.poll(()=>queries.filter(query=>query.page==='2').length).toBeGreaterThan(1);
  await assertFilters();
  const beforeRefresh=metadataGets;
  await page.getByRole('button',{name:'Làm mới danh sách',exact:true}).click();
  await expect.poll(()=>metadataGets).toBeGreaterThan(beforeRefresh);
  await assertFilters();
});

test('talent notes preserve draft on errors and assignment uses selected campaign',async({page})=>{
  await setup(page);let stored=structuredClone(talent),gets=0,fail=true,assignment;
  await page.route('**/api/employer/candidates**',route=>{
    const url=new URL(route.request().url());
    if(url.pathname.endsWith('/metadata'))return route.fulfill({json:{campaigns:[campaign],pendingImports:0}});
    if(url.pathname.endsWith('/assign')){assignment=route.request().postDataJSON();return route.fulfill({json:{}});}
    if(route.request().method()==='PUT'){if(fail)return route.fulfill({status:503});const value=route.request().postDataJSON();stored={...stored,notes:value.notes,readinessStatus:value.readiness};return route.fulfill({json:{revision:'new'}});}
    gets++;return route.fulfill({json:{items:[stored],totalCount:1,poolCount:1,readyCount:1,page:1,pageSize:10}});
  });
  await page.goto('/employer/talents');await expect(page.getByText(profile.name,{exact:true})).toBeVisible();expect(gets).toBe(1);
  await page.getByLabel(`Ghi chú ${profile.name}`,{exact:true}).click();await page.getByLabel('Ghi chú hồ sơ',{exact:true}).fill('Liên hệ tuần tới');await page.getByRole('dialog').getByRole('button',{name:'Lưu',exact:true}).click();await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible();await expect(page.getByLabel('Ghi chú hồ sơ')).toHaveValue('Liên hệ tuần tới');
  fail=false;await page.getByRole('dialog').getByRole('button',{name:'Lưu',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.getByText('Liên hệ tuần tới',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Gán Job',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Lưu',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);expect(assignment).toEqual({campaignId:'campaign-1'});
  await page.setViewportSize({width:1471,height:1000});await page.screenshot({path:'test-results/employer-talents-desktop.png',fullPage:true});
});
test('interview calendar loads each range once and records feedback',async({page})=>{
  await setup(page);const counts=new Map();let feedback;
  await page.route('**/api/employer/candidates**',route=>{
    const url=new URL(route.request().url());
    if(url.pathname.endsWith('/metadata'))return route.fulfill({json:{campaigns:[campaign],pendingImports:0}});
    if(url.pathname.endsWith('/feedback')){feedback=route.request().postDataJSON();return route.fulfill({json:{}});}
    counts.set(url.search,(counts.get(url.search)||0)+1);return route.fulfill({json:[interview]});
  });
  await page.goto('/employer/interviews');await expect(page.getByRole('heading',{name:profile.name,exact:true})).toBeVisible();expect([...counts.values()]).toEqual([1,1]);
  await page.getByRole('button',{name:'Nhập đánh giá',exact:true}).click();await page.getByLabel('Điểm đánh giá (0–10)',{exact:true}).fill('8.5');await page.getByLabel('Kết luận',{exact:true}).selectOption('Pass');await page.getByLabel('Nhận xét đánh giá',{exact:true}).fill('Nắm vững kiến trúc Cloud');await page.getByRole('dialog').getByRole('button',{name:'Lưu',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);expect(feedback).toEqual({score:8.5,decision:'Pass',comment:'Nắm vững kiến trúc Cloud'});
  await page.setViewportSize({width:1344,height:1000});await page.screenshot({path:'test-results/employer-interviews-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/employer-interviews-mobile.png',fullPage:true});
});
