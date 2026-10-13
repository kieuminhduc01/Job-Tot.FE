# Tìm nhân tài

Route `/employer/discover` requires an employer session. Employers enter from the header, candidate-management tabs, the footer, or the discovery action next to a running recruitment campaign. Campaign links keep the campaign selection in the URL. Filters, sorting, collection and pagination also persist in URL parameters.

The screen searches candidate profiles independently of submitted applications. It shows active candidates who are currently `looking` or `considering`; `paused` profiles are excluded. Filters include keyword, current or preferred work province, skill, minimum years of experience, availability and minimum match score. Three collections distinguish all discoverable profiles, company interests and the company's saved talent pool.

The skill dropdown has local substring search that ignores case and Vietnamese accents. Typing narrows the options without requesting candidate results; choosing a skill applies the existing URL/API filter using its original name. It supports keyboard navigation, Escape dismissal, and clearing through “Tất cả kỹ năng”.

Recommendations compare a profile with a selected running company campaign. Without a campaign selection, each profile uses its best match among the company's current campaigns. Scores and reasons use professional role, skills, experience and location. No current campaign means an unscored profile and an invitation to create a campaign. Missing experience stays unknown. The score is a reference for the recruiter, not an automated hiring decision or an AI prediction.

Candidate details render whitelisted professional information: summary, skills, work preferences, experience, education, projects and certificates. Contact details, birth date, gender and private CV documents are not displayed. “Nhắn tin” opens a conversation with the candidate's account without sending a message automatically.

Interest and saving are separate, persisted company actions. Interest is an internal shortlist and does not automatically notify or email the candidate. Saved profiles appear in the existing `/employer/talents` workflow, where recruiters can add notes/readiness and assign to a company campaign. Successful saves refresh counts and collections. Failed saves preserve the current state and show an error. Paused profiles cease to be discoverable even if previously interested/saved.

API base: `/api/employer/talent-discovery`.

- `GET /metadata`: company, current campaigns, filter options and collection counts.
- `GET /`: filters `keyword`, `campaignId`, `provinceId`, `skill`, `minYears`, `maxYears`, `readiness`, `minScore`, `collection`, `sort`, `page`, `pageSize`.
- `GET /{candidateId}?campaignId=...`: professional detail and matching explanation for the selected campaign.
- `PUT /{candidateId}/interest`: `{interested: boolean}`.
- `PUT /{candidateId}/saved`: `{saved: boolean}`.

The backend adds the `EmployerCandidateInterests` table through its EF migration and reuses `TalentPoolEntry` for saving. The focused additive script `BE/JobTot/database/talent-discovery.sql` has been applied to the local `JobTot` database; only a restart/rebuild of the user-run API is needed locally. Other deployments must apply the backend migration or focused script before using the new endpoints. See `BE/JobTot/docs/talent-discovery.md` for database setup and matching rules.

Validation: frontend lint/build and request lifecycle checks passed. The discovery, candidate-management, campaign and messaging Playwright suites passed all 19 tests; discovery includes actual query parameters, company collections, professional detail, failed mutations, empty/error states, selected-campaign context and responsive widths. All 6 targeted backend discovery/candidate tests passed. A read-only SQL Server smoke check exercised metadata, matching/list and professional detail against the local data (476 eligible profiles and 9 current campaigns).

The broader backend test run had 174 passing tests, 4 skipped tests and 2 failures outside this feature: an existing company-admin expectation in `EmployerAuthTests`, and `SqlSeedSchemaTests` resolving its seed path relative to the isolated build output. Targeted feature verification was completed separately.
