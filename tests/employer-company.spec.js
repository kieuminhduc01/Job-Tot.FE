import {test,expect} from '@playwright/test';

const account={id:'hr-1',fullName:'Trần Hoàng Phúc',companyId:'company-1',accountType:'Employer'};

test('gallery uploads image and allows removing it', async ({page}) => {
  await setup(page);
  const data = fixture(); data.document.brand.gallery = [];
  await page.route('**/api/employer/company', route => { if(route.request().method()==='PUT') data.document=route.request().postDataJSON(); return route.fulfill({json:data}); });
  await page.route('**/api/employer/company/images/gallery', route => {
    data.document.brand.gallery = ['/uploads/companies/gallery/' + 'a'.repeat(32) + '.png'];
    data.document.revision = 'revision-2';
    return route.fulfill({json:data});
  });
  await page.goto('/employer/company');
  await page.getByRole('button',{name:'Chỉnh sửa thư viện ảnh',exact:true}).click();
  await page.getByRole('button',{name:'Chọn ảnh từ máy',exact:true}).click();
  await page.getByLabel('Tải ảnh doanh nghiệp').setInputFiles({name:'office.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4n6D3HwAGfAKNNP+fVwAAAABJRU5ErkJggg==','base64')});
  await expect(page.getByRole('dialog').getByRole('img')).toHaveAttribute('src',/\/uploads\/companies\/gallery\//);
  await page.getByRole('button',{name:'Xóa ảnh 1',exact:true}).click();
  await expect(page.getByRole('dialog').getByRole('img')).toHaveCount(0);
});

test('industry is selected from catalog and loads once', async ({page}) => {
  await setup(page);
  let stored = fixture(), requests = 0;
  await page.route('**/api/employer/company', route => {
    if (route.request().method() === 'PUT') stored.document = route.request().postDataJSON();
    return route.fulfill({json:stored});
  });
  await page.route('**/api/employer/company/industries', route => { requests++; return route.fulfill({json:[{id:'sport',name:'Thể thao'},{id:'business',name:'Kinh doanh'}]}); });
  await page.goto('/employer/company');
  await page.getByRole('button',{name:'Bổ sung thông tin',exact:true}).click();
  await page.getByRole('checkbox',{name:'Thể thao',exact:true}).check();
  await page.getByRole('checkbox',{name:'Kinh doanh',exact:true}).check();
  expect(requests).toBe(1);
  await page.getByRole('button',{name:'Áp dụng',exact:true}).click();
  await expect(page.locator('.app-toast-success')).toBeVisible();
  expect(stored.document.brand.industryIds).toEqual(['sport','business']);
  expect(stored.document.brand.industry).toBe('Thể thao, Kinh doanh');
});
const fixture=()=>({id:'company-1',legalName:'Công ty Công nghệ JobTốt Việt Nam',taxCode:'0109867899',verificationStatus:'Pending',province:'Hà Nội',canEdit:true,openJobs:24,followers:18400,team:[{id:'hr-1',name:account.fullName,title:'HR Director',email:'hr@example.com',isCompanyAdmin:true}],document:{name:'Công ty Công nghệ JobTốt Việt Nam',description:'Doanh nghiệp công nghệ và tuyển dụng.',address:'18 Phạm Văn Bạch, Cầu Giấy',website:'https://example.com',foundedYear:2018,sizeMin:500,sizeMax:1000,revision:'revision-1',brand:{schemaVersion:1,coverUrl:'',logoUrl:'',englishName:'JobTot Technology',representative:'Ông Trần Hoàng Phúc',capital:'50.000.000.000 VND',workingHours:'Thứ 2 – Thứ 6, 8:30 – 18:00',industry:'Fintech & Phần mềm SaaS',story:'Xây dựng sản phẩm công nghệ Việt.',values:'Khách hàng là trọng tâm.',workplace:'Cộng tác minh bạch, chủ động.',workLife:'Làm việc linh hoạt.',highlights:[{title:'18+',description:'Năm phát triển',tag:'Từ 2007'},{title:'650+',description:'Kỹ sư R&D',tag:'Chuyên gia cấp cao'},{title:'120+',description:'Bằng sáng chế',tag:'Sáng tạo công nghệ'},{title:'100%',description:'Chuẩn Agile',tag:'Scrum & Agile'}],benefits:[{title:'Bảo hiểm sức khỏe',description:'Chăm sóc toàn diện.',tag:'Đang hiển thị'}],hiringProcess:[{title:'Sàng lọc hồ sơ',description:'Đánh giá kinh nghiệm.',tag:'1–2 ngày'},{title:'Phỏng vấn chuyên môn',description:'Trao đổi kỹ thuật.',tag:'45 phút'}],activities:[{title:'Happy Hour',description:'Gắn kết đội nhóm.',tag:'Hàng tuần'}],gallery:[]}}});
async function setup(page){
  await page.addInitScript(()=>sessionStorage.setItem('jobtot.employer.tokens',JSON.stringify({accessToken:'hr-access',refreshToken:'hr-refresh',expiresAt:'2099-01-01T00:00:00Z',refreshExpiresAt:'2099-02-01T00:00:00Z'})));
  await page.route('**/api/employer/auth/me',route=>route.fulfill({json:account}));
  await page.route('**/api/employer/header',route=>route.fulfill({json:{messages:[],notifications:[]}}));
  await page.route('**/api/candidate/auth/me',route=>route.fulfill({status:401}));
  await page.route('https://www.google.com/maps**',route=>route.fulfill({body:'<html><body>Hà Nội</body></html>',contentType:'text/html'}));
}

test('short Maps link resolves once and preview uses the location instead of the link text', async ({ page }) => {
  await setup(page);
  const data = fixture();
  data.document.address = 'https://maps.app.goo.gl/demo';
  await page.route('**/api/employer/company', route => route.fulfill({ json: data }));
  let requests = 0;
  await page.route('**/api/employer/company/map?**', route => {
    requests++;
    return route.fulfill({ json: { url: 'https://www.google.com/maps/place/Office/@20,104,15z/data=!3d21.03!4d105.8' } });
  });
  await page.goto('/employer/company');
  await expect(page.locator('.ec-map')).toHaveAttribute('src', 'https://www.google.com/maps?q=21.03%2C105.8&output=embed');
  expect(requests).toBe(1);
  await expect(page.locator('.ec-map-link')).toHaveAttribute('href', /google.com\/maps\/place\/Office/);
});

test('employer profile loads once, edits and persists branding, preserves drafts on failure',async({page})=>{
  await setup(page);
  let stored=fixture(),gets=0,puts=0,fail=false;
  await page.route('**/api/employer/company',route=>{
    if(route.request().method()==='PUT'){
      puts++;
      expect(route.request().headers().authorization).toBe('Bearer hr-access');
      if(fail)return route.fulfill({status:503});
      stored={...stored,document:{...route.request().postDataJSON(),revision:`revision-${puts+1}`}};
    }else gets++;
    return route.fulfill({json:stored});
  });
  await page.goto('/employer/company');
  await expect(page.getByRole('heading',{name:'Hồ sơ Doanh nghiệp & Thương hiệu Tuyển dụng',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Công ty Công nghệ JobTốt Việt Nam',exact:true})).toBeVisible();
  expect(gets).toBe(1);
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4n6D3HwAGfAKNNP+fVwAAAABJRU5ErkJggg==', 'base64');
  let uploads = 0;
  await page.route('**/api/employer/company/images/logo', route => {
    expect(route.request().headers()['content-type']).toContain('multipart/form-data');
    expect(route.request().headers().authorization).toBe('Bearer hr-access');
    uploads++;
    stored.document.brand.logoUrl = '/uploads/companies/logos/11111111111111111111111111111111.png';
    stored.document.revision = 'image-revision';
    return route.fulfill({ json: stored });
  });
  await page.route('**/uploads/companies/logos/*.png', route => route.fulfill({ contentType: 'image/png', body: png }));
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Thay đổi logo doanh nghiệp', exact: true }).click();
  await (await chooser).setFiles({ name: 'logo.png', mimeType: 'image/png', buffer: png });
  await expect(page.locator('.ec-logo img')).toHaveAttribute('src', stored.document.brand.logoUrl || '/uploads/companies/logos/11111111111111111111111111111111.png');
  await expect.poll(() => page.locator('.ec-logo img').evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  expect(uploads).toBe(1);
  await expect(page.locator('header').getByRole('link',{name:'Công ty',exact:true})).toHaveCount(0);
  await expect(page.locator('footer')).toHaveCount(1);
  await expect(page.getByRole('navigation',{name:'Đường dẫn'})).toContainText('Hồ sơ doanh nghiệp');
  await page.getByRole('button',{name:'Chỉnh sửa thông tin',exact:true}).click();
  await page.getByLabel('Tên hiển thị doanh nghiệp',{exact:true}).fill('JobTốt Việt Nam');
  await page.getByRole('button',{name:'Áp dụng',exact:true}).click();
  await expect(page.getByRole('heading',{name:'JobTốt Việt Nam',exact:true})).toBeVisible();
  expect(puts).toBe(1);
  await page.getByRole('button',{name:'Thêm / sửa phúc lợi',exact:true}).click();
  await page.getByRole('button',{name:'Thêm mục',exact:true}).click();
  await page.getByRole('dialog').getByLabel('Tiêu đề',{exact:true}).last().fill('Nghỉ phép linh hoạt');
  await page.getByRole('dialog').getByLabel('Nội dung',{exact:true}).last().fill('16 ngày nghỉ phép mỗi năm.');
  await page.getByRole('button',{name:'Di chuyển mục 2 lên',exact:true}).click();
  fail=true;
  await page.getByRole('button',{name:'Áp dụng',exact:true}).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Không thể tải/lưu');
  await expect(page.getByRole('dialog').getByLabel('Tiêu đề',{exact:true}).first()).toHaveValue('Nghỉ phép linh hoạt');
  fail=false;
  await page.getByRole('button',{name:'Áp dụng',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(stored.document.brand.benefits[0].title).toBe('Nghỉ phép linh hoạt');
  await page.reload();
  await expect(page.getByRole('heading',{name:'JobTốt Việt Nam',exact:true})).toBeVisible();
  await page.setViewportSize({width:1284,height:1000});
  await page.screenshot({path:'test-results/employer-company-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.getByLabel('Menu nhà tuyển dụng',{exact:true}).click();
  await expect(page.getByRole('navigation',{name:'Điều hướng nhà tuyển dụng'}).getByRole('link',{name:'Quản lý CV',exact:true})).toBeVisible();
  await page.getByLabel('Menu nhà tuyển dụng',{exact:true}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/employer-company-mobile.png',fullPage:true});
});

test('profile denies unauthenticated editing and renders read-only membership',async({page})=>{
  await page.route('**/api/candidate/auth/me',route=>route.fulfill({status:401}));
  await page.goto('/employer/company');
  await expect(page).toHaveURL(/\/login\?role=employer/);
  await setup(page);
  await page.route('**/api/employer/company',route=>route.fulfill({json:{...fixture(),canEdit:false}}));
  await page.goto('/employer/company');
  await expect(page.getByRole('button',{name:'Chỉnh sửa thông tin',exact:true})).toBeDisabled();
  await expect(page.locator('.ec-heading-actions .ec-primary')).toHaveCount(0);
  await expect(page.locator('.ec-readonly')).toBeVisible();
});

test('saved company branding renders on the candidate-facing company page',async({page})=>{
  await page.route('**/api/candidate/auth/me',route=>route.fulfill({status:401}));
  const saved=fixture();
  saved.document.address = 'https://maps.app.goo.gl/demo';
  let mapRequests = 0;
  await page.route('**/api/companies/map?**', route => {
    mapRequests++;
    expect(route.request().headers().authorization).toBeUndefined();
    return route.fulfill({json:{url:'https://www.google.com/maps?q=21.03,105.8'}});
  });
  await page.route('https://www.google.com/maps**', route => route.fulfill({body:'<html>Map preview</html>',contentType:'text/html'}));
  const company={id:saved.id,name:saved.document.name,description:saved.document.description,province:saved.province,address:saved.document.address,sizeMin:500,sizeMax:1000,isVerified:false,openJobCount:0,hiringTitles:[],brand:saved.document.brand};
  await page.route('**/api/companies?**',route=>route.fulfill({json:{items:[company],totalCount:1}}));
  await page.route('**/api/companies/featured',route=>route.fulfill({json:[]}));
  await page.route('**/api/jobs?**',route=>route.fulfill({json:{items:[],totalCount:0}}));
  await page.goto('/companies/company-1');
  await expect(page.getByRole('heading',{name:'Vị trí trụ sở trên bản đồ',exact:true})).toBeVisible();
  await expect(page.locator('.ec-map')).toHaveAttribute('src','https://www.google.com/maps?q=21.03%2C105.8&output=embed');
  expect(mapRequests).toBe(1);
  await expect(page.getByRole('heading',{name:'Phúc lợi & Đãi ngộ',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Bảo hiểm sức khỏe',exact:true})).toBeVisible();
  await expect(page.getByText(saved.document.brand.story,{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Phỏng vấn chuyên môn',exact:true})).toBeVisible();
});
