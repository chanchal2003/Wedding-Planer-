# ShaadiDesk

A free web app to manage an Indian wedding: events, guest families, invitation tracking, RSVPs, expenses, tasks, stay and gifts. Guests use one RSVP link; the team (admins and organizers) signs in with Google.

This is a practice project. It uses **dummy data only**. There is no real guest list.

## Source of truth

Read these before you change behaviour. If the code and these documents do not agree, stop and ask.

- PRD: `docs/prd/2026-10-16-shaadidesk-prd.md` (Sections 1–8: stories, FR-n) and `docs/prd/2026-10-16-shaadidesk-prd-part-2.md` (NFR-n, UX, AC-n, data, risks, decisions)
- Architecture: `docs/architecture/2026-10-24-shaadidesk-architecture.md`
- API design: `docs/architecture/2026-10-29-shaadidesk-api-design.md` (every server function: who, input, output, errors)
- Design details: `docs/superpowers/specs/2026-10-16-wedding-management-design.md`

Refer to requirements by ID (FR-29, AC-35.1, NFR-21) in code comments, tests and commits where it helps.

## Next.js version warning

This project uses a new Next.js version (see `package.json`) with changes from older versions. Before you write code for a Next.js feature (routing, caching, cookies, Server Actions, metadata), read the matching guide in `node_modules/next/dist/docs/`. `AGENTS.md` says the same. Do not rely on memory of older versions.

## Stack

- Next.js (App Router) + TypeScript (strict). Server code is Server Actions and server components. **No Express.**
- **Node.js runtime only.** Never `export const runtime = "edge"`.
- PostgreSQL through **Prisma 7** (schema in the folder `prisma/schema/` with one file for each area: base, enums, team, events, guests; migrations in `prisma/migrations`, config in `prisma.config.ts`, generated client in `app/generated/prisma`, which is git-ignored). Use the client only through `import { db } from "@/lib/db"`. Run `npm run db:generate` after each schema change and `npm run db:check` to test the connection. **Development: normal PostgreSQL on the laptop** (Homebrew, PostgreSQL 17, database `shadidesk_local`). **Production: Neon** (one `main` branch, same major version). Prisma 7 does not allow `url` inside `schema.prisma`; the URL is in `prisma.config.ts`.
- Cloudflare R2 through the S3 API (`lib/storage`) for photos and backups.
- Auth.js with Google for the team. Guests never sign in.
- Tailwind CSS + shadcn/ui. Vitest only, for the access rules and the import rules. No Playwright, no CI for now.
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
11. **Data:** only fake data, in sample files, tests and screenshots. There is no seed script: create the wedding, events and team in the app, and load families through the Excel import (sample files in `samples/`).
12. **Migrations only:** every change to the database structure, including constraints and checks, goes through a Prisma migration file in `prisma/migrations`, committed to git. Never use `prisma db push`, never change the database by hand, and never edit a migration that was already applied (fix it with a new migration). Create with `npm run db:migrate:create` (it does not apply), add checks as SQL in that file, show the file to the owner, then apply with `npm run db:migrate`. Commands: `db:migrate`, `db:migrate:create`, `db:migrate:deploy` (production), `db:migrate:status`, `db:studio`, `db:generate`. Never run `prisma migrate reset` against any database except the local one.

## Scope order

Build Wave 1 first, then decide on Wave 2. Do not start Should or Could items unless the owner asks.

- **Wave 1:** weddings and team (roles, money switch, Google sign-in), guest list and Excel import, RSVP page (family search, 4-digit check, one-time reply, last date, link preview, privacy note), organizers enter replies, "My families" and "Invitation sent" with progress, guest count dashboard, access rules, CSV export, daily database copy.
- **Wave 2:** request access, reminders, fast expense form, event type icons and colours, "needs attention" list.
- Later tiers and the full list: PRD Section 6.1 (the source of truth for the waves).

## Folder layout (decided 2026-10-30)

Full tree and reasons: architecture document, Section 4. In short:

```
app/
  layout.tsx                     outer frame of every page: fonts, colours
  page.tsx                       "/": signed in -> /weddings, else -> /sign-in
  globals.css
  (guest)/                       guest pages: no menu, the couple's colour
    [couple]/
      page.tsx                   /priya-rahul: Screen 1 (find family) or Screen 2 (reply)
      _components/               pieces used only on this page (digit boxes, event card)
  (auth)/
    sign-in/page.tsx             /sign-in: "Continue with Google"
  (team)/                        team pages: sidebar on a laptop, bottom bar on a phone
    weddings/
      page.tsx                   /weddings: My weddings
      new/page.tsx               /weddings/new: Make a wedding
    w/[weddingId]/
      layout.tsx                 frame with the menu; calls requireMember first
      page.tsx                   Home (dashboard)
      families/                  page.tsx (list), new/page.tsx, [familyId]/page.tsx
      my-families/page.tsx       My families (organizers)
      import/                    page.tsx, template/route.ts (Excel template)
      events/                    page.tsx, new/page.tsx, [eventId]/page.tsx
      team/page.tsx
      settings/page.tsx          settings and the RSVP link
      preview/page.tsx           "See it as a guest sees it"
      more/page.tsx              the "More" tab on phones
      export/[file]/route.ts     families.csv, replies.csv, team.csv
  api/auth/[...nextauth]/route.ts  Google sign-in addresses (Auth.js)

components/
  ui/                            shadcn pieces (button, input, card)
  layout/                        sidebar, bottom bar, top bar, TEST badge
  shared/                        status chip, event dot, empty state, page shell

lib/
  access/                        the security guard (FR-64)
  auth/                          Auth.js setup (Google)
  db/                            Prisma client (the `db` object)
  weddings/ events/ team/ families/ import/ rsvp/ tracking/ dashboard/ export/
                                 each: queries.ts (read), actions.ts ("use server"), schemas.ts (Zod)
  phone/ time/ limits.ts storage/  helpers, each made inside the first feature that needs it
  result.ts                      the Result type and the error codes
  env.ts  utils.ts

prisma/schema/                   schema files (base, enums, team, events, guests)
prisma/migrations/               migration files
scripts/                         sample file generator, backup
samples/                         sample Excel files with fake families
tests/access/  tests/import/     small Vitest tests
.github/workflows/               nightly backup and cleanup
```

- `app/` is only pages and routes. Server code goes in `lib/<area>/{queries,actions,schemas}.ts` (see the API design document).
- One-page components go in that page's `_components/`; shared ones go in `components/shared/`.
- Never put security in `proxy.ts`; every page and action calls `lib/access`.
- Make a folder only when its feature is built.

## Working style

- The owner knows React and is new to Next.js and SQL. Prefer one simple, consistent pattern over clever ones, and explain new concepts briefly.
- Write small Vitest tests only for the access rules (`lib/access`) and the import rules (`lib/import`), together with the code. Check everything else by hand with the fake data. No Playwright and no CI for now.
- Commit messages: `<type>: <what changed>` (feat, bug, task, refactor, docs, test, chore), then one or two lines on why. Commit only when the owner asks.
- Documents in `docs/` are written in ASD-STE100 Simplified Technical English.
