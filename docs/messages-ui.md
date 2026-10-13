# Account messaging

`/messages` accepts a candidate session or, if no candidate session exists, an employer session. `/employer/messages` uses the employer session. Guests see a sign-in invitation and do not request private conversations.

Authenticated users search active accounts by name and start a one-to-one conversation. Candidate/candidate, candidate/employer and employer/employer conversations use the same API and data model. Search results contain names and account roles, without email or phone numbers.

Routes: `api/candidate/messages` and `api/employer/messages`.
- GET root: latest 100 conversations belonging to the current account.
- GET people?q=...: up to 20 accounts, minimum two-character query.
- POST root: create or reuse a conversation with the specified accountId.
- GET {id}: latest 50 messages; before/after cursors load history/new messages.
- POST {id}: persist text (1-4000 characters) with a clientMessageId.

SQL Server stores ChatConversations and ChatMessages. Only participants can read or send messages. A unique sorted account-pair key prevents duplicate conversations; a unique sender/clientMessageId prevents duplicate retries. Reusing a message ID with different content returns Conflict. Cancellation tokens reach EF Core queries and saves.

The frontend polls every five seconds. Initial requests use cancellable zero-delay timers for StrictMode; cleanup clears timers and aborts active requests. Enter sends, Shift+Enter inserts a newline, and IME composition is respected. Text is escaped by React. This implementation sends text; attachment upload and read receipts are not implemented.

Typing status uses participant-only GET/POST `{id}/typing` endpoints for both roles. The active thread polls every second. Input sends a heartbeat at most once every two seconds and stops after three seconds of inactivity, on send or navigation. Blurring the input or switching tabs keeps the last heartbeat until the inactivity timer expires, allowing the other participant to see it. Status expires after six seconds if the client disconnects. Only the peer sees `Đang nhập...`; draft text is never sent. Status lives in the API memory cache, requires no database migration, and is cleared on API restart. Multiple API instances require a shared cache before scaling out.

`database/account-messaging.sql` provisions only the new messaging migration. It has been applied to the local JobTot database. Restart the user-run API to load the new controller. No long-lived backend process was started. Demo conversation datasets remain in the database for previews but are not used by the account messaging screen.

Validation: npm run check, Playwright messages.spec.js, AccountMessagesTests and RequestCancellationTests. Integration tests use disposed in-process hosts and cover both JWT schemes, all role pairs, outsider rejection and idempotent sends.
