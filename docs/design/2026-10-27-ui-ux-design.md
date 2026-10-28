# ShaadiDesk: UI and UX Design

Date: 2026-10-27
Status: Draft 1. The owner reviews it. Then the Stitch prompt (Section 11) and the API design document follow.
Language: simple English, in the same style as the PRD.
Sources: PRD Section 10 (screens, flows and states), PRD Section 9.6 (accessibility), architecture document, and the design brainstorm of 2026-10-26 and 2026-10-27.

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
| **Wordmark** | "ShaadiDesk" in Fraunces. "Shaadi" in ink and "Desk" in jade. No drawn logo. `[Confirmed]` |
| **App icon** | A rounded jade square with a white serif **S**. `[Confirmed]` |
| **Why no symbol** | A clean wordmark looks modern. Rings and flowers look like a card shop. |

## 4. Visual style

### 4.1 Colours: Jade and Stone `[Confirmed]`

| Role | Name | Value | Used for |
|---|---|---|---|
| Main | **Jade** | `#1F5F5B` | Main buttons, links, the active tab |
| Main, soft | **Soft jade** | `#E3F0EE` | Selected rows, quiet highlights, chips |
| Page | **Page** | `#FAFAF8` | Page background. A very light warm grey, not cream. |
| Surface | **White** | `#FFFFFF` | Cards and fields |
| Line | **Stone** | `#E7E5E0` | Dividers and card borders |
| Field border | **Field line** | `#7D8A88` | Borders of input fields and toggles |
| Text | **Ink** | `#14201F` | All main text. Near-black with a hint of green. |
| Secondary text | **Muted** | `#5B6B69` | Secondary text. Never lighter than this. |

**Contrast, calculated** (the PRD asks for strong contrast, NFR-22):

| Pair | Ratio | Result |
|---|---|---|
| White on jade (button text) | 7.4 : 1 | Passes |
| Jade on page | 7.1 : 1 | Passes |
| Jade on soft jade | 6.3 : 1 | Passes |
| Ink on page | 16.0 : 1 | Passes |
| Muted on page | 5.4 : 1 | Passes |
| Muted on white | 5.6 : 1 | Passes |
| Field line on page | 3.4 : 1 | Passes (needs 3 : 1 for field edges) |
| Muted on stone | 4.45 : 1 | **Do not use.** Use ink on stone. |

**The couple's colour:** on the guest page, the couple's chosen colour replaces jade for the main button and small accents. The rest stays neutral. The app must check that the chosen colour is dark enough for white button text (at least 4.5 : 1). If it is not, the app uses a darker version and shows a warning in the settings. `[Proposed]`

**Event colours:** small markers only (a dot or a thin bar), never text and never big areas. `[Confirmed]` Values are `[Proposed]`.

| Event | Colour | Value |
|---|---|---|
| Haldi | Soft turmeric | `#C99A2E` |
| Mehendi | Leaf green | `#5B8C5A` |
| Sangeet | Indigo | `#4B4AA8` |
| Mata ki Chowki | Clay | `#A0673A` |
| Wedding | Jade | `#1F5F5B` |
| Reception | Slate | `#4A5D73` |
| Other | Stone grey | `#7A8583` |

**Status chips** (small, always a word plus a colour): `[Proposed]`

| Status | Text | Chip background | Ratio |
|---|---|---|---|
| Good (sent, replied, active) | Jade `#1F5F5B` | Soft jade `#E3F0EE` | 6.3 : 1 |
| Needs a look (pending, no number) | `#7A5200` | `#FBF1DA` | 6.2 : 1 |
| Problem (error, incorrect number) | `#A32620` | `#FBE9E7` | 6.3 : 1 |
| Neutral (not sent, no reply) | Ink | Stone `#E7E5E0` | high |

Amber and red appear only inside these small chips and in error messages. They are never used for buttons, backgrounds or headings. `[Confirmed]` (the owner asked not to overuse pink, red and yellow)

**Dark mode:** not in Wave 1. `[Proposed]`

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
| Tap targets | At least **44 px** high (NFR-23). Main buttons are **48 px** high and full width on phones. |
| Icons | One set of thin line icons (for example Lucide) in one style. Always with a text label next to important actions. |
| Motion | Very little. A gentle tick when a reply is saved. Soft fades. Nothing bounces. Respect "reduce motion". |
| Focus | A 3 px jade outline with a 2 px gap. |

### 4.4 The faint pattern `[Confirmed]`
A very faint geometric line pattern, inspired by lattice work (jali), sits behind the couple's names on the guest page header.
- Only the guest page header. Never on team screens. Never behind text that people must read in small sizes.
- One colour: the couple's colour at 4 to 6 percent opacity. Thin lines.
- If it does not look right in the first mockup, remove it. Nothing else depends on it.

## 5. Voice `[Confirmed]`

Warm and plain everywhere. A little personality only in happy moments (the thank-you after a reply, a finished setup). Never a joke in an error. Every message says what happened and what to do next. No emojis in the interface.

| Moment | Text |
|---|---|
| Guest greeting | "Namaste, Sharma family. You're invited to 2 events." |
| Reply saved (happy moment) | "Thank you. Your reply is saved. We can't wait to see you." |
| Empty families list | "No families yet. Import your guest list to begin." |
| Too many wrong tries | "Too many tries. Please wait 15 minutes, or ask for access." |
| Import has errors | "38 rows need fixing before you can save." |
| After "Mark as sent" | "Marked as sent. Undo" |
| Setup finished (happy moment) | "Your wedding is ready. Time to send the cards." |

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
│   15 January 2027 · Delhi   │
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
│  [   See my invitation    ] │  solid button
│                             │
│  Don't know the number?     │
│  Request access             │  quiet text link
└─────────────────────────────┘
```
- **The photo is on top and the names are below it on a plain background.** Never put text on the photo, because the photo is unknown and the text may be unreadable. `[Confirmed]`
- The four digit boxes open the number keypad on phones, and move to the next box by themselves.
- Matches show the family name and the contact name or city, so two "Sharma" families can be told apart. They appear only after 3 letters (FR-28).
- "Request access" is a quiet link (Wave 2 feature, FR-39). Until it exists, the text "Ask <organizer name> for help" shows instead. `[Proposed]`
- The faint pattern sits behind the names.

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
- Choosing "No" folds the "how many" part away.
- "Review and submit" opens a summary with the warning "You cannot change this reply later. Do you want to submit?" and two buttons: "Go back" and "Yes, submit".
- After the server confirms, the page shows the reply as read-only with "Replied by Meena, 5 Dec" and "To change your reply, contact Rohan" (with a WhatsApp button). A gentle tick appears once.

**States:** not replied, confirm, sending (the button cannot be pressed twice), replied, updated by the team, closed after the last date, stay not ready, network error ("Not sent. Try again." and the typed reply stays on the page).

### 6.3 Link preview (WhatsApp)
PRD FR-38. Shows only the couple's banner, "Priya & Rahul's Wedding" and the month. Never family names or events. `[Confirmed]`

### 6.4 Sign-in `[Proposed]`
A calm page: the wordmark, the tagline "Plan the shaadi, not the chaos.", and one large button "Continue with Google". Nothing else. PRD FR-1.

### 6.5 My weddings and Make a wedding `[Confirmed]`
PRD FR-2, FR-3.
- **My weddings:** a list of cards, each with the couple's names, the date and a TEST badge if needed. A button "Make a wedding".
- **Make a wedding:** one short form. Bride's name, groom's name, wedding date, "You are the…" (Bride, Groom, Parent, Sibling), and a checkbox "This is a test wedding". After that, the guided home opens.

### 6.6 The guided home (dashboard) `[Confirmed]`
PRD FR-24, FR-43, FR-44.

```
┌─────────────────────────────┐
│ Priya & Rahul     [TEST]  ⚙ │
│ 15 Jan 2027 · 80 days to go │
│ Today ─ Cards out ─ Replies close 31 Dec ─ Wedding │   timeline strip
│ ┌─────────────────────────┐ │
│ │ NEXT STEP               │ │  the big next-step card
│ │ Add your team           │ │
│ │ Invite Rohan and Ankit. │ │
│ │          [ Add team ]   │ │
│ └─────────────────────────┘ │
│  ✓ Wedding created          │
│  ✓ Events added (by Dad)    │
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
│ Home Families Money Tasks More │  bottom bar
└─────────────────────────────┘
```
- **During setup** the home shows the next-step card and a short, collapsed checklist. **After setup** it shows the summary strip, then "Needs attention", then the details. `[Confirmed]`
- **Next-step card:** one step, one button. The other steps are collapsed under "4 more steps". `[Confirmed]`
- **Checklist steps:** 1 Make the wedding, 2 Invite your helpers, 3 Add events, 4 Set the reply dates, 5 Import your guest list (locked until events and team exist, with a note), 6 Copy your RSVP link. Steps show who did them ("Events added by Dad"). `[Confirmed]`
- **Invite your helpers comes early.** Each person gets a ready WhatsApp message to join (FR-9). Then setup can run in parallel. `[Confirmed]`
- **See it as a guest sees it:** once the names, photo and colour are set, a button opens the real RSVP page with the couple's photo and colour. It catches a bad photo before the cards are printed. `[Confirmed]`
- **Timeline strip:** Today, Cards out, Replies close, Wedding, with the real dates. `[Confirmed]`
- The home page changes with the stage (setup, invitations, replies, headcount). **Later, not in Wave 1.** `[Confirmed]`
- On a laptop the same content sits in the main area next to the sidebar, in two columns.

### 6.7 My families (organizer) `[Confirmed]`
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
- For a family that was sent and has not replied, the button becomes **"Send reminder"**, which opens a WhatsApp chat with a ready message (Wave 2, FR-25).
- Buttons are at least 44 px high, to avoid taps on the wrong family.

### 6.8 Families and the family page `[Proposed]`
PRD FR-15, FR-19, FR-20, FR-41.
- **Families:** a searchable list with filter chips (side, event, organizer, no reply, no number). On a laptop it becomes a table with the same columns.
- **Family page:** the family's details at the top, then phone numbers (primary and secondary, with "swap" and "mark as incorrect"), the events on the invitation, the reply and who changed it ("Updated by Rohan"), and the assigned organizer.
- A duplicate number shows a clear message that names the family that has it.

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
- **Settings:** banner (with a crop preview), greeting, one theme colour (with the contrast check), reply last date and stay last date, the RSVP link with a "Copy" button (locked after the first "Invitation sent"), and the guest preview button.
- **Events:** a list of cards with the colour dot, type, date and "hosted by". The form has a type list, name, date and time, venue, map link, note, budget (admins and people with money access) and "hosted by".
- **Team:** a list with role, relation and status chips (Active, Pending, Removed), the money switch for each organizer, and the buttons "Invite on WhatsApp" and "Copy invite message" for pending people.

## 7. Navigation and layout `[Confirmed]`

| Screen size | Navigation |
|---|---|
| **Phone** | A bottom bar with five items: Home, Families, Money, Tasks, More. "More" holds the rest. Organizers without money access see "Money" as "My expenses". |
| **Laptop** | A left sidebar with labels, in groups: **Home**, **Events**; **Guests** (Families, Import, Requests); **Money** (Expenses, Budget); **Team**, **Settings**. The content is never wider than about 1100 px. |

- The wedding's name and the TEST badge are in the top bar of every page of a test wedding.
- Guest pages have no navigation at all.
- Sections that do not exist yet (Money, Tasks, Requests in Wave 1) are hidden, not greyed out.

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

- Pink, red or yellow as main colours. They appear only as tiny event dots and status chips.
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

## 11. Notes for the Stitch prompt

These stay the same in every prompt, so the screens look like one product.

**Fixed inputs**
- Product: ShaadiDesk, a web app to manage an Indian wedding. Tagline "Plan the shaadi, not the chaos."
- Style: modern, calm, elegant, not traditional. Lots of space, thin borders, almost no shadows.
- Colours: jade `#1F5F5B`, soft jade `#E3F0EE`, page `#FAFAF8`, white, stone `#E7E5E0`, ink `#14201F`, muted `#5B6B69`.
- Fonts: Fraunces for the couple's names and titles. DM Sans for everything else.
- Shape: cards 16 px, buttons and fields 12 px. Buttons 48 px high. Tap targets at least 44 px. Body text 16 to 18 px.
- Forbidden: pink, red or yellow as main colours, cream and terracotta, gold, floral ornaments, text on photos, emojis, shadows for decoration.
- Content: use real sample content, never lorem ipsum. People: Priya and Rahul (the couple), Meena (guest, Sharma family, Jaipur), Rohan and Ankit (organizers), Dad (admin). Events: Haldi, Mehendi, Sangeet, Wedding, Reception.
- Size: phone first (390 px wide), then a laptop version (1280 px wide) of the team screens.

**Order of screens to ask for**
1. Guest Screen 1 and Screen 2, plus its closed and replied states (highest polish)
2. Guided home on a phone and on a laptop
3. My families
4. Import results
5. Make a wedding, settings, events, team

## 12. Open items
None are blocking. The values marked `[Proposed]` (event colours, status chip colours, the crop and contrast checks, dark mode off) stay open for the owner to confirm or change.
