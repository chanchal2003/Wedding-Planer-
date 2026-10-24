# ShaadiDesk

A free web app to manage an Indian wedding: events, guest families, invitation tracking, RSVPs, expenses, tasks, stay and gifts. Guests use one RSVP link; the team (admins and organizers) signs in with Google.

This is a practice project. It uses **dummy data only**. There is no real guest list.

## Source of truth

Read these before you change behaviour. If the code and these documents do not agree, stop and ask.

- PRD: `docs/prd/2026-10-16-shaadidesk-prd.md` (Sections 1–8: stories, FR-n) and `docs/prd/2026-10-16-shaadidesk-prd-part-2.md` (NFR-n, UX, AC-n, data, risks, decisions)
- Architecture: `docs/architecture/2026-10-24-shaadidesk-architecture.md`
- Design details: `docs/superpowers/specs/2026-10-16-wedding-management-design.md`

Refer to requirements by ID (FR-29, AC-35.1, NFR-21) in code comments, tests and commits where it helps.

## Stack

- Next.js (App Router) + TypeScript (strict). Server code is Server Actions and server components. **No Express.**
- **Node.js runtime only.** Never `export const runtime = "edge"`.
- PostgreSQL on Neon, through Drizzle (schema in `lib/db`, migrations in `drizzle/`).
- Cloudflare R2 through the S3 API (`lib/storage`) for photos and backups.
- Auth.js with Google for the team. Guests never sign in.
- Tailwind CSS + shadcn/ui. Vitest and Playwright.
- Hosting: Vercel (free plan). Nightly jobs: GitHub Actions.
- Everything must stay on free plans (₹0).

## Rules that must not break

1. **Access:** every page loader and every Server Action calls `lib/access` first (`requireMember`, `requireMoneyAccess`, `requireGuestFamily`). Hiding a button is not protection. The server never sends data the person may not see (FR-64).
2. **Wedding scope:** every query filters by `weddingId`. A guest gets only their own family and their invited events.
3. **Money:** store as whole paise (`bigint`). Never use floating point for money. Show as ₹ in the Indian format (₹1,50,000).
4. **Transactions:** multi-step changes (import save, purchase task → expense + payment, history rows) run in one transaction.
5. **Replies:** one reply per family and event (unique constraint). The first submit wins. Guests cannot edit after submit.
6. **Phone numbers:** normalise with `lib/phone` before saving or comparing. Unique per wedding.
7. **Import:** file validation → database validation → save in one transaction, which re-runs both checks first. Save only with 0 errors. Skip families already in the app (same name and number).
8. **Soft delete and history** for expenses, payments and gifts.
9. **Time:** store UTC, show India time (Asia/Kolkata). Last dates close at 23:59 India time.
10. **Secrets** live in `.env.local` (never committed), Vercel environment variables and GitHub Secrets.
11. **Data:** only fake data in seeds, tests and screenshots.

## Scope order

Build Wave 1 first, then decide on Wave 2. Do not start Should or Could items unless the owner asks.

- **Wave 1:** weddings and team (roles, money switch, Google sign-in), guest list and Excel import, RSVP page (family search, 4-digit check, one-time reply, last date, link preview, privacy note), organizers enter replies, "My families" and "Invitation sent" with progress, guest count dashboard, access rules, CSV export, daily database copy.
- **Wave 2:** request access, reminders, fast expense form, event type icons and colours, "needs attention" list.
- Later tiers and the full list: PRD Section 6.1 (the source of truth for the waves).

## Folder layout (planned)

```
app/[couple]/        RSVP page (guests)
app/w/[weddingId]/   team pages
components/          React components
lib/access/          the security guard
lib/db/              Drizzle schema and connection
lib/import/          validateImportFile, validateImportAgainstDb, saveImport
lib/money/  lib/phone/  lib/storage/
drizzle/             migrations
scripts/             seed fake data, backup
tests/               Vitest and Playwright
```

## Working style

- The owner knows React and is new to Next.js and SQL. Prefer one simple, consistent pattern over clever ones, and explain new concepts briefly.
- Write tests for access rules, money sums and import rules together with the code.
- Commit messages: `<type>: <what changed>` (feat, bug, task, refactor, docs, test, chore), then one or two lines on why. Commit only when the owner asks.
- Documents in `docs/` are written in ASD-STE100 Simplified Technical English.
