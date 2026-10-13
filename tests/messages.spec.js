import {test,expect} from '@playwright/test';
const userId='11111111-1111-1111-1111-111111111111',peerId='22222222-2222-2222-2222-222222222222',chatId='33333333-3333-3333-3333-333333333333';
test.beforeEach(async({page})=>{
  await page.addInitScript(()=>{for(const role of ['candidate','employer'])sessionStorage.setItem(`jobtot.${role}.tokens`,JSON.stringify({accessToken:'test-access',refreshToken:'test-refresh'}));});
  await page.route('**/api/candidate/auth/me',route=>route.fulfill({json:{id:userId,fullName:'Test account'}}));
  await page.route('**/api/employer/auth/me',route=>route.fulfill({json:{id:userId,fullName:'Test account'}}));
  await page.route('**/api/candidate/saved-jobs',route=>route.fulfill({json:[]}));
  await page.route(/\/api\/(candidate|employer)\/header$/,route=>route.fulfill({json:{messages:[],notifications:[],companyLogoUrl:null}}));
});
async function mockChat(page){
  const stored=[];const readIds=[];let starts=0,initial=0;
  await page.route(/\/api\/(candidate|employer)\/messages(?:\/|\?|$)/,route=>{
    const request=route.request(),path=new URL(request.url()).pathname;
    if(path.endsWith('/read')){readIds.push(...request.postDataJSON().messageIds);return route.fulfill({status:204});}
    if(path.endsWith('/typing'))return route.fulfill({json:{isTyping:false,expiresAt:null}});
    if(path.endsWith('/people'))return route.fulfill({json:[{id:peerId,name:'Người dùng khác',role:'Candidate'}]});
    if(path.endsWith('/messages')){
      if(request.method()==='POST'){starts++;return route.fulfill({json:{id:chatId}});}
      initial++;return route.fulfill({json:starts?[{id:chatId,peer:{id:peerId,name:'Người dùng khác',role:'Candidate'},lastText:stored.at(-1)?.text||''}]:[]});
    }
    if(request.method()==='POST'){const body=request.postDataJSON();const message={id:stored.length+1,senderAccountId:userId,...body,sentAt:new Date().toISOString()};stored.push(message);return route.fulfill({json:message});}
    return route.fulfill({json:{items:stored,hasMore:false}});
  });
  return {stored,readIds,initial:()=>initial};
}
test('guests see sign-in invitation and never request private conversations',async({page})=>{
  await page.addInitScript(()=>{sessionStorage.clear();localStorage.clear();});
  await page.route('**/api/candidate/auth/me',route=>route.fulfill({status:401}));
  let requests=0;page.on('request',r=>{if(/\/api\/.*messages/.test(r.url()))requests++;});
  await page.goto('/messages');await expect(page.getByRole('heading',{name:'Đăng nhập để xem và trao đổi tin nhắn'})).toBeVisible();
  await expect(page.locator('.chat-guest-login')).toHaveAttribute('href','/login?returnTo=%2Fmessages');expect(requests).toBe(0);
  await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('candidate finds another candidate, sends and reloads persisted messages',async({page})=>{
  const state=await mockChat(page);await page.goto('/messages');await expect(page.getByText('Bạn chưa có hội thoại.',{exact:false})).toBeVisible();expect(state.initial()).toBe(1);
  await page.getByLabel('Tìm tài khoản để trò chuyện').fill('Người');await page.getByRole('button',{name:'Người dùng khác Ứng viên'}).click();
  await page.getByLabel('Nội dung tin nhắn').fill('Chào bạn, cùng trao đổi kinh nghiệm nhé!');await page.getByRole('button',{name:'Gửi tin'}).click();
  await expect(page.locator('.chat-sent')).toContainText('Chào bạn');expect(state.stored).toHaveLength(1);
  await page.reload();await page.getByRole('button',{name:/Người dùng khác/}).click();await expect(page.locator('.chat-sent')).toContainText('Chào bạn');
});
test('employer can find a candidate and chat on mobile',async({page})=>{
  await mockChat(page);await page.setViewportSize({width:390,height:844});await page.goto('/employer/messages');
  await page.getByLabel('Tìm tài khoản để trò chuyện').fill('Người');await page.getByRole('button',{name:'Người dùng khác Ứng viên'}).click();
  await expect(page.getByRole('heading',{name:'Người dùng khác'})).toBeVisible();await expect(page.locator('.chat-sidebar')).not.toBeVisible();
  await page.getByLabel('Nội dung tin nhắn').fill('Chào bạn');await page.getByLabel('Nội dung tin nhắn').press('Enter');await expect(page.locator('.chat-sent')).toContainText('Chào bạn');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.getByLabel('Quay lại danh sách hội thoại').click();await expect(page.locator('.chat-sidebar')).toBeVisible();
});
test('employer-only session can also use the shared messages URL',async({page})=>{
  await page.addInitScript(()=>sessionStorage.removeItem('jobtot.candidate.tokens'));
  await page.route('**/api/candidate/auth/me',route=>route.fulfill({status:401}));
  await mockChat(page);await page.goto('/messages');
  await expect(page.getByLabel('Tìm tài khoản để trò chuyện')).toBeVisible();
  await page.getByLabel('Tìm tài khoản để trò chuyện').fill('Người');
  await page.getByRole('button',{name:'Người dùng khác Ứng viên'}).click();
  await expect(page.getByLabel('Nội dung tin nhắn')).toBeVisible();
});

test('employer opens a discovered candidate conversation without sending a message', async ({ page }) => {
  const conversation = { id: chatId, peer: { id: peerId, name: 'Ứng viên triển vọng', role: 'Candidate' }, lastText: '' };
  let starts = 0, sent = 0;
  await page.route(/\/api\/employer\/messages(?:\/|\?|$)/, route => {
    const request = route.request(), path = new URL(request.url()).pathname;
    if (path.endsWith('/typing')) return route.fulfill({ json: { isTyping: false, expiresAt: null } });
    if (path.endsWith('/messages')) {
      if (request.method() === 'POST') {
        expect(request.postDataJSON()).toEqual({ accountId: peerId });
        starts++;
        return route.fulfill({ json: conversation });
      }
      return route.fulfill({ json: [conversation] });
    }
    if (request.method() === 'POST') sent++;
    return route.fulfill({ json: { items: [], hasMore: false } });
  });
  await page.goto(`/employer/messages?account=${peerId}`);
  await expect(page.getByRole('heading', { name: conversation.peer.name, exact: true })).toBeVisible();
  await expect(page.getByLabel('Nội dung tin nhắn')).toBeVisible();
  expect(starts).toBe(1);
  expect(sent).toBe(0);
});

test('chat displays HR logos and candidate avatars, with initials when an image fails',async({page})=>{
  const candidate={id:peerId,name:'Ứng viên Avatar',role:'Candidate',avatarUrl:'/uploads/avatars/candidate.png'};
  const hr={id:'44444444-4444-4444-4444-444444444444',name:'Franklin HR',role:'Employer',avatarUrl:'/uploads/companies/logo.png'};
  const missing={id:'55555555-5555-5555-5555-555555555555',name:'Missing Avatar',role:'Candidate',avatarUrl:'/uploads/avatars/missing.png'};
  const conversations=[candidate,hr,missing].map((peer,index)=>({id:`avatar-chat-${index}`,peer,lastText:''}));
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4n6D3HwAGfAKNNP+fVwAAAABJRU5ErkJggg==','base64');
  await page.route(/\/uploads\/(avatars|companies)\/.*\.png$/,route=>route.request().url().endsWith('/missing.png')?route.fulfill({status:404}):route.fulfill({contentType:'image/png',body:png}));
  await page.route(/\/api\/candidate\/messages(?:\/|\?|$)/,route=>{
    const request=route.request(),path=new URL(request.url()).pathname;
    if(path.endsWith('/people'))return route.fulfill({json:[candidate]});
    if(path.endsWith('/messages'))return route.fulfill({json:request.method()==='POST'?conversations.find(c=>c.peer.id===request.postDataJSON().accountId):conversations});
    return route.fulfill({json:{items:[],hasMore:false}});
  });
  await page.goto('/messages');
  const threadAvatar=page.locator('.chat-thread-header .chat-avatar');
  for(const peer of [hr,candidate]){
    const row=page.locator('.chat-conversation').filter({hasText:peer.name});
    await expect(row.locator('.chat-avatar img')).toHaveAttribute('src',new RegExp(`${peer.avatarUrl}$`));
    await expect.poll(()=>row.locator('.chat-avatar img').evaluate(image=>image.naturalWidth)).toBeGreaterThan(0);
    await row.click();
    await expect(threadAvatar.locator('img')).toHaveAttribute('src',new RegExp(`${peer.avatarUrl}$`));
    await expect.poll(()=>threadAvatar.locator('img').evaluate(image=>image.naturalWidth)).toBeGreaterThan(0);
  }
  await page.getByLabel('Tìm tài khoản để trò chuyện').fill('Avatar');
  const searchResult=page.locator('.chat-conversation').filter({hasText:candidate.name});
  await expect(searchResult.locator('.chat-avatar img')).toHaveAttribute('src',new RegExp(`${candidate.avatarUrl}$`));
  await searchResult.click();
  await expect(threadAvatar.locator('img')).toHaveAttribute('src',new RegExp(`${candidate.avatarUrl}$`));
  const missingRow=page.locator('.chat-conversation').filter({hasText:missing.name});
  await expect(missingRow.locator('.chat-avatar')).toHaveText('MA');
  await expect(missingRow.locator('img')).toHaveCount(0);
  await missingRow.click();
  await expect(threadAvatar).toHaveText('MA');
  await expect(threadAvatar.locator('img')).toHaveCount(0);
});

for (const url of ['/messages', '/employer/messages']) {
  test(`typing status, throttling and cleanup on ${url}`, async ({ page }) => {
    await mockChat(page);
    let peerTyping = false;
    const updates = [];
    await page.route(/\/messages\/[^/]+\/typing$/, route => {
      if (route.request().method() === 'POST') {
        updates.push(route.request().postDataJSON());
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ json: { isTyping: peerTyping, expiresAt: peerTyping ? new Date(Date.now() + 6000).toISOString() : null } });
    });
    await page.goto(url);
    await page.getByLabel('Tìm tài khoản để trò chuyện').fill('Người');
    await page.getByRole('button', { name: 'Người dùng khác Ứng viên' }).click();
    const input = page.getByLabel('Nội dung tin nhắn');
    const status = page.locator('.chat-typing-status');
    await expect(status).toBeEmpty();
    peerTyping = true;
    await expect(status).toHaveText('Đang nhập...');
    peerTyping = false;
    await expect(status).toBeEmpty();
    await input.fill('Chào');
    await expect.poll(() => updates.length).toBe(1);
    await input.fill('Chào bạn');
    // Switching to the receiving tab must not clear typing immediately.
    await input.blur();
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(updates.at(-1)?.isTyping).toBe(true);
    await page.evaluate(() => {
      delete document.visibilityState;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect.poll(() => updates.at(-1)?.isTyping, { timeout: 10000 }).toBe(false);
    expect(updates).toEqual([{ isTyping: true }, { isTyping: false }]);
    await input.fill('Tin mới');
    await expect.poll(() => updates.at(-1)?.isTyping).toBe(true);
    await input.press('Enter');
    await expect(page.locator('.chat-sent')).toContainText('Tin mới');
    await expect.poll(() => updates.at(-1)?.isTyping).toBe(false);
    await input.fill('Bản nháp');
    await expect.poll(() => updates.at(-1)?.isTyping).toBe(true);
    await page.getByRole('link', { name: /Trang ch\u1ee7/ }).first().click();
    await expect.poll(() => updates.at(-1)?.isTyping).toBe(false);
  });
}

test('messages are marked read through backend only after opening their thread', async ({page}) => {
  const state = await mockChat(page);
  state.stored.push({id:1,senderAccountId:peerId,text:'Tin mới',sentAt:new Date().toISOString(),clientMessageId:'incoming'});
  await page.goto('/messages');
  expect(state.readIds).toHaveLength(0);
  await page.getByLabel('Tìm tài khoản để trò chuyện').fill('Người');
  await page.getByRole('button',{name:'Người dùng khác Ứng viên'}).click();
  await expect(page.locator('.chat-received')).toContainText('Tin mới');
  await expect.poll(()=>state.readIds.includes(1)).toBe(true);
});
