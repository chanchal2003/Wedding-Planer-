# ShaadiDesk: API Design (Wave 1)

Date: 2026-10-29
Status: Draft 1. The owner reviews it. Then the build starts with Phase 4 (sign-in).
Language: ASD-STE100 Simplified Technical English, in the same style as the PRD.
Sources: PRD (FR-n, AC-n), architecture document, database design (draft 5), UI and UX design (draft 2), Wave 1 build plan.

**Labels:** `[Confirmed]` = the owner decided. `[Proposed]` = the writer recommends; the owner must approve it.

This document lists every server function of Wave 1. For each function it gives: who can call it, what goes in, what comes out, and the errors. It does not give the code.

## 1. What "API" means in this app

**The usual way.** Many React projects have two programs: the React app in the browser, and a separate server (for example Express) that talks to the database. They talk through web addresses ("endpoints"). When Rohan pushes "Mark as sent", React calls `fetch("/api/families/123/mark-sent")`, and the server has a matching route. This set of addresses is a "REST API". The builder writes both sides and keeps them matched.

**The ShaadiDesk way.** There is only one program: the Next.js app. It has the browser code and the server code together. There is no Express, no `/api/...` address and no `fetch`. The button calls a function directly:

```tsx
<button onClick={() => markInvitationSent(weddingId, familyId)}>Mark as sent</button>
```

`markInvitationSent` is in a file that starts with `"use server"`. Next.js sends the request to the server, runs the function there (next to the database) and returns the answer. The builder does not write an address or a `fetch`.

**So "the API" in this document** is the list of these server functions: their names, who can call them, what goes in and what comes out. It gives the same information as a REST API document, but for functions instead of addresses. There are three kinds:

| Kind | What it is | Example | When it runs |
|---|---|---|---|
| **Read function** | A normal server function. A page (server component) calls it to get data before the page is sent. | `listEvents(weddingId)` | When a page opens |
| **Action** | A Next.js Server Action (a function in a file with `"use server"`). A form or a button calls it. | `createEvent(weddingId, input)` | When a person pushes a button |
| **Route** | A Next.js route handler: a real address that sends a file or answers Google. | `GET /w/<id>/export/families.csv` | Downloads and sign-in only |

A simple example: Rohan opens "My families". The page calls the read function `listMyFamilies`. Rohan pushes "Mark as sent" on the Verma family. The button calls the action `markInvitationSent`. The server saves it and the page shows "Marked as sent. Undo".

## 2. Rules for every function `[Proposed]`

### 2.1 Where the code lives

| Folder | Contents |
|---|---|
| `lib/<area>/queries.ts` | Read functions of one area (for example `lib/events/queries.ts`) |
| `lib/<area>/actions.ts` | Actions of one area. The file starts with `"use server"`. |
| `lib/<area>/schemas.ts` | Zod schemas for the inputs. The form in the browser and the action on the server use the same schema. |
| `app/.../route.ts` | Routes (sign-in, CSV files, import template) |

Areas: `access`, `weddings`, `events`, `team`, `families`, `import`, `rsvp`, `tracking`, `dashboard`, `export`. Helpers: `phone`, `time`, `limits`, `storage`.

### 2.2 The four steps of every action

1. **Check access.** Call `lib/access` first (Section 3). Hiding a button is not protection (FR-64).
2. **Check the input.** Parse it with the Zod schema. Never trust the browser.
3. **Do the work.** Every query filters by `weddingId`. A change with more than one step runs in one transaction.
4. **Return a result and refresh.** Return the result object (2.3). Refresh the pages that show the changed data. (The exact Next.js 16 refresh call is selected at build time from `node_modules/next/dist/docs/`.)

Read functions do steps 1 and 3. They return only the fields that the person may see.

### 2.3 The result of an action

An action never throws an error to the browser. It always returns one of two shapes:

```ts
type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ErrorCode; message: string; fields?: Record<string, string> } };
```

- `message` is the text that the person sees, in plain words, and it says what to do next (NFR-24).
- `fields` holds one message for each wrong form field, for example `{ phone: "This is not a valid phone number" }`.
- The form keeps what the person typed after a failed save (UI design, Section 8).

Read functions that fail because of access do not return a result. They stop the page: "not signed in" goes to the sign-in page, and every other access problem shows the same "page not found" page ("This page was not found. It may not exist, or you may not have access."). A wedding that does not exist and a wedding that the person may not open look the same, so nobody can find out which weddings exist. The experimental `forbidden()` of Next.js is not used. (Decided 2026-10-31.) The guards return an answer and do not throw: a page calls `forPage()` on it, an action calls `denied()` and returns the error.

### 2.4 Error codes

| Code | Meaning | Example message |
|---|---|---|
| `NOT_SIGNED_IN` | No team session | "Please sign in again." |
| `NO_ACCESS` | Signed in, but not a member, or the role is too low | "You do not have access to this." |
| `NOT_FOUND` | The row does not exist in this wedding | "This family was not found. It may have been deleted." |
| `INVALID_INPUT` | The Zod check failed | Field messages in `fields` |
| `CONFLICT` | A unique rule stopped the save | "This number is already used by the Verma family." |
| `NOT_ALLOWED_NOW` | The rule does not allow it in this state | "Move Rohan's 80 families to someone else first." |
| `CLOSED` | Guest reply after the last date | "Replies are closed. Contact Rohan." The name is the first name of the assigned organizer. With no organizer: "Replies are closed. Contact the person who sent you the card." (PRD, rule for the name in guest messages) |
| `TOO_MANY_TRIES` | A guest limit was reached | "Too many tries. Please wait 15 minutes, then try again, or ask the person who sent you the card." |
| `ALREADY_REPLIED` | Another family member replied first | "Your family has already replied." (the page then shows the saved reply) |
| `SERVER_ERROR` | Anything not expected | "Something went wrong. Try again." |

### 2.5 Shared rules

- **IDs** are UUIDs. Every input ID is checked to belong to the `weddingId` of the request. An ID from a different wedding gives `NOT_FOUND`, never the data.
- **Phone numbers** go through `lib/phone` before a save or a compare (CLAUDE.md rule 6). No `+` means India (+91). Output format: `+919876511111`.
- **Dates and times** come in and go out as India time in the forms, and are saved in UTC (`lib/time`). A last date closes at 23:59 India time.
- **No caching** (decided 2026-10-30): `cacheComponents` stays on, but no function or page uses `"use cache"` in Wave 1. Parts of a page that read the session or a cookie are inside `<Suspense>` (CLAUDE.md rule 13).
- **Lists of families** are never sent all at once. Search and filters run on the server, 50 rows for each page.
- **Text fields** are trimmed. Empty text is saved as empty (`null`).
- **Emails** are changed to lowercase in every Zod schema before a save or a compare (`Ankit@Gmail.com` becomes `ankit@gmail.com`). A database check refuses capital letters as a safety net. `[Confirmed]` 2026-10-30

## 3. The security guard: `lib/access` (build plan 4.3)

These functions are the first line of every read function and action. Small Vitest tests cover them (CLAUDE.md).

| Function | Returns | Stops with | Rule |
|---|---|---|---|
| `getSessionUser()` | The signed-in user, or `null` | — | Reads the Better Auth session |
| `requireUser()` | `{ user }` | `NOT_SIGNED_IN` | Any signed-in person |
| `requireMember(weddingId)` | `{ user, member, wedding }` | `NOT_SIGNED_IN`, `NO_ACCESS` | The user has an **active** row in `wedding_members` for this wedding. Pending and removed rows do not count. |
| `requireAdmin(weddingId)` | same | same | `requireMember` and `role = admin` |
| `requireMoneyAccess(weddingId)` | same | same | Admin, or organizer with `can_see_money`. Defined now; first used with the Money release. |
| `getGuestFamily(weddingId)` | `{ family }` or `null` | — | Reads the guest device cookie and finds the row in `guest_devices` |
| `requireGuestFamily(weddingId)` | `{ family, device }` | `NO_ACCESS` | Same, but stops if there is no valid cookie |

**Why the check runs on every click:** sessions are kept in PostgreSQL (architecture, Section 1). If an admin removes Ankit, his next click fails at `requireMember`, because his row is now `removed`.

**Two parts for each guard** (decided 2026-10-30): an outer part reads the session or the cookie; an inner part (for example `checkMember(userId, weddingId)`) checks the rules with plain inputs. The Vitest tests call the inner part, against a separate test database `shadidesk_test`.

**Tests (examples):** an active organizer passes `requireMember` but not `requireAdmin`; a pending row does not pass; a removed row does not pass; a member of wedding A does not pass for wedding B; a guest cookie of the Sharma family does not give the Verma family.

## 4. Sign-in (build plan 4.2) — FR-1, FR-9

| Function | Kind | Who | What it does |
|---|---|---|---|
| `/api/auth/*` | Route (Better Auth) | Anyone | Google sign-in and sign-out. Better Auth makes these addresses. |
| `linkPendingInvitations(user)` | Called by the Better Auth hook (`databaseHooks.user.create.after`, after a new user row is made) **and** by `listMyWeddings()`. Every sign-in lands on "My weddings", so every sign-in links | The person who signs in | In one transaction: find every `wedding_members` row with `status = pending` and the same email (lowercase). Set `user_id` and `status = active`. It runs at every sign-in and each time "My weddings" opens, so a person who is already signed in also gets new invitations. If nothing is pending, it does nothing. It links only when Google says the email is verified. `[Confirmed]` 2026-10-30 |
| `signOutAction()` | Action | Signed-in user | Ends the session |

- Example (already signed in): Rohan signed in on Monday for his cousin's wedding. On Wednesday Priya invites him. On Thursday he opens "My weddings" and Priya's wedding is there, without a new sign-in.
- Example: Ankit was invited as `ankit@example.com`. He signs in with that Google account. His pending row in the Priya and Rahul wedding becomes active. He sees the wedding in "My weddings".
- If Google says the email is not verified, no invitation is linked. The person sees "Your Google email is not verified."
- A person with no invitation can sign in. They see "My weddings" with only "Make a wedding".
- **Sign-in tool:** Better Auth (decided 2026-10-30, instead of Auth.js). The hook runs after the `users` row exists, so `user_id` can be set. Better Auth copies Google's own `email_verified` value into `users.email_verified` (checked in its source code, 2026-10-31).
- The other Better Auth tables (accounts, sessions, verifications) and the columns `email_verified` and `image` come in a new migration at step 4.2.

## 5. Weddings (build plan 5.1 to 5.3) — FR-2, FR-3, FR-4, FR-22

| Function | Kind | Who | Input | Output | Errors |
|---|---|---|---|---|---|
| `listMyWeddings()` | Read | Signed-in user | — | First calls `linkPendingInvitations` (Section 4). Then the weddings where the user is active: id, bride and groom names, date, `isTest`, the user's role | — |
| `createWedding(input)` | Action | Signed-in user | `brideName`, `groomName`, `weddingDate`, `relation` (bride, groom, parent or sibling), `isTest` | `{ weddingId }` | `INVALID_INPUT` (a name is empty, or the date is before today in India: "The wedding date cannot be before today." This applies to test weddings too.) |
| `getWeddingSettings(weddingId)` | Read | Admin | — | Names, date, greeting, theme colour, the date of the banner (never its bytes), last dates, slug, `slugLocked`, `isTest`. It calls the admin guard itself. | `NO_ACCESS` |
| `updateWeddingSettings(weddingId, input)` | Action | Admin | Any of: names, date, greeting, `themeColor` (a colour name: `plum`, `rose`, `indigo`, `slate` or `charcoal`), `rsvpLastDate`, `stayLastDate` | The new settings | `INVALID_INPUT` (the stay last date is not before the reply last date; a reply date later than 2 days before the wedding; a stay date later than 3 days before the wedding; a new date before today in India. A saved date that has passed is not refused again. Rules in `lib/weddings/rules.ts`.) |
| `updateSlug(weddingId, slug)` | Action | Admin | A link name: lowercase letters, numbers and dashes | The new slug | `CONFLICT` (name taken or reserved: "This link name is not available."), `NOT_ALLOWED_NOW` ("The link is locked, because invitations were sent.") |
| `uploadBanner(weddingId, formData)` | Action | Admin | One photo (JPEG, PNG or WebP, at most 1 MB) | — | `INVALID_INPUT` (not a real photo of those types, or too big) |
| `removeBanner(weddingId)` | Action | Admin | — | — | — |
| `GET /<link name>/banner` | Route | Anyone (public on purpose) | — | The banner photo, or 404 | — |
| `getWeddingDeleteInfo` (`countWeddingData`) | Read | Admin who may delete | — | The numbers for the warning: events, families, replies, team members | — |
| `deleteWedding(weddingId, typedName)` | Action | Test wedding: any admin. Real wedding: an admin who is the bride or the groom (`requireDeleteWedding`) | The wedding name, typed again (capital letters, extra spaces and "and" for "&" are ignored) | — | `NO_ACCESS`, `INVALID_INPUT` (name does not match) |

**`deleteWedding` in detail** (decided 2026-10-31): the data is deleted in one transaction, in this order: guest-attempt logs of its families, then its families (their phones, invitations, replies and devices go with them), then the wedding (its events and team go with it). A plain "delete the wedding" fails, because the database removes the team members before the families that point to them. The accounts (`users`) are never deleted. Every code that deletes a wedding, also the 6-month clean-up job, calls the same function, `deleteWeddingData`.

**`createWedding` in detail** (one transaction):
1. Make the slug from the names: "Priya" and "Rahul" give `priya-rahul`. If it is taken, use `priya-rahul-2`, then `-3`.
2. Insert the `weddings` row with `created_by` = the user.
3. Insert the user's `wedding_members` row: `role = admin`, `status = active`, the selected relation.

**Reserved link names:** the guest page is `/<couple>`, so a link name cannot be a top-level folder of `app/` (`weddings`, `w`, `sign-in`, `api` and the others). `createWedding` skips them, and `checkSlug` and `updateSlug` refuse them (architecture, Section 4).

**Slug lock:** the first `markInvitationSent` of a wedding sets `slug_locked = true` in the same transaction (Section 10). After that, `updateSlug` refuses.

**Banner upload** (decided 2026-10-31): the browser makes the photo smaller (a wide 1600 x 900 picture, about 300 KB, cropped from the middle, with a preview) and sends it to the Server Action `uploadBanner`. The server looks at the first bytes of the file to find the real type (JPEG, PNG or WebP; SVG is refused, because it can carry scripts), checks the size, and saves it in the table `wedding_banners` (one row for each wedding). Guests and the WhatsApp preview get it from the public address `/<link name>/banner`, which the browser may keep for 5 minutes. Nothing is stored in a folder or in R2, so it works the same on the laptop and online, and the nightly database copy includes it. When the wedding is deleted, its banner goes with it. `updateSlug` also covers the check of a taken or reserved name, so a separate `checkSlug` is not needed.

## 6. Events (build plan 5.4) — FR-5, FR-7, FR-8

| Function | Kind | Who | Input | Output | Errors |
|---|---|---|---|---|---|
| `listEvents(weddingId)` | Read | Member | — | All events, by date: id, type, name, start, venue, map link, note, hosted by, number of invited families | — |
| `getEvent(weddingId, eventId)` | Read | Member | — | One event | — |
| `createEvent(weddingId, input)` | Action | Admin | `type`, `name` (required for "other"), `startsAt` (India time), `venueName`, `mapLink`, `note`, `hostedBy` | `{ eventId }` | `INVALID_INPUT` |
| `updateEvent(weddingId, eventId, input)` | Action | Member | Same fields | The event | `NOT_FOUND`, `INVALID_INPUT` |
| `getEventDeleteImpact(weddingId, eventId)` | Read | Admin | — | `{ families, replies }` counts | — |
| `deleteEvent(weddingId, eventId)` | Action | Admin | — | — | `NOT_FOUND` |

- The note is for the team only. The guest functions never return it (UI design 6.2).
- `getEvent` and `getEventDeleteImpact` return "no access" for an event of another wedding, the same as for a stranger, so nobody can find out which events exist elsewhere. An event date is between today and the wedding date (decided 2026-10-31): a new date cannot be before today, and no date can be after the wedding date; a saved date that has passed is not refused again. The date and time are typed in India time and saved in UTC. The delete of an event needs a button, not the typing of a name.
- The budget field is not in Wave 1. It comes with the Money release and needs `requireMoneyAccess`.
- Delete: the confirm box shows "Delete Haldi? 142 families are invited and 98 have replied. Their replies for Haldi are deleted too." The database removes the `family_events` and `replies` rows (cascade).

## 7. Team (build plan 5.5) — FR-9 to FR-13

| Function | Kind | Who | Input | Output | Errors |
|---|---|---|---|---|---|
| `listTeam(weddingId)` | Read | Member | — | Each person: name, email, role, relation, status, number of assigned families, families sent and replied | — |
| `inviteMember(weddingId, input)` | Action | Admin | `displayName`, `email`, `relation`, `role` | The pending row and the invite message | `CONFLICT` ("This email is already in the team."), `INVALID_INPUT` (a friend cannot be admin) |
| *(invite message)* | — | Admin | — | `listTeam` returns, for each pending person (admins only), the ready WhatsApp text with the sign-in address and the email to use, and the `wa.me` link. There is no separate function. | — |
| `updateMember(weddingId, memberId, input)` | Action | Admin | Any of: `displayName`, `email` (pending only), `relation`, `role` | The row | `NOT_ALLOWED_NOW` (see the rules below), `INVALID_INPUT` |
| `removeMember(weddingId, memberId)` | Action | Admin | — | — | `NOT_ALLOWED_NOW` |
| `restoreMember(weddingId, memberId)` | Action | Admin | — | The row, active again (or pending, if the person never signed in) | — |

**Rules that the server checks** (database design, "The app code checks"). The checks for the last admin and for removing a member run in one transaction that locks the wedding's team rows (`SELECT ... FOR UPDATE`), so two admins cannot demote each other at the same moment:
- Only bride, groom, parent and sibling can be admin. "Make admin" for a friend gives `INVALID_INPUT` "Only family can be admins" (FR-11).
- The last active admin cannot be removed or made organizer (FR-12).
- After the bride or groom signs in, only they can remove their own admin role (FR-12).
- `removeMember` refuses while families are assigned to the person: "Move Rohan's 80 families to someone else first." (FR-13). Removing sets `status = removed`. The row is never deleted.
- The money switch (`setMoneyAccess`) is in the database already. Its action and screen come with the Money release (UI design 6.10).

**Who sees what** (decided 2026-10-31): every member sees the team list, but only admins see the emails (the server does not send them to an organizer), the invite buttons, and the pages to add, change, remove or restore a person. An admin may remove themselves, unless they are the last admin or the bride or groom. Inviting an email that was removed gives "This person was removed. Restore them instead." The rules are in `lib/team/rules.ts` (a pure file, tested). Every change runs in `changeTeam` (`lib/team/change.ts`), one transaction with `SELECT ... FOR UPDATE`.

**"Invite on WhatsApp":** the page opens a `wa.me` link with the ready text. The app never sends a message itself (architecture, Section 2).

## 8. Families (build plan 6.1) — FR-15, FR-18, FR-19, FR-20

| Function | Kind | Who | Input | Output | Errors |
|---|---|---|---|---|---|
| `listFamilies(weddingId, filters)` | Read | Member | `search`, `side`, `eventId`, `organizerId`, `status` (not sent, no reply, no number, incorrect number), `page` | 50 rows and the total. Each row: name, contact, city, side, organizer, sent, reply status | — |
| `getFamily(weddingId, familyId)` | Read | Member | — | All details: phones, events on the invitation, replies with "updated by", organizer, devices count | `NOT_FOUND` |
| `createFamily(weddingId, input)` | Action | Member | `familyName`, `contactName`, `city`, `side`, `primaryPhone`, `secondaryPhone`, `eventIds` (at least one), `organizerId`, `notes` | `{ familyId }` | `INVALID_INPUT`, `CONFLICT` (number used by another family, with its name) |
| `updateFamily(weddingId, familyId, input)` | Action | Member | Same fields | The family | as above, and `NOT_FOUND` |
| `swapPhones(weddingId, familyId)` | Action | Member | — | The phones | `NOT_ALLOWED_NOW` (no secondary number) |
| `setPhoneIncorrect(weddingId, phoneId, incorrect)` | Action | Member | `true` or `false` | The phone | `NOT_FOUND` |
| `deleteFamily(weddingId, familyId)` | Action | Admin | — | — | `NOT_FOUND` |

- **The list** (built 2026-10-31): the search and the filters (`q`, `side`, `event`, `organizer` or `none`, `status`: `no-number`, `incorrect`, `not-sent`, `no-reply`, `page`) are in the address of the page. A wrong value in the address is ignored. 50 families a page. **Numbers** are optional (FR-19); a second number needs a main number; the two numbers must differ; a number with an extension is refused. Saving a family with its numbers and events is one transaction. `getFamily` returns "no access" for a family of another wedding.
- **Delete a family** (decided 2026-10-30): only an admin. The confirm box says "Delete the Verma family? Its phone numbers, invitations and replies are deleted too." The database removes the phones, devices, invitations and replies (cascade).
- **Removing an event from a family** deletes the reply for that event, in the same transaction (FR-20). The form warns first: "The Sharma family replied for Haldi. This reply is deleted too."
- **Phone check:** `lib/phone` normalises. An invalid number gives the field message "This is not a valid phone number". The unique rule in the database gives `CONFLICT`; the message names the other family.
- **Only admins can set or change the organizer of a family** (FR-21; decided 2026-10-30). `createFamily` and `updateFamily` ignore `organizerId` from an organizer: for a new family it stays empty, for an existing family it does not change. The form shows the field disabled for organizers, with "Only admins can change this." Admins use the form or `assignFamilies`.
- **Organizers can see all families** of the wedding, with their own first (FR-25 wording), so they can help each other. "My families" shows only their own. `[Confirmed]` 2026-10-30

## 9. Import (build plan 6.2 to 6.6) — FR-16, FR-17, FR-21

| Function | Kind | Who | Input | Output | Errors |
|---|---|---|---|---|---|
| `GET /w/<weddingId>/import/template.xlsx` | Route | Admin | — | An Excel template: the sheet "Guests" with only the header row (one column for each event, two events with the same name get the date in the header) and the sheet "How to fill". All cells are text. | 404 for anybody who is not an admin of this wedding, 409 when the wedding has no events |
| `checkImport(weddingId, formData)` | Action | Admin | The file (`.xlsx` or `.csv`, at most 2 MB and 2,000 rows) | The report (below) | `INVALID_INPUT` (wrong file type, empty file, missing columns; too big: "This file is too big. Use a file under 2 MB with at most 2,000 families.") |
| `saveImport(weddingId, formData)` | Action | Admin | The same file again | `{ saved, skipped }` | `NOT_ALLOWED_NOW` ("Nothing was saved. Check again.") |
| `assignFamilies(weddingId, input)` | Action | Admin | `familyIds` and `memberId`, **or** `side` and `memberId` | `{ assigned }` | `INVALID_INPUT` (the person is not an active or pending member) |

**The three steps** (CLAUDE.md rule 7, architecture flow 3.3) are three functions in `lib/import`:
1. `validateImportFile(rows)` — no database. Family name, at least one event, phone format, the same number twice in the file.
2. `validateImportAgainstDb(weddingId, rows)` — read only. Number already in the app on a different family (error), same name and same number (skip, "already in the app"), organizer not in the team (the file must have the organizer's email; a name gives the error "Organizer not in the team. Use their email."; decided 2026-10-30), events exist.
3. `saveImport(weddingId, rows)` — one transaction. It runs steps 1 and 2 again first. It saves only with 0 errors.

**The report** of `checkImport`:

```ts
{
  totalRows: 500, okRows: 462, skippedRows: 0, warningRows: 6,
  errorGroups: [
    { problem: "Same number used twice", rows: [{ row: 45, familyName: "Verma family", value: "98765 11111" }] },
    ...
  ],
  canSave: false
}
```

- Errors are grouped by problem (UI design 6.9).
- The server does not keep the file, because it has phone numbers (architecture 3.3). For this reason `saveImport` gets the file again from the browser.
- "Download error list" is made in the browser from the report. No server file is needed.
- Small Vitest tests cover the three steps with the sample files (`samples/guests-clean-500.xlsx`, `samples/guests-messy.xlsx`).

## 10. Tracking (build plan 8.2) — FR-22, FR-23, FR-24

| Function | Kind | Who | Input | Output | Errors |
|---|---|---|---|---|---|
| `listMyFamilies(weddingId, filters)` | Read | Member | `search`, `status` (all, not sent, no reply), `page` | The families assigned to the user, 50 at a time, with counts for the filter chips | — |
| `markInvitationSent(weddingId, familyId)` | Action | Member | — | `sentAt` | `NOT_FOUND` |
| `undoInvitationSent(weddingId, familyId)` | Action | Member | — | — | `NOT_ALLOWED_NOW` (not sent) |
| `getRsvpLink(weddingId)` | Read | Member | — | The full link, for "Copy" | — |

- `markInvitationSent` sets `invitation_sent_at` and `invitation_sent_by`. If the slug is not locked, it locks it in the same transaction.
- `undoInvitationSent` clears both columns. Any team member can undo it, not only the person who marked it. `[Confirmed]` 2026-10-30. The slug stays locked, because a card may already be out.
- For admins, "Families" uses `listFamilies`. For organizers, "My families" uses `listMyFamilies`.
- **One list with a switch** (decided 2026-10-30): the organizer's screen has two chips at the top, **My families** (the default, `listMyFamilies`) and **All families** (`listFamilies`, with the organizer's own families sorted first). Organizers use "All families" to help a guest of another organizer. There is no extra tab.

## 11. RSVP page for guests (build plan 7.1 to 7.4) — FR-27 to FR-38, FR-42

Guests never sign in. The guest functions take the `slug` from the address (`/priya-rahul`), not a wedding ID.

### 11.1 Cookies

| Cookie | Value | Set by | Purpose |
|---|---|---|---|
| Anonymous device cookie | A random code. The database keeps only its hash. | `verifyFamilyDigits`, if the device has none | Counts wrong tries for each device (`access_attempts`) |
| Guest family cookie | A random code. `guest_devices` keeps only its hash. | `verifyFamilyDigits`, after correct digits | Gives this device access to one family of one wedding |

**One cookie for each wedding** (decided 2026-10-30): the name of the guest family cookie includes the wedding, for example `guest-priya-rahul`. A guest who is invited to two weddings keeps access to both, and does not use extra device slots. `requireGuestFamily` and `getGuestFamily` also check that the family in the cookie belongs to the wedding of the address. A test covers it (NFR-9).

Both cookies are `httpOnly`, `secure`, `sameSite=lax`, and live for one year. In Next.js a cookie can be set only in an action or a route, not while a page loads. For this reason they are set in `verifyFamilyDigits`.

### 11.2 Functions

| Function | Kind | Who | Input | Output | Errors |
|---|---|---|---|---|---|
| `getRsvpLanding(slug)` | Read | Anyone (the team's "See it as a guest sees it" button also opens this page; Wave 1 has no family preview) | — | Bride and groom names, date (no wedding city; each event has its own venue), banner, greeting, theme colour, `isTest`, `isClosed`, `rsvpLastDate` | Not found page |
| `generateMetadata` for `/[couple]` | Read | Anyone (WhatsApp) | — | Title "Priya & Rahul's Wedding", the month and year, the banner. Nothing else (FR-38). | — |
| `searchFamilies(slug, text)` | Action | Anyone | At least 3 letters | At most 10 matches: id, family name, contact name or city. There is no limit on the number of searches: the owner accepts this risk (NFR-11, R-6; decided 2026-10-30). | `INVALID_INPUT` ("Type at least 3 letters.") |
| `verifyFamilyDigits(slug, familyId, digits)` | Action | Anyone | 4 digits | `{ ok: true }` and the family cookie | `INVALID_INPUT` ("The number does not match. Check the last 4 digits and try again."), `TOO_MANY_TRIES`, `NOT_ALLOWED_NOW` ("Too many devices. Ask the person who sent you the card.") |
| `getGuestInvitation(slug)` | Read | Guest with the family cookie | — | Family name, the invited events only (name, type colour, date, time, venue, map link), the replies if any, "Replied by Meena, 5 Dec", organizer's first name, `isClosed` | Screen 1 (no cookie) |
| `submitReplies(slug, input)` | Action | Guest with the family cookie | `repliedByName`, and for each invited event **that has no reply yet**: `attending`, `persons` (at least 1 for yes) | The saved replies | `CLOSED`, `ALREADY_REPLIED` (every event already has a reply), `INVALID_INPUT` (an open event is missing, or an event is not on the invitation) |

**`verifyFamilyDigits` in detail:**
1. Set the anonymous device cookie if it is missing.
2. Check the limits in `lib/limits.ts`: 5 wrong tries for this family on this device in the last 15 minutes, or 20 tries from this device in the last hour, gives `TOO_MANY_TRIES`. Two more limits do not use the cookie: 30 wrong tries for this family in 24 hours (all devices), and 30 wrong tries in one hour from this internet address (a hash, read from the request headers). The digits are not checked when any limit is reached. A request with no cookie counts as a new device, so the cookie-free limits are what stop a script. `[Confirmed]` 2026-10-30
3. Compare the digits with the last 4 digits of the primary and secondary numbers (FR-29). Write one `access_attempts` row.
4. If they match: if the family has 12 devices, refuse. Otherwise insert a `guest_devices` row and set the family cookie.

**`submitReplies` in detail** (one transaction):
1. `requireGuestFamily`. Check the last date: after 23:59 India time on `rsvp_last_date` gives `CLOSED`.
2. The input must have one answer for **every invited event that has no reply yet**, and no other event (UI design: nothing is pre-selected). Events that already have a reply are not in the input. Decided 2026-10-30: each event is treated on its own, so a family with a partial reply (for example entered by Rohan by phone, or an event added later) can answer the open events.
3. Insert one `replies` row for each open event, with `source = guest`. A reply that exists already is never changed (unique rule, first reply wins). If another person saved a row for one of these events in the meantime, nothing is saved and the result is `ALREADY_REPLIED`. The page then shows the replies that were saved first (FR-35).
4. The page shows "Thank you" only after `ok: true` (FR-42). If the network fails, it shows "Not sent. Try again." and the answers stay on the page.

**Privacy:** the guest functions never return phone numbers, notes, other families, events that are not on the invitation, or team emails (FR-64).

## 12. Team enters replies (build plan 8.1) — FR-41

| Function | Kind | Who | Input | Output | Errors |
|---|---|---|---|---|---|
| `setFamilyReply(weddingId, familyId, eventId, input)` | Action | Member | `attending`, `persons` | The reply, with "Updated by Rohan" | `NOT_FOUND` (event not on the invitation), `INVALID_INPUT` |
| `resetFamilyDevices(weddingId, familyId)` | Action | Member | — | `{ removed }` | — |

- The team is not limited by the last dates (FR-37).
- `setFamilyReply` makes or changes the row, with `source = team` and `updated_by` = the member. `source` shows who made the latest version: a guest reply that the team changes later counts as a team reply (decided 2026-10-30; no extra column).
- The team can change a reply, but not clear it. A guest never replies twice. `[Confirmed]` 2026-10-30

## 13. Dashboard (build plan 8.3) — FR-24, FR-43, FR-44

| Function | Kind | Who | Output |
|---|---|---|---|
| `getDashboard(weddingId)` | Read | Member | All of the items below in one call |

- **Setup checklist:** each step done or not. It does not show who did it, because the database does not record the creator of an event or a family (decided 2026-10-30).
- **Counts** for each event and for the whole wedding, for bride side, groom side, both and total: invited, replied yes (persons), replied no, no reply (FR-43).
- **Families with mixed answers** (decided 2026-10-30): the whole-wedding "yes" counts a family that said yes to **any** event. The whole-wedding "no" counts a family only if it answered at least one event and said no to all answered events. "No reply" counts a family with no answer for any event. A family with some open events shows as "partly replied" on the team side.
- **Whole-wedding "yes" rule:** each family counts once, with its largest headcount across its events. Example: the Sharma family says Haldi 2 and Wedding 4. The whole-wedding count adds 4, not 6.
- **Organizer progress:** for each organizer, families, sent and replied (FR-24).
- **Needs attention** (three rows): families with no reply, families with no phone number, invitations not sent (FR-44, Wave 1 part).
- The counts are calculated in the database (SQL `COUNT` and `SUM` with `GROUP BY`), not in JavaScript, so 500 families stay fast.

## 14. Export (build plan 9.1) — FR-65

| Function | Kind | Who | Output |
|---|---|---|---|
| `GET /w/<weddingId>/export/families.csv` | Route | Admin | One row for each family: name, contact, city, side, primary and secondary number, events, organizer, sent date, notes |
| `GET /w/<weddingId>/export/replies.csv` | Route | Admin | One row for each family and event: family, event, attending, persons, replied by, source, date |
| `GET /w/<weddingId>/export/team.csv` | Route | Admin | One row for each person: name, email, role, relation, status |

- Dates in the files are India time. The file names have the date, for example `priya-rahul-families-2026-12-05.csv`.
- The files open in Excel without broken Hindi names (UTF-8 with a BOM). `[Proposed]`
- **Formula safety:** a cell whose text starts with `=`, `+`, `-` or `@` gets a `'` in front, so Excel shows it as text. Each route handler calls `requireAdmin` itself.

The nightly database copy (FR-66, build plan 9.2) is a GitHub Actions script, not an app function.

## 15. Left out of Wave 1

| Item | Comes with |
|---|---|
| Request access (`createAccessRequest`, `approveAccessRequest`) | Wave 2 |
| Reminders and "Send reminder" | Wave 2 |
| Money switch action, budget, expenses | Money release |
| Tasks, stay, gifts | Later releases |
| Delete a real wedding | Later release |

## 16. Decisions on the open points

All five points were decided on 2026-10-30.


1. **Delete a family.** Decided 2026-10-30: an admin can delete a family. Its phones, devices, invitations and replies go too (Section 8). `[Confirmed]`
2. **Organizers see all families.** Decided 2026-10-30: all families, with their own first (Section 8). `[Confirmed]`
3. **Undo "Mark as sent".** Decided 2026-10-30: any team member (Section 10). `[Confirmed]`
4. **Clear a reply.** Decided 2026-10-30: no. The team can only change a reply (Section 12). `[Confirmed]`
5. **Import limits.** Decided 2026-10-30: at most 2 MB and 2,000 rows for each file (Section 9). `[Confirmed]`
