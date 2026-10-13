# Employer recruitment campaigns

- List: `/employer/campaigns`
- Create: `/employer/campaigns/new`
- Edit: `/employer/campaigns/:id/edit`

Uses the shared EmployerHeader, AuthFooter and PageBreadcrumb. Employer authentication is required. API routes live under `/api/employer/campaigns`: GET list (keyword/state/page, five rows per page), GET metadata, GET detail, POST create and PUT update. Cancellation tokens reach EF Core; fetch effects defer startup and abort on cleanup under StrictMode.

Each campaign belongs to the authenticated employer's company. Company administrators can assign HR; other HR can create their own campaigns and edit campaigns they own. Revision conflicts return 409 rather than overwriting changes. Existing pipeline IDs remain stable; removed stages become inactive to preserve interview history.

Drafts are available before company verification. Publishing requires a verified company, valid recruitment dates, job description, requirements and at least one stage. Running campaigns publish a corresponding JobPost with the campaign ID; pausing/ending closes it, resuming reopens it. Ended campaigns cannot be edited or resumed. Candidate applications submitted through the public job page are included in list totals. Legacy campaign applications/interviews are also included. Interviews use Vietnam's calendar day. Metrics come from stored records; no fabricated visitor counts or ATS certification. The completion indicator measures entered fields.

Personal to-do notes are stored on the current browser/device, scoped by account/company; they are not shared with colleagues. This screen edits pipeline configuration, not candidate stages or interview scheduling.

No new database migration is needed; it uses existing campaign/skill/benefit/stage and job tables. Restart the user-run API normally to load the new controller. Verification uses CodexVerify, avoiding the running Debug executable.

Validation: `npm run check`, Playwright `employer-campaigns.spec.js` (StrictMode requests, draft save/navigation, edits, failed saves preserving inputs, pause, responsive layout), and `EmployerCampaignTests` (draft, verification gate, publish, hidden salary, part-time mapping, stale revision, pause/resume/end and retained stage IDs).
