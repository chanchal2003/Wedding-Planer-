# ShaadiDesk: Wave 1 Build Plan

Date: 2026-10-24
Status: Draft. The owner reviews it before Step 0.1.
Sources: PRD Section 6.1 (Wave 1 scope), PRD Sections 8 and 11 (FR-n, AC-n), architecture document, `CLAUDE.md`.

## How to use this plan

- **👤 You** = a step that only the owner can do: accounts, keys, clicks in a website.
- **🤖 Claude Code** = Claude Code writes the code. The owner reviews it.
- Each step ends with **Done when**: something the owner can see or test. Then Claude Code explains what was built and the owner says "commit".
- Do the steps in order. A step depends on the steps before it.
- **Feature-wise (owner decision, 2026-10-26):** each feature is built from screen to database. A helper (phone, time, money, limits) is made inside the first feature that needs it. Before each feature, Claude Code discusses it with the owner.
- **Secrets never go into the chat or the code.** The owner pastes them into `.env`, Vercel and GitHub Secrets. (One file: Next.js, Prisma and the scripts all read `.env`. Decided 2026-10-30.)
- **Dummy data only.** All data is fake. There is no seed script. The wedding, events and team are created in the app by hand. The families come from sample Excel files (step 6.2) through the import feature.

## Wave 1 scope

From PRD Section 6.1:

| Area | Requirements |
|---|---|
| Weddings, events, team | FR-1 to FR-5, FR-7 to FR-13 (event type list without icons and colors) |
| Guest list and import | FR-15 to FR-21 |
| RSVP page | FR-22, FR-27 to FR-38, FR-41, FR-42 |
| Tracking and dashboard | FR-23, FR-24, FR-43, FR-44 (3 rows: no reply, no phone number, not sent), FR-6 (colour dots only) |
| Data safety | FR-64, FR-65, FR-66 |

Not in Wave 1: request access (FR-39), reminders (FR-25), event icons, the money switch screen (FR-10), event budget, expenses, tasks, stay, gifts. Tables for these come in their own wave.

## Decisions from the planning questions (2026-10-24)

| Topic | Decision |
|---|---|
| Accounts | The owner has GitHub only. The plan creates Neon, Cloudflare, Vercel and Google Cloud. |
| Databases | **Development: normal PostgreSQL on the laptop** (Homebrew, PostgreSQL 17). **Production: Neon**, one `main` branch, created at step 1.5. (Decided 2026-10-25.) |
| ORM | **Prisma 7** with the `pg` driver adapter, not Drizzle. (Owner decision, 2026-10-25.) |
| Node.js | `nvm`, the newest LTS that Vercel supports, in `.nvmrc`. |
| Device and attempt limits | 12 devices per family. 5 wrong tries for one family on one device, then 15 minutes stop. 20 tries per device per hour. |
| Import files | `.xlsx` and `.csv`. Template is `.xlsx`. |
| RSVP link name | Suggested from the couple names, editable, unique, locked after the first "Invitation sent". |
| How we build | Claude Code writes, the owner reviews each step. |
| Organizer invitation | "Invite on WhatsApp" and "Copy invite message". No email. |
| Validation | Zod. |
| Phone numbers | A number with no `+` is treated as Indian (+91). A number typed with `+` and a country code is accepted. Any number that can really exist is valid, mobile or landline. Invalid numbers are rejected with "This is not a valid phone number". (Decided 2026-10-26.) |
| Test data | **No seed script.** (Owner decision, 2026-10-26.) The wedding, events and team are created with the app's own screens. About 500 fake families come from a sample Excel file through the import. A second, messy file tests the import errors. Tests of the security rules create their own data and roll it back. |
| Tests | **Small.** Vitest only, for the access rules (4.3) and the import (6.3, 6.4). No Playwright. No CI. Everything else is checked by hand with the fake data. (Owner decision, 2026-10-25.) |

## Open items that touch Wave 1

These are `[Proposed]` in the PRD. Claude Code asks for a yes before the step that uses them. If the owner says no, the step changes.

| Item | Proposal | Used in step |
|---|---|---|
| UX-3, UX-4, UX-6, Section 10.4 messages | One main action per screen, status in words and color, keep typed data after a failed save, the new message texts | All UI steps |
| NFR-21, NFR-23 numbers | Body text at least 16 px, tap targets at least 44 × 44 px | 1.2 |
| FR-42 | "Not sent. Try again." on a failed submit | 7.4 |
| Sending state | "Submit" cannot be pushed two times | 7.4 |
| Q-5 | Keep backup copies for 30 days | 9.2 |
| NFR-20 | One restore test | 9.3 |

---

## Phase 0: Laptop and accounts

### 0.1 Install Node.js LTS ✅ done 👤
1. Install `nvm` (instructions on the nvm GitHub page).
2. Check Vercel's list of supported Node.js versions. Install the newest LTS version from that list with `nvm install <version>`.
3. Node 25 stays installed for other projects.

**Done when:** `node -v` in the project folder shows the LTS version.

### 0.2 Private GitHub repository ✅ done 🤖 + 👤
1. 🤖 Create the repository with `gh repo create shaadidesk --private --source . --push`. The owner approves the command.
2. 👤 Open the repository on GitHub and check that the `docs/` folder and `CLAUDE.md` are there.

**Done when:** the private repository shows all earlier commits.

### 0.3 Local PostgreSQL ✅ done 👤
The development database is a normal PostgreSQL 17 on the laptop (Homebrew), with the database `shadidesk_local`. The owner set it up and added `DATABASE_URL` to `.env` on 2026-10-25.

**Done when:** `npm run db:check` prints "Database OK".

### 0.4 Neon production database 👤 (moved: do this together with step 1.5, after Phase 8 and before step 9.2. Decided 2026-10-30.)
Neon is only for the deployed app on Vercel and the nightly backup. The app does not need it on the laptop.
1. Sign up at neon.tech with GitHub.
2. Make a project named `shaadidesk`. Select the region nearest to India (for example Singapore, if it is available). Select PostgreSQL 17, the same major version as the local database.
3. The only branch (`main`) is **production**. Do not make a `development` branch.
4. Copy two connection strings into a password manager:
   - **pooled** (the host name has `-pooler`): the app uses this one
   - **direct**: migrations and backups use this one
5. Read the current free plan limits (storage, compute hours). Tell Claude Code if a limit looks too small.
6. 🤖 `prisma.config.ts` must use the **direct** string for migrations on production (a `DIRECT_URL` variable), and the app uses the pooled `DATABASE_URL`.

**Done when:** you have 2 connection strings saved, and none of them is in the chat.

### 0.5 Cloudflare R2 👤 (moved: do this at the end, before step 9.2. The banner photo is saved in the database, so R2 is needed only for the nightly backup. Decided 2026-10-31, because R2 needs a payment card.)
1. Sign up at cloudflare.com.
2. Open R2 and turn it on. Cloudflare can ask for a payment card, also for the free plan. Read the free limits on that page before you continue.
3. Make two **private** buckets: `shaadidesk-photos` and `shaadidesk-backups`.
4. Make an R2 API token with "Object Read & Write" for these two buckets only.
5. Save the Account ID, Access Key ID and Secret Access Key in your password manager.

**Done when:** both buckets exist and the 3 values are saved.

> Vercel (step 1.5) and Google Cloud (step 4.1) come later, because they need the project to exist first.

---

## Phase 1: Project skeleton

### 1.1 Make the Next.js project ✅ done 🤖
- Make the project with `create-next-app` in the repository folder: latest stable Next.js, TypeScript, ESLint, Tailwind, App Router, no `src/` folder.
- Add `.nvmrc` and the `engines` field in `package.json`.
- Turn on TypeScript strict mode.
- Keep the `docs/` folder and `CLAUDE.md`.

**Done when:** `npm run dev` opens the start page on `http://localhost:3000`.
**Commit:** `chore: create next.js project with typescript and tailwind`

### 1.2 Folders, UI kit and base style ✅ done 🤖
- Make the folders from `CLAUDE.md` (`lib/access`, `lib/db`, `lib/import`, …).
- Set up shadcn/ui. Base style: body text at least 16 px, strong contrast, tap targets at least 44 px, clear focus outline (NFR-21 to NFR-24).
- A simple page layout for phones first (NFR-27).

**Done when:** a sample page shows large buttons and text, also on a phone-size screen.
**Commit:** `chore: add folder layout, shadcn/ui and base style`

### 1.3 Environment variables with Zod ✅ done 🤖 + 👤
- 🤖 `lib/env.ts` checks all environment variables with Zod when the app starts. `.env.example` lists the names with no values. `.gitignore` excludes `.env*` files (except the example).
- 👤 Paste the **development** values into `.env`: `DATABASE_URL` (already there) and the R2 values.

**Done when:** the app starts with all values. If you remove one value, the app stops with a clear message that names it.
**Commit:** `chore: validate environment variables with zod`

### 1.4 Vitest (small) ✅ done 🤖
- Install Vitest. Add `npm test`.
- **No Playwright. No GitHub Actions / CI.** Add CI later only if the owner asks.
- Tests are written only for the access rules (step 4.3) and the import (steps 6.3 and 6.4).
- **A separate test database** `shadidesk_test` on the same laptop PostgreSQL (one `createdb` command, shown to the owner before it runs). The tests use it through `DATABASE_URL` in a `.env.test` file (git-ignored), apply the migrations to it, and empty it between tests. They never touch `shadidesk_local`. Decided 2026-10-30.

**Done when:** one sample test passes with `npm test`. Done: `tests/database.test.ts` passes on `shadidesk_test`. Setup file `tests/setup.ts` stops every run that does not use `shadidesk_test`. `npm run db:test:migrate` applies the migrations to the test database after each new migration.
**Commit:** `chore: add vitest`

### 1.5 First deploy to Vercel 👤 + 🤖 (moved: do this after Phase 8 and before step 9.2, together with step 0.4. Until then everything runs on the laptop. Decided 2026-10-30.)
1. 👤 Sign up at vercel.com with GitHub. Import the `shaadidesk` repository.
2. 👤 Try the project name `shaadidesk`. If the name is taken, select a near name. **This name is in the RSVP link.**
3. 👤 Set the Node.js version to the same LTS as `.nvmrc`.
4. 👤 Add environment variables:
   - **Production:** Neon `main` values (pooled for `DATABASE_URL`, direct for `DIRECT_URL`), R2 values
   - **Preview:** none. Preview deployments have no database, so turn them off in the Vercel project settings (only `main` deploys). Decide again later if previews are necessary.
5. 🤖 Write the final address into the architecture document.

**Done when:** `https://<name>.vercel.app` shows the start page, and a push to `main` deploys again automatically.
**Commit:** `docs: record the vercel address`

---

## Phase 2: Database

### 2.0 Local PostgreSQL ✅ done
No Docker. The local PostgreSQL from step 0.3 is the development database. To start again with an empty database, run `npx prisma migrate reset`.

### 2.1 Connect to the database ✅ done 🤖
- Prisma 7 is installed with `@prisma/adapter-pg`, `pg` and `dotenv`.
- `prisma.config.ts` (the only file that holds the URL for the Prisma CLI), the schema folder `prisma/schema/` (`base.prisma` has the generator and datasource) and the generated client in `app/generated/prisma` (git-ignored).
- `lib/db/index.ts`: one `db` client per process, with the `pg` adapter. Server code only. Node.js runtime.
- `npm run db:generate` and `npm run db:check`.
- For production on Neon: the app uses the **pooled** URL, and Prisma CLI commands (migrations) use the **direct** URL. Set this up at step 1.5.

**Done when:** `npm run db:check` prints "Database OK" for the local database.

### 2.2 Wave 1 tables ✅ done 🤖
Tables from design document Section 8.1, only the ones Wave 1 needs:

| Table | Main rules |
|---|---|
| `users`, `accounts`, `sessions`, `verifications` | Better Auth tables (step 4.2) |
| `weddings` | Unique RSVP link name. Test flag. Couple names, wedding date, last dates, greeting, colors, banner file key, link-locked flag |
| `wedding_members` | Role (admin or organizer), relation, money access (default off), pending email. One row per person per wedding |
| `events` | Type (Haldi, Mehendi, Sangeet, Mata ki Chowki, Wedding, Reception, Other) and name, date and time, venue, map link, note, budget in paise (`bigint`), hosted by |
| `families` | Family name, contact name, city, side, assigned organizer, invitation sent (date, by whom), notes |
| `family_phones` | One row per number: family, wedding, number, primary or secondary. **Unique (wedding, number)** |
| `family_events` | Unique (family, event). Delete cascades to the reply |
| `replies` | **Unique (family event)** so the first reply wins. Yes or no, persons, replied by, from guest or team, updated by |
| `guest_devices` | Family, hashed device code, date |
| `access_attempts` | Device, family, success or fail, time (for the limits) |

**Why `family_phones` is a separate table:** the rule "a number is in only one family of a wedding" must cover the primary **and** the secondary numbers. With one table for all numbers, one unique constraint protects both. The design document lets the builder choose the columns (Section 10).

**Done when:** Claude Code shows the generated SQL migration and explains each table. The owner agrees.
**Commit:** `feat: add wave 1 database schema`

### 2.3 Run the migration ✅ done 🤖 + 👤
- 🤖 Run the migration on the **local** database (`npx prisma migrate dev`).
- 👤 After Neon exists (step 0.4), run the same migration on **production** with the documented command. The owner always runs production migrations, before the code that needs them is merged.

**Done when:** the local database has the tables (check with `npx prisma studio`). Production gets them when Neon exists.

### 2.4 Removed
The seed script is removed (owner decision, 2026-10-26). Data is made through the app. Fake families come from the sample Excel files in step 6.2.

---

## Phase 3: Removed (helpers are built inside the features)
The separate helper phase is removed (owner decision, 2026-10-26). Its work moves into the features:

| Helper | Built in | Details |
|---|---|---|
| India time (`lib/time`): show dates in India time, and "is it after the last date?" at 23:59 India time | **5.3** Wedding settings | First place a last date is saved. Also used in 7.4. |
| Money (`lib/money`): ₹ text to paise and back, Indian format (₹1,50,000) | **Money release** | The event budget and expenses are the first money fields. Not in Wave 1. |
| Phone numbers (`lib/phone`, `libphonenumber-js`): one standard form, rejects invalid numbers, last 4 digits | **6.1** Families | First place a number is typed. The import (6.3, 6.4) and the 4-digit check (7.3) reuse it. |
| Limit settings (`lib/limits.ts`): 12 devices, 5 wrong tries, 15 minutes, 20 tries per hour | **7.3** 4-digit check and device access | The only place these numbers are used. |

---

## Phase 4: Sign-in and the security guard

### 4.1 Google sign-in key ✅ done 👤
1. Open console.cloud.google.com. Make a project named `shaadidesk`.
2. Set up the OAuth consent screen: External, app name "ShaadiDesk", your email.
3. Make an OAuth Client ID (Web application) with these redirect addresses:
   - `http://localhost:3000/api/auth/callback/google`
   - `http://localhost:3001/api/auth/callback/google` (on this laptop port 3000 is used by another program, so `npm run dev` uses 3001)
   - `https://<name>.vercel.app/api/auth/callback/google` (add this when step 1.5 is done)
4. Put the Client ID and Client Secret into `.env`. When step 1.5 is done, also into Vercel (Production only, because preview deployments are off).
5. While the app is in "Testing", add your test Google accounts as test users. Before other people sign in, publish the app. Check if Google asks for a review (we use only name and email).

**Note:** preview deployments are off (step 1.5), so sign-in is tested on the laptop, and on production after step 1.5.

**Done when:** the Client ID and Secret are saved in `.env` (and in Vercel after step 1.5).

### 4.2 Sign-in with Better Auth ✅ done 🤖
- Read the Better Auth docs for Next.js and Prisma first, and the Next.js guide `authentication-with-cache-components.md` (CLAUDE.md rule 13: no `"use cache"`).
- Better Auth with Google, its Prisma adapter and **database sessions** (no cookie cache, so a removed person is refused at the next click).
- A migration adds the Better Auth columns and tables (`email_verified`, `image`, `sessions`, `accounts`, `verifications`), with UUID ids and snake_case names. The same migration adds the check `email = lower(email)` on `users` and `wedding_members`.
- Sign-in page and sign-out. Replace the demo start page `app/page.tsx` (it still has a "Request access" button): `/` sends a signed-in person to `/weddings` and everybody else to `/sign-in`.
- **No middleware.** Each team page and Server Action checks the sign-in through `lib/access` (Node.js runtime only).
- When a person signs in, and each time "My weddings" opens, pending team invitations with the same verified email link to that person (AC-9.2).

**Done when:** you sign in with Google on the laptop (and on production after step 1.5), and a team page with no sign-in sends you to sign in (AC-1.1).
**Commit:** `feat: add google sign-in with database sessions`

### 4.3 The security guard ✅ done 🤖
Built: `lib/result.ts` (the Result type and error codes), `lib/access/checks.ts` (inner part), `lib/access/guards.ts` (outer part), `lib/access/respond.ts` (`forPage` and `denied`), `lib/access/hash.ts` (SHA-256 of the guest code), `app/not-found.tsx`, `tests/access.test.ts` (14 tests). The guards return an answer. A page turns a "no" into the sign-in page or "page not found"; an action turns it into an error. (The experimental `forbidden()` is not used.) Decided 2026-10-31. The guest cookie is named `guest-<slug>`. Issuing the cookie comes at step 7.3.
`lib/access` with `getSessionUser`, `requireUser`, `requireMember`, `requireAdmin`, `requireMoneyAccess`, `getGuestFamily` and `requireGuestFamily` (names as in the API design, Section 3).
Each guard has two parts: a small outer part that reads the session or the guest cookie, and an inner part that checks the rules with plain inputs (for example `checkMember(userId, weddingId)`). The tests call the inner part, so they need no browser and no sign-in. Decided 2026-10-30.
Tests for each role:
- An active organizer passes `requireMember` but not `requireAdmin`.
- A pending or removed team member does not pass `requireMember`.
- An organizer without money access does not pass `requireMoneyAccess`; one with the switch on, and every admin, passes. (No budget screen exists in Wave 1, so AC-7.2 is tested with the Money release.)
- A guest device for the Sharma family cannot read the Verma family (AC-64.1).
- A member of wedding A cannot read wedding B (AC-64.2).

**Done when:** all access tests pass.
**Commit:** `feat: add lib/access security guard with role tests`

---

## Phase 5: Weddings, events and team

### 5.1 Make a wedding ✅ done 🤖
"My weddings" page and "Make a wedding" form. Relation: bride, groom, parent or sibling. The person becomes admin. A wedding, real or test, needs both names and a date that is not before today (India time). The app suggests the RSVP link name and checks that it is unique.
**Done when:** AC-2.1 and AC-2.2 pass.
**Commit:** `feat: make a wedding with suggested rsvp link`

### 5.2 Test weddings ✅ done 🤖
Test flag, a "TEST" badge on team pages, delete in one step with confirmation (FR-3). The "TEST" ribbon on guest pages is part of step 7.1.
**Delete a wedding (FR-68), done 2026-10-31:** any admin deletes a test wedding; only a bride or groom admin deletes a real wedding. Type the name to confirm. A small link at the bottom of the settings page opens its own page, `/w/<id>/settings/delete`, with the warning and the name box. Built: `checkDeleteWedding` (with tests), `deleteWeddingData` (ordered delete in one transaction), `deleteWedding`, `countWeddingData`. A plain delete of the wedding fails because of the links to team members, so the delete runs in order: attempt logs, families, wedding. The migration `20261031062628_members_no_action_for_wedding_delete` changes those three links to `NO ACTION` (the same protection, checked at the end of the statement). It was not enough alone, but it is harmless and stays.
**The TEST badge, done 2026-10-31:** `app/(team)/w/[weddingId]/layout.tsx` draws a top bar (`components/layout/wedding-top-bar.tsx`) on every page of a wedding, with a back link, the names of the couple and the TEST chip of a test wedding. A later page gets it for free. The layout does not protect its pages: it only asks the guard what to show, and every page still calls the guard itself. The navigation (bottom bar, sidebar) starts at step 5.4.
**Done when:** AC-3.1 and AC-3.2 pass.
**Commit:** `feat: add test weddings`

### 5.3 Wedding settings ✅ built (waiting for the owner's test) 🤖
**Built 2026-10-31:** the page `/w/<id>/settings` (admins only): banner photo, greeting, colour (stored as a name, list in `lib/theme.ts`), reply-by and stay-by dates (reply at most 2 days before the wedding, stay at most 3 days before it, none before today; the pickers grey out the other days), the Save buttons are off until something is changed (and off again right after saving), the RSVP link with Copy and an editable link name (locked after the first invitation), and a small "Delete wedding" link that opens the delete page. The banner is saved in the database (table `wedding_banners`, migration `add_wedding_banners`), shown at the public address `/<link name>/banner`; the browser shrinks and crops it, the server checks the real type and the size. R2 is not needed (see step 0.5). The wedding page has a Settings button for admins. Older text of this step follows.
Greeting, colors, RSVP last date and stay last date (stay must be earlier: AC-4.1). Edit the link name until it locks. Banner photo: the browser makes it smaller (approximately 300 KB), uploads it to the photos bucket with a short-time upload link. The banner is public (architecture rule 5), so the guest page and the WhatsApp preview can show it.
**Also in this step: the India time helper** (`lib/time`). It shows dates in India time and answers "is it after the last date?" (the last date closes at 23:59 India time). A short check shows the right result at 23:59 and 00:01 on the last date.

**Done when:** AC-4.1 passes, the banner shows on the settings page, and the time check is right.
**Commit:** `feat: add wedding settings, banner upload and india time helper`

### 5.4 Events ✅ built (waiting for the owner's test) 🤖
**Built 2026-10-31:** (1) the menu: a bottom bar on phones (Home, Events, More) and a sidebar on laptops (Home, Events, Settings for admins), in the wedding layout; a More page. Each later step adds its item in `components/layout/wedding-nav.tsx`. (2) Events: the list `/w/<id>/events`, the form to add (admins) and edit (every team member), and a delete page for admins that shows how many families are invited and how many replies are lost. The name is filled in from the type and can be changed. An event date is between today and the wedding date (the wedding day is allowed; the date picker greys out the other days); a saved date that has passed is not refused again. Dates and times are typed in India time and saved in UTC. Rules in `lib/events/schemas.ts`, the colours in `lib/events.ts`. One new test: an event is never found through another wedding. Older text of this step follows.
Event list and event form: type list (or "Other" with a typed name), date and time, venue, map link, note (team only), hosted by, and the event colour dot. Only admins add or delete. Organizers edit details. Delete shows the linked counts and asks for confirmation. The budget field and `lib/money` come with the Money release.

**Done when:** AC-5.1, AC-5.2, AC-7.1 and AC-8.1 (replies part) pass.
**Commit:** `feat: add events with type list, permissions and colour dots`

### 5.5 Team ✅ built (waiting for the owner's test) 🤖
**Built 2026-10-31:** the Team page (`/w/<id>/team`) in the menu and in More; Add person and Edit person (admins only); the WhatsApp invite message with "Invite on WhatsApp" and "Copy invite message" on every pending card; Remove from team and Restore. The rules are in one pure file, `lib/team/rules.ts` (17 tests): only family can be admin, the last admin stays, the signed-in bride or groom is protected, removal is refused while families are assigned, one email once per wedding. Every change runs in `changeTeam` (`lib/team/change.ts`): one transaction that locks the team rows (tested: two admins removing each other at the same moment, exactly one succeeds). Organizers see the list but not the emails. Older text of this step follows.
- Add an organizer by email: pending, "Invite on WhatsApp", "Copy invite message", change email (FR-9).
- Make a parent or sibling admin (FR-11).
- Protect the last admin and the signed-in bride and groom (FR-12). Each of these checks runs in one transaction that locks the wedding's team rows (`SELECT ... FOR UPDATE`), so two admins cannot demote each other at the same moment.
- The money switch (FR-10, AC-10.1) comes with the Money release. The column `can_see_money` stays off (false) for everyone.
- Remove an organizer only after their families have a new owner (FR-13; the tasks part comes with tasks).

**Done when:** AC-9.1, AC-11.1, AC-12.1, AC-12.2 and AC-13.1 (families part) pass.
**Commit:** `feat: add team management with invite message`

---

## Phase 6: Guest list and import

### 6.1 Families ✅ built (waiting for the owner's test) 🤖
**Built 2026-10-31:** (1) `lib/phone` (`normalizePhone`, `lastFourDigits`, `displayPhone`, `phoneSchema`, `optionalPhoneSchema`) with `libphonenumber-js`; a number with an extension is refused; 10 tests. (2) The Families list `/w/<id>/families`: search (name, contact, city), filters as plain links (show: no number, incorrect, not sent, no reply; side; event; organizer), 50 per page; tested with 500 fake families. (3) The family page, Add family and Delete family (admins): numbers optional (a second number needs a main one), a number used by another family is refused and names that family, taking an event off the invitation deletes its reply (with a warning), only admins set the organizer. A new test: a family is never found through another wedding. Families joins the menu (4 items on a phone). Older text of this step follows.
Families list with search and filters (side, event, organizer, no reply, no number). Family page: add and edit, two numbers, swap primary and secondary, events on the invitation, mark a number as incorrect. A duplicate number shows the family that has it.
**Also in this step: the phone helper** (`lib/phone`, `libphonenumber-js`). `normalizePhone` gives the standard number (+919876511111) or the error "This is not a valid phone number". A number with no `+` is treated as Indian. `lastFourDigits` gives the digits for the RSVP check. A Zod rule (`phoneSchema`) is reused by the family form and the import. A short check shows `+91 98765-11111`, `09876511111` and `98765 11111` giving the same number (AC-18.1), and `98765 1111` and `hello` being rejected.

**Done when:** AC-15.1, AC-18.1, AC-18.2, AC-19.1 and AC-20.1 pass.
**Commit:** `feat: add families list, family page and phone helper`

### 6.2 Import template ✅ built (waiting for the owner's test) 🤖
**Built 2026-10-31:** `lib/import/columns.ts` (the columns, one for each event; two events with the same name get the date in the header), `lib/import/template.ts` (an Excel file with the sheet "Guests" (header row only) and the sheet "How to fill"; text cells), the download `GET /w/<id>/import/template.xlsx` (admins only, 404 for anybody else, 409 with no events), and a small Import page with the download button (the upload comes at 6.5), also linked in More. Libraries: `write-excel-file`, `read-excel-file` (used at 6.3), `@faker-js/faker` (development only) instead of ExcelJS, which has not been updated since December 2024. The samples: `npm run samples` makes `samples/guests-clean-500.xlsx` (500 families) and `samples/guests-messy.xlsx` (29 rows, 14 kinds of mistake), always the same files; `samples/README.md` says what to create first. An empty "Side" in a file will become Both sides with a warning (decided 2026-10-31). Older text of this step follows.
"Download template": `.xlsx` with the columns from FR-16 and one column for each event of the wedding. The phone columns are text, so Excel does not change them to "9.88E+09".
**Also in this step: two sample files with fake data** (made by a small script, `scripts/make-sample-guest-files.ts`, using `@faker-js/faker` for Indian names and cities; the files go in `samples/`):
- `guests-clean-500.xlsx`: about 500 families on both sides, every family with a primary number, about 30% with a secondary number, a few with no number, different events for each family.
- `guests-messy.xlsx`: about 20 rows with deliberate mistakes: a repeated number inside the file, a missing family name, no event, a number already used by another family, a phone number in a wrong format, an organizer who is not on the team, and an event column that does not exist.

The events in the files must match the events created in the app (Haldi, Mehendi, Sangeet, Wedding, Reception), and the organizer emails must match the team.

**Done when:** AC-16.1 passes, and both sample files exist.
**Commit:** `feat: add import template download and sample guest files`

### 6.3 Import step 1: file validation ✅ built 🤖
**Built 2026-10-31 (it has no screen; the proof is 30 tests):** `lib/import/types.ts` (the list of problems with their kinds and titles, the shapes), `lib/import/read.ts` (`.xlsx` with `read-excel-file`, `.csv` with `papaparse`: BOM, comma or semicolon; refuses over 2 MB, over 2,000 families, over 40 columns, an old `.xls`, a wrong type, an empty file, a file that is not really Excel), `lib/import/validateImportFile.ts` (a pure function: the table and the events go in, the report comes out; row numbers as in Excel, first family is row 2) and `lib/import/report.ts` (`groupProblems`, for the screens). The sample files were changed: the "Sharma family" row is now in the clean file (499 new, 1 already in the app), and the messy file has the "Gupta family" row with the same number. Tests: `tests/import-file.test.ts`; I broke the checker eight ways on purpose and the tests caught all eight. Older text of this step follows.
`lib/import/validateImportFile`: read `.xlsx` (ExcelJS) or `.csv` (Papa Parse) into rows, then check each row with a Zod schema. Duplicates inside the file. No database.
**Done when:** unit tests for AC-16.2, AC-17.2 and AC-17.3 pass.
**Commit:** `feat: add import file validation`

### 6.4 Import steps 2 and 3: database check and save ✅ built 🤖
**Built 2026-10-31 (no screen yet; the proof is 20 tests on the test database):** `lib/import/validateImportAgainstDb.ts` (read only: new, already in the app, number of another family, organizer not on the team, same family twice in the file), `lib/import/run.ts` (`checkImportFile`, and `saveImportFile`: one transaction that takes a lock for the wedding, locks the organizers FOR SHARE, runs both checks again, and saves families, numbers and events with `createMany`), `lib/import/actions.ts` (`checkImport` and `saveImport`, admins only). A family is "already in the app" when a number of the row belongs to a family with the same name; with no number, when the name, contact name and city are the same (decided 2026-10-31). Also: a check of the zip file BEFORE the Excel file is read (over 20 MB unpacked, or a cell beyond row 3,000 or column 60, is refused: found by the review of 2026-10-31), and the organizer of "Add family" and "Edit family" is locked FOR SHARE, so no family is assigned to a person who is being removed. The tests were broken nine ways on purpose, and all nine were caught. Older text of this step follows.
- `validateImportAgainstDb`: number already in the app, organizer in the team, events exist. Read only.
- Same family name and number already in the app: "already in the app", skipped. Same number on a different family: error.
- `saveImport`: runs both checks again, then saves all rows in **one transaction**. Saves only with 0 errors.

**Done when:** tests for AC-17.1 and AC-17.4 to AC-17.6 pass, also a test where the data changes between the check and the save.
**Commit:** `feat: add import database validation and transactional save`

### 6.5 Import screens 🤖
Upload → results (OK, errors, warnings, already in the app) → "Download error list" → upload again → confirm → done, or "Nothing was saved. Check again." The server does not keep the file. A file over 2 MB or 2,000 rows shows "This file is too big. Use a file under 2 MB with at most 2,000 families." Next.js refuses actions over 1 MB by default, so this step sets `serverActions: { bodySizeLimit: '3mb' }` in `next.config.ts` (3 MB leaves room for the form overhead). The 2 MB check stays in the Zod schema.
**Done when:** you import `guests-messy.xlsx`, see all its errors, correct the file, and save it. Then you import `guests-clean-500.xlsx`, and the families list shows about 500 families.
**Commit:** `feat: add import screens`

### 6.6 Assign families to organizers 🤖
One family at a time, many at once (for example by side), and from the import column.
**Done when:** AC-21.1 passes.
**Commit:** `feat: assign families to organizers`

---

## Phase 7: RSVP page for guests

### 7.1 Screen 1 and the link preview 🤖
The `/[couple]` page: banner, couple names, search box, 4-digit box. A "TEST" ribbon shows on the guest page of a test wedding (FR-3, AC-3.1). Open Graph tags show only the banner, "<Bride> & <Groom>'s Wedding", and the month and year.
**Done when:** AC-27.1 passes. The preview card is correct when you send the link on WhatsApp (AC-38.1).
**Commit:** `feat: add rsvp screen 1 and safe link preview`

### 7.2 Family search 🤖
Matches only after 3 letters. Each match shows the family name and the contact name or city. Never the full list. At most 10 matches. No search-count limit: the owner accepts this risk (NFR-11, R-6; decided 2026-10-30).
**Done when:** AC-28.1 and AC-28.2 pass.
**Commit:** `feat: add rsvp family search`

### 7.3 4-digit check and device access 🤖
Check the last 4 digits against the primary or secondary number. The 15-minute stop is a sliding window: the last 5 wrong tries must all be inside the last 15 minutes. Rows of `access_attempts` older than 30 days are deleted by the nightly job (step 9.2). On success: a random device code in an `httpOnly` cookie, stored hashed in `guest_devices`. The cookie name includes the wedding (`guest-<slug>`), and the guard checks that the family belongs to the wedding of the address. Limits from `lib/limits`. Device limit message. Organizer resets the devices of a family.
**Also in this step: the limit settings** (`lib/limits.ts`): 12 devices for each family, 5 wrong tries then a 15-minute wait, 20 tries for each device each hour, 30 wrong tries for each family each day, 30 wrong tries for each internet address each hour. One file, one place to change. A new migration adds `access_attempts.ip_hash` and the indexes. The 12-device check locks the family row (`SELECT ... FOR UPDATE`) so parallel taps cannot go past 12.

**Done when:** AC-29.1, AC-29.2, AC-30.1 to AC-30.3, AC-31.1 and AC-31.2 pass.
**Commit:** `feat: add 4-digit check, device cookie, attempt limits and limit settings`

### 7.4 Screen 2 and the reply 🤖
Greeting, a card for each invited event only, privacy note. Yes or no, and persons. Summary and warning before submit. First reply wins. Read-only after submit, with "To change your reply, contact <organizer name>". Closed after the RSVP last date. Failed submit: "Not sent. Try again." (needs a yes on FR-42).
**Done when:** AC-32.1, AC-33.1, AC-34.1, AC-34.2, AC-35.1, AC-36.1, AC-36.2, AC-37.1 and AC-42.1 pass.
**Commit:** `feat: add rsvp screen 2 with one-time reply`

### 7.5 Removed
The Playwright test of the RSVP flow is removed (no Playwright). The owner tries the full flow by hand in step 10.1.

---

## Phase 8: Team tracking

### 8.1 Team enters replies 🤖
An organizer or admin enters or changes the reply of a family at any time, also after the last date. The app shows "Updated by <name>".
**Done when:** AC-41.1 and AC-37.2 pass.
**Commit:** `feat: team members enter and change replies`

### 8.2 RSVP link and "My families" 🤖
"Copy" button for the RSVP link. "My families" list for each organizer, with the "Invitation sent" tick, which records the date and the person. The first tick locks the link name.
**Done when:** AC-22.1 and AC-23.1 pass, and the link name cannot be changed after the first tick.
**Commit:** `feat: add my families with invitation sent tracking`

### 8.3 Dashboard 🤖
- Progress of each organizer: families, sent, replied (FR-24).
- Guest counts for each event and the full wedding: invited, yes (persons), no, no reply, for each side and the total (FR-43), with the mixed-answer rule of the API design (Section 13).
- The setup checklist and the timeline strip (Today, Replies close, Wedding). The checklist does not show who did each step.
- The "needs attention" list with 3 rows: no reply, no phone number, invitation not sent (FR-44).
- Event colour dots (FR-6).

**Done when:** AC-24.1 and AC-43.1 pass with the dummy data.
**Commit:** `feat: add wedding dashboard with organizer progress and guest counts`

---

## Phase 9: Data safety

### 9.1 CSV export 🤖
Admins export three CSV files: families with their phone numbers, replies, and the team (FR-65). Later waves add their tables. Each route handler calls `requireAdmin`. A cell that starts with `=`, `+`, `-` or `@` gets a `'` in front, so Excel does not run it as a formula (a family name like `=HYPERLINK(...)` is text, not a formula). The files are UTF-8 with a BOM.
**Done when:** AC-65.1 passes for the three files.
**Commit:** `feat: add csv export`

### 9.2 Nightly backup 🤖 + 👤 (needs steps 0.4 and 1.5 first)
- 🤖 GitHub Actions workflow, each night: `pg_dump` of production (with the same PostgreSQL major version as Neon), compress, upload to `shaadidesk-backups` with the date in the name, delete copies older than 30 days (needs a yes on Q-5).
- 👤 Add GitHub Secrets: Neon production **direct** URL and the R2 values.
- 👤 Run the workflow one time by hand.

**Done when:** the hand run is green and the copy is in the R2 bucket (AC-66.1).
**Commit:** `chore: add nightly database backup to r2`

### 9.3 Restore test 👤 + 🤖
Restore the latest copy into a **new local database** (for example `shadidesk_restore_test`) and check the counts. Then drop it (NFR-20, needs a yes).
**Done when:** the restored counts are the same as production.

---

## Phase 10: Wave 1 check

### 10.1 Check all Wave 1 acceptance criteria 🤖 + 👤
- 🤖 Make a checklist of all Wave 1 AC-n with pass or fail.
- 👤 Open the RSVP link on 3 phones (Android Chrome, iPhone Safari, WhatsApp browser). Check that it opens in approximately 1 second, also after a long time with no use (M6, NFR-25).
- 👤 3 to 5 test persons reply with the dummy data and no help (NFR-29).
- 🤖 Correct the problems.

**Done when:** all Wave 1 criteria pass. Tag the commit `wave-1`.
**Then:** the owner decides about Wave 2.
