# ShaadiDesk: UI and UX Design

Date: 2026-10-27
Status: Draft 2 (2026-10-29). The colours are now plum, not jade. The screens follow the 60-page design from Claude Design (`docs/design/ShaadiDesk.pdf`). The API design document follows.
Language: simple English, in the same style as the PRD.
Sources: PRD Section 10 (screens, flows and states), PRD Section 9.6 (accessibility), architecture document, the design brainstorm of 2026-10-26 and 2026-10-27, and the Claude Design canvas.

**Labels:** `[Confirmed]` = the owner decided this in the brainstorm. `[Proposed]` = the writer suggests it and the owner has not decided yet.

This document says how ShaadiDesk looks and how it feels to use. It does not say how the code works. The screens and their rules are in the PRD (Section 10). This document adds the look, the layout and the wording.

## 1. Feel and principles

**The feel:** calm, elegant, modern and easy. It must not look traditional, and it must not feel like a spreadsheet. `[Confirmed]`

| # | Principle | What it means |
|---|---|---|
| 1 | **Calm** | Plenty of space. Few colours. Almost no shadows. One main action on each screen. |
| 2 | **Easy for the least confident user** | If Meena Aunty can use it on her phone without help, everyone can. |
| 3 | **The couple is the star** | The app is a quiet frame. The couple's photo, names and colour come first on the guest page. |
| 4 | **Always say what to do next** | Every screen, empty state and error tells the person the next step. |
| 5 | **Modern, with small touches of tradition** | The app is modern. Tradition appears only in small details: event colour dots, one faint pattern. |
| 6 | **Never rely on colour alone** | Status is a word plus a colour, always. |

## 2. Audiences

| Audience | Device | What they need | Design consequence |
|---|---|---|---|
| **Guests** (many are older relatives) | Phone, often inside WhatsApp's browser | See their events. Reply in a few taps. No account. | One column, big controls, simple words, no menus. |
| **Organizers** (family and friends) | Mostly phone | Their own list of families. Mark invitations as sent. Send reminders. | A to-do list with large buttons. |
| **Admins** (couple and close family) | Phone and laptop | The full picture. Setup. Import. Money. | Phone-first screens that grow into a sidebar layout on a laptop. |

## 3. Brand

| Item | Decision |
|---|---|
| **Name** | ShaadiDesk `[Confirmed]` |
| **Tagline** | **Plan the shaadi, not the chaos.** `[Confirmed]` Used on the sign-in page, in the browser tab description and in the team-side link preview. The guest link preview stays neutral: only the couple's names and the month (PRD FR-38). |
| **Wordmark** | "ShaadiDesk" in Fraunces. "Shaadi" in ink and "Desk" in plum. `[Confirmed]` |
| **App icon** | A rounded plum square with a small white diamond mark. `[Confirmed]` |
| **Why a diamond** | A simple diamond looks modern and calm. Rings and flowers look like a card shop. |

## 4. Visual style

### 4.1 Colours: Plum and Stone `[Confirmed]`

The first draft used jade. The owner changed the direction to plum on 2026-10-28.

| Role | Name | Value | Used for |
|---|---|---|---|
| Main | **Plum** | `#5B2A55` | Main buttons, links, the active tab |
| Main, hover | **Deep plum** | `#45203F` | Button when pressed or hovered |
| Main, soft | **Soft plum** | `#F3EBF2` | Selected rows, quiet highlights |
| Page | **Page** | `#FAFAF8` | Page background. A very light warm grey, not cream. |
| Surface | **White** | `#FFFFFF` | Cards and fields |
| Line | **Stone** | `#E7E5E0` | Dividers and card borders |
| Field border | **Field line** | `#7D8A88` | Borders of input fields and toggles |
| Text | **Ink** | `#14201F` | All main text. Near-black. |
| Secondary text | **Muted** | `#5B6B69` | Secondary text. Never lighter than this. |

**Contrast, calculated** (the PRD asks for strong contrast, NFR-22):

| Pair | Ratio | Result |
|---|---|---|
| White on plum (button text) | 11.0 : 1 | Passes |
| White on deep plum | 13.7 : 1 | Passes |
| Plum on page | 10.5 : 1 | Passes |
| Plum on soft plum | 9.4 : 1 | Passes |
| Ink on page | 16.0 : 1 | Passes |
| Muted on page | 5.4 : 1 | Passes |
| Muted on white | 5.6 : 1 | Passes |
| Field line on page | 3.4 : 1 | Passes (needs 3 : 1 for field edges) |
| Muted on soft plum | 4.8 : 1 | Passes |
| Muted on stone | 4.45 : 1 | **Do not use.** Use ink on stone. |

**The couple's colour:** each wedding has one theme colour. On the guest page it replaces plum for the main button and small accents. The rest stays neutral. `[Confirmed]` The couple picks one of five colours. Each has a soft tint and passes with white button text:

| Colour | Value | Soft tint | White text on it |
|---|---|---|---|
| Plum (default) | `#5B2A55` | `#F3EBF2` | 11.0 : 1 |
| Rose | `#8E3B5F` | `#F8ECF1` | 7.1 : 1 |
| Indigo | `#4B3A78` | `#EEEBF6` | 9.7 : 1 |
| Slate blue | `#4A5D73` | `#EBEFF3` | 6.8 : 1 |
| Charcoal | `#3A4342` | `#ECEEED` | 10.2 : 1 |

Because the choice is limited to these five, no contrast check is needed in the settings. `[Confirmed]`

**Event colours:** small markers only (a dot or a thin bar), never text and never big areas. `[Confirmed]` Values are `[Proposed]`.

| Event | Colour | Value |
|---|---|---|
| Haldi | Soft turmeric | `#C99A2E` |
| Mehendi | Leaf green | `#5B8C5A` |
| Sangeet | Blue | `#3B5BA9` |
| Wedding | Plum | `#5B2A55` |
| Reception | Slate | `#4A5D73` |
| Mata ki Chowki, Other | Clay `#A0673A`, stone grey `#7A8583` | `[Proposed]` |

**Status chips** (small, always a word plus a colour): `[Proposed]`

| Status | Text | Chip background | Ratio |
|---|---|---|---|
| Good (sent, replied, active) | Teal `#1F5F5B` | `#E3F0EE` | 6.3 : 1 |
| Needs a look (pending, no number) | `#7A5200` | `#FBF1DA` | 6.2 : 1 |
| Problem (error, incorrect number) | `#A32620` | `#FBE9E7` | 6.3 : 1 |
| Neutral (not sent, no reply) | Ink | Stone `#E7E5E0` | high |

Amber and red appear only inside these small chips and in error messages. They are never used for buttons, backgrounds or headings. `[Confirmed]` (the owner asked not to overuse pink, red and yellow)

**Dark mode:** not in Wave 1. `[Confirmed]`

### 4.2 Type `[Confirmed]`

| Use | Font | Notes |
|---|---|---|
| Couple's names, page titles | **Fraunces** | A soft, sturdy serif. Weight 500 to 600. No thin weights, because older eyes struggle with hairlines. |
| Everything else | **DM Sans** | Clear and friendly. |

| Style | Guest page | Team screens |
|---|---|---|
| Couple's names | 40 px, Fraunces | 28 px |
| Page title | 28 px, Fraunces | 24 px, Fraunces |
| Section title | 20 px, DM Sans, weight 600 | 18 px, weight 600 |
| Body | **18 px** | **16 px** (the minimum, NFR-21) |
| Small text | 16 px | 14 px, only for hints and chips, never for instructions |

Line height 1.5 for body text. Lines are no longer than about 65 characters.

### 4.3 Shape, space and motion `[Confirmed]`

| Item | Rule |
|---|---|
| Corners | Cards 16 px. Buttons and fields 12 px. Chips fully round. |
| Depth | Almost no shadows. Thin stone borders and white cards on the page colour. |
| Spacing | 24 px between sections on phones. 40 px or more on a laptop. 16 px page margin on phones. |
| Tap targets | At least **44 px** high (NFR-23). Main buttons are **48 px** high on team screens and **56 px** on guest screens, full width on phones. |
| Icons | One set of thin line icons (for example Lucide) in one style. Always with a text label next to important actions. |
| Motion | Very little. A gentle tick when a reply is saved. Soft fades. Nothing bounces. Respect "reduce motion". |
| Focus | A 3 px plum outline with a 2 px gap. |

### 4.4 The faint pattern `[Confirmed]`
A very faint geometric line pattern, inspired by lattice work (jali), sits behind the couple's names on the guest page header.
- Only the guest page header. Never on team screens. Never behind text that people must read in small sizes.
- One colour: the couple's colour at 4 to 6 percent opacity. Thin lines.
- In the Claude Design canvas it works. Nothing else depends on it, so it can be removed at any time.

## 5. Voice `[Confirmed]`

Warm and plain everywhere. A little personality only in happy moments (the thank-you after a reply, a finished setup). Never a joke in an error. Every message says what happened and what to do next. No emojis in the interface.

| Moment | Text |
|---|---|
| Guest greeting | "Namaste, Sharma family. You're invited to 2 events." |
| Reply saved (happy moment) | "Thank you. Your reply is saved. We can't wait to see you." |
| Empty families list | "No families yet. Import your guest list to begin." |
| Too many wrong tries | "Too many tries. Please wait 15 minutes, then try again, or ask the person who sent you the card." |
| Import has errors | "38 rows need fixing before you can save." |
| After "Mark as sent" | "Marked as sent. Undo" |
| Setup finished (happy moment) | "Your wedding is ready. Time to send the cards." |
| Reply last date (guest page) | "Please reply by 31 December." |

The other texts (not found, device limit, closed, request sent, request rejected) come from PRD Section 10.4.

## 6. Screens

For each screen: who uses it, a wireframe, and rules. Requirement numbers refer to the PRD.

### 6.1 Guest Screen 1: find your family `[Confirmed]`
PRD FR-27 to FR-31, FR-38.

```
┌─────────────────────────────┐
│  ┌───────────────────────┐  │
│  │    couple's banner    │  │  photo in a soft rounded frame
│  └───────────────────────┘  │
│                             │
│      Priya  &  Rahul        │  Fraunces, large, on a plain background
│      15 January 2027        │
│                             │
│  Namaste! Find your family  │
│  to see your invitation.    │
│  ┌───────────────────────┐  │
│  │ Family name           │  │  48 px field
│  └───────────────────────┘  │
│   Sharma family (Meena…)    │  matches: large tappable rows
│   Sharma family (Anil…)     │
│                             │
│  Last 4 digits of your      │
│  family's phone number      │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐        │  four separate boxes
│  └──┘ └──┘ └──┘ └──┘        │
│  [   See my invitation    ] │  solid button, 56 px
│                             │
│  Don't know the number?     │
│  Ask the person who sent    │  help text, no phone numbers
│  you the card.              │
└─────────────────────────────┘
```
- **The photo is on top and the names are below it on a plain background.** Never put text on the photo, because the photo is unknown and the text may be unreadable. `[Confirmed]`
- The four digit boxes are separate boxes. They open the number keypad on phones, and move to the next box by themselves.
- Matches show the family name and the contact name or city, so two "Sharma" families can be told apart. They appear only after 3 letters (FR-28).
- **No "Request access" in Wave 1.** The help text says "Ask the person who sent you the card". It shows no phone numbers of team members. `[Confirmed]` Request access comes in a later release (FR-39).
- The faint pattern sits behind the names, at 4 to 6 percent.
- A **TEST ribbon** shows on the guest pages of a test wedding. `[Confirmed]`

**States** (texts in PRD Section 10.4): start, fewer than 3 letters, no match, wrong digits, too many tries, device limit, loading. Each message is plain and tells the person what to do.

### 6.2 Guest Screen 2: your invitation and reply `[Confirmed]`
PRD FR-32 to FR-37, FR-42.

```
┌─────────────────────────────┐
│  Namaste, Sharma family     │  Fraunces
│  You're invited to 2 events │
│ ┌─────────────────────────┐ │
│ │ ● HALDI        12 Jan   │ │  event colour dot
│ │ 10:00 am · Home, Delhi  │ │
│ │ Open in Maps            │ │
│ │  Will you come?         │ │
│ │ ┌────────┬────────────┐ │ │
│ │ │  Yes   │     No     │ │ │  big toggle, 48 px
│ │ └────────┴────────────┘ │ │
│ │  How many people?       │ │
│ │   ( − )    2    ( + )   │ │  big stepper
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ ● WEDDING     15 Jan    │ │
│ │ ...same card...         │ │
│ └─────────────────────────┘ │
│  Privacy note               │
│ ────────────────────────────│
│ [     Review and submit   ] │  fixed at the bottom of the screen
└─────────────────────────────┘
```
- **All events are cards on one page.** The button is fixed at the bottom. `[Confirmed]`
- **Nothing is pre-selected.** The guest must choose Yes or No for each event. "Review and submit" stays locked until every event has an answer. `[Confirmed]`
- The page shows "Please reply by 31 December."
- Choosing "No" folds the "how many" part away.
- The event cards show date, time, place and a map link. They show no dress code. The event "Note" is for the team only for now. `[Confirmed]`
- "Review and submit" opens a summary with the warning "You cannot change this reply later. Do you want to submit?" and two buttons: "Go back" and "Yes, submit".
- After the server confirms, the page shows the reply as read-only with "Replied by Meena, 5 Dec" and "To change your reply, contact Rohan". There is no WhatsApp button and no phone number of a team member in Wave 1 (decided 2026-10-30; FR-40 is a Could item). A gentle tick appears once.

**States:** not replied, confirm, sending (the button cannot be pressed twice), replied, updated by the team, closed after the last date, stay not ready, network error ("Not sent. Try again." and the typed reply stays on the page).

### 6.3 Link preview (WhatsApp)
PRD FR-38. Shows only the couple's banner, "Priya & Rahul's Wedding" and the month. Never family names or events. `[Confirmed]`

### 6.4 Sign-in `[Proposed]`
A calm page: the wordmark, the tagline "Plan the shaadi, not the chaos.", and one large button "Continue with Google". Nothing else. PRD FR-1. The design also has a screen for a person whose invitation is not yet accepted. `[Confirmed]`

### 6.5 My weddings and Make a wedding `[Confirmed]`
PRD FR-2, FR-3.
- **My weddings:** a list of cards, each with the couple's names, the date and a TEST badge if needed. A button "Make a wedding".
- **Make a wedding:** one short form. Bride's name, groom's name, wedding date, "You are the…" (Bride, Groom, Parent, Sibling), and a checkbox "This is a test wedding". After that, the guided home opens. **Delete wedding** (FR-68): a small link with a trash icon at the bottom of the Settings page (not a big box), shown only to an admin who may delete (any admin for a test wedding; for a real wedding only an admin who is the bride or the groom). It says what will be deleted ("3 events, 500 families, 12 replies and 4 team members. This cannot be undone."), asks the person to type the wedding name, and the button stays off until the name matches. It is an outlined button, not a red one (Section 9). Clicking the link opens its own page, `/w/<id>/settings/delete`, with the warning, the counts, the name box and a Cancel button. `[Confirmed]` 2026-10-31

### 6.6 The guided home (dashboard) `[Confirmed]`
PRD FR-24, FR-43, FR-44.

```
┌─────────────────────────────┐
│ Priya & Rahul     [TEST]  ⚙ │
│ 15 Jan 2027 · 80 days to go │
│ Today ─ Replies close 31 Dec ─ Wedding │   timeline strip
│ ┌─────────────────────────┐ │
│ │ NEXT STEP               │ │  the big next-step card
│ │ Add your team           │ │
│ │ Invite Rohan and Ankit. │ │
│ │          [ Add team ]   │ │
│ └─────────────────────────┘ │
│  ✓ Wedding created          │
│  ✓ Events added             │
│  ▸ 4 more steps             │
│ ┌─────────────────────────┐ │
│ │ Replies  312 of 500     │ │  summary strip (after setup)
│ │ ▓▓▓▓▓▓▓▓▓░░░░░░   62%   │ │
│ └─────────────────────────┘ │
│  Needs attention            │
│  188 families not replied   │
│  23 have no phone number    │
│  41 invitations not sent    │
│  Events: ● Haldi  142 yes   │
│  By organizer: Rohan 80/120 │
├─────────────────────────────┤
│ Home  Families  Events  More │  bottom bar
└─────────────────────────────┘
```
- **During setup** the home shows the next-step card and a short, collapsed checklist. **After setup** it shows the summary strip, then "Needs attention", then the details. `[Confirmed]`
- **Next-step card:** one step, one button. The other steps are collapsed under "4 more steps". `[Confirmed]`
- **Checklist steps:** 1 Make the wedding, 2 Invite your helpers, 3 Add events, 4 Set the reply dates, 5 Import your guest list (locked until events and team exist, with a note), 6 Copy your RSVP link. Steps do not show who did them (decided 2026-10-30: the database does not record it). `[Confirmed]`
- **Invite your helpers comes early.** Each person gets a ready WhatsApp message to join (FR-9). Then setup can run in parallel. `[Confirmed]`
- **See it as a guest sees it:** once the names, photo and colour are set, a button opens the real guest Screen 1 with the couple's photo and colour (same data as `getRsvpLanding`, no new function). It catches a bad photo before the cards are printed. In Wave 1 the preview shows Screen 1 only: there is no family picker and no Screen 2 preview. `[Confirmed]` 2026-10-30
- **Timeline strip:** Today, Replies close, Wedding, with the real dates. There is no "Cards go out" date. `[Confirmed]`
- **Needs attention** stays in Wave 1 with three rows: families not replied, families with no phone number, invitations not sent. Event colour dots also stay. `[Confirmed]`
- The home page changes with the stage (setup, invitations, replies, headcount). **Later, not in Wave 1.** `[Confirmed]`
- On a laptop the same content sits in the main area next to the sidebar, in two columns.

### 6.7 My families (organizer) and Families (admin) `[Confirmed]`
PRD FR-23, FR-25.

```
┌─────────────────────────────┐
│ My families          120    │
│ [ Search family           ] │
│ [All] [Not sent 40] [No reply 55] │  filter chips
│ ┌─────────────────────────┐ │
│ │ Sharma family           │ │
│ │ Meena · Jaipur          │ │
│ │ Sent 2 Dec · Replied    │ │  status chips
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Verma family            │ │
│ │ Vikram · Pune           │ │
│ │ Not sent                │ │
│ │ [ Mark as sent ]        │ │  one tap
│ └─────────────────────────┘ │
└─────────────────────────────┘
```
- **"Mark as sent" is on the list itself.** One tap, then a message at the bottom for a few seconds: "Marked as sent. Undo". `[Confirmed]`
- Admins see the same list under the name **Families**. Organizers see **My families**, with two chips at the top: **[My families] [All families]**. "My families" is the default. "All families" shows every family, with the organizer's own first, so organizers can help each other. No extra tab. `[Confirmed]` 2026-10-30
- Reminders and WhatsApp buttons are a later release. In Wave 1 a family that was sent shows only the status chip.
- Buttons are at least 44 px high, to avoid taps on the wrong family.

### 6.8 Families and the family page `[Proposed]`
PRD FR-15, FR-19, FR-20, FR-41.
- **Families:** a searchable list with filter chips (side, event, organizer, no reply, no number). On a laptop it becomes a table with the same columns.
- **Family page:** the family's details at the top, then phone numbers (primary and secondary, with "swap" and "mark as incorrect"), the events on the invitation, the reply and who changed it ("Updated by Rohan"), and the assigned organizer.
- A duplicate number shows a clear message that names the family that has it.
- **Make admin** is switched off for a friend, with the text "Only family can be admins". `[Confirmed]`

### 6.9 Import `[Confirmed]`
PRD FR-16, FR-17. Three screens.

**Upload:** "Download template", then choose a file, then "Check file".

**Results:**
```
┌─────────────────────────────┐
│ guests.xlsx · 500 rows      │
│ 462 rows are fine           │
│ 38 rows need fixing         │
│ 6 warnings (no phone)       │
│ Save is locked until the    │
│ errors are fixed.           │
│                             │
│ Same number used twice  12 ▾│  errors grouped by problem
│ Family name is missing   3 ▾│
│ Number is not valid     18 ▾│
│ Organizer not in team    5 ▾│
│                             │
│ [ Download error list ]     │
│ [ Upload corrected file ]   │
└─────────────────────────────┘
```
- **Errors are grouped by problem.** A group opens to show its rows ("Row 45 · Verma family · 98765 1111"). Errors of one kind often have one cause. `[Confirmed]`
- Save works only with 0 errors. Warnings (such as no phone number) do not block it. Families already in the app are shown as "already in the app" and skipped (FR-17).
- **Confirm:** "Save 462 families?" with "Go back" and "Yes, save".
- **Done:** "462 families saved." with a button "Assign families to organizers". If the data changed in the meantime: "Nothing was saved. Check again."

### 6.10 Setup screens: settings, events, team `[Proposed]`
PRD FR-4 to FR-13.
- **Settings:** banner (with a crop preview), greeting, one theme colour (a choice of the 5 colours; the wedding stores the colour name), reply last date and stay last date (the pickers grey out days that are not allowed: before today, and after the latest allowed day, which is 2 days before the wedding for the reply date and 3 days before for the stay date), the RSVP link with a "Copy" button (locked after the first "Invitation sent"), and the guest preview button.
- **Events:** a list of cards with the colour dot, type, date and "hosted by". The form has the type as seven large options you tap, each with its colour dot (not a dropdown, 2026-10-31), then the name, date and time, venue, map link, note, "hosted by" and a **Note** (hint: "Only the team sees this for now"). The budget field comes with the Money release.
- **Team:** a list with role, relation and status chips (Active, Pending, Removed), the emails for admins only, an Add person page, and the buttons "Invite on WhatsApp" and "Copy invite message" for pending people. Invites go by WhatsApp message, with no email. The money switch comes with the Money release.

## 7. Navigation and layout `[Confirmed]`

| Screen size | Navigation |
|---|---|
| **Phone** | A bottom bar with four items: **Home, Families, Events, More** (in Wave 1, step 5.4, only **Home, Events, More** exist; the other items join when their pages are built). Organizers see "My families" instead of "Families". "More" holds the rest (Import, Team, Settings). |
| **Laptop** | A left sidebar with labels, in groups: **Home**, **Events**; **Guests** (Families, Import); **Team**, **Settings**. The content is never wider than about 1100 px. |

- The wedding's name and the TEST badge are in the top bar of every page of a test wedding.
- Guest pages have no navigation at all.
- Sections that do not exist yet (Money, Tasks, Requests in Wave 1) are hidden, not greyed out. They join the bar when they are built.

## 8. Accessibility `[Confirmed]`

Simple accessibility (PRD Section 9.6, decision D-11), not the full WCAG standard.
- Body text at least 16 px on team screens, 18 px on guest screens. No instruction text smaller than 16 px.
- Tap targets at least 44 px. Main buttons 48 px.
- Strong contrast, as calculated in Section 4.1.
- Status is always a word plus a colour.
- A visible focus outline.
- Error messages say what to do next.
- Forms keep what the person typed after a failed save.
- Respect the phone's "reduce motion" setting.

## 9. What to avoid `[Confirmed]`

- Pink, red or yellow as main colours (rose is only one of five optional couple colours). They appear only as tiny event dots and status chips.
- Cream and terracotta "wedding" colours, gold foil, floral borders, ornate frames, and clip-art rings.
- Text written on top of the couple's photo.
- Thin or tiny text, pale grey text, and icons without a label for important actions.
- Jokes or exclamation marks in error messages.
- Emojis in the interface.
- Shadows, gradients and glass effects for decoration.
- A big hero image on team screens.
- Anything that moves for no reason.

## 10. For later (not Wave 1)
- The home page that changes with the stage of the wedding (setup, invitations, replies, headcount). `[Confirmed]`
- Dark mode. `[Proposed]`
- Screens for expenses, tasks, stay and gifts. Same style and rules apply.

## 11. The Claude Design canvas

The screens were designed in Claude Design in prompts 4a to 4f. The result is `docs/design/ShaadiDesk.pdf` (60 pages). It is the visual reference for **how things look** (colours, type, spacing, layout). If the PDF and this document disagree about content or behaviour, this document wins. The PDF is not changed (decided 2026-10-30). The list below says where they differ.

**Differences from the PDF** (the builder follows this list, not the PDF)
1. Guest Screen 1: no wedding city under the date. It shows only "15 January 2027".
2. Setup checklist on the home page: no "by Dad". It shows only "Events added".
3. Guest page after a reply: no WhatsApp button next to "To change your reply, contact Rohan". There is no phone number of a team member.
4. Organizer's families screen: two chips at the top, **[My families] [All families]**.
5. Organizer's "Edit event" form: the field is "Note" with the hint "Only the team sees this for now". There is no "Note for guests" and no dress code.
6. "See it as a guest sees it": opens guest Screen 1 only. There is no family picker and no Screen 2 preview.
7. Any "Request access" screen, link or button is a later release (Wave 2). The Wave 1 help text is "Ask the person who sent you the card".
8. Reminders, "Send reminder" and WhatsApp buttons on the team screens are later releases.

**Fixed inputs used in every prompt**
- Product: ShaadiDesk, a web app to manage an Indian wedding. Tagline "Plan the shaadi, not the chaos."
- Colours and fonts: Section 4. Plum `#5B2A55`, Fraunces and DM Sans.
- Shape: cards 16 px, buttons and fields 12 px. Tap targets at least 44 px.
- Forbidden: Section 9.
- Content: real sample content, never lorem ipsum. People: Priya and Rahul (the couple), Meena (Sharma family, Jaipur), Rohan and Ankit (organizers), Dad (admin).
- Size: phone first (390 px wide), then a laptop version of the team screens.

## 12. Open items
None are blocking. Still open for the owner: dark mode stays off, and the colours for "Mata ki Chowki" and "Other" events are proposals.
