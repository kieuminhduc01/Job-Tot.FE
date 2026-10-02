export const tokenSession = (account = { id: 'candidate', fullName: 'Test Candidate', accountType: 'Candidate' }) => ({
  account, accessToken: 'test-access', refreshToken: 'test-refresh',
  expiresAt: '2027-01-01T00:00:00Z', refreshExpiresAt: '2027-02-01T00:00:00Z',
});

export async function seedTokens(page, persistent = false) {
  await page.addInitScript(({ tokens, persistent }) => {
    const storage = persistent ? localStorage : sessionStorage;
    if (!storage.getItem('jobtot.candidate.tokens')) storage.setItem('jobtot.candidate.tokens', JSON.stringify(tokens));
  }, { tokens: tokenSession(), persistent });
}
