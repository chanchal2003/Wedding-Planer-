# ShaadiDesk: Product Requirements Document (PRD)

**Label rules:**
- `[Confirmed]`: the owner stated this.
- `[Assumption]`: the writer inferred this. Section 15 also records it.
- `[Proposed]`: the writer recommends this. The owner must approve it.
- `TBD`: a value that is not decided.

## 1. Document Information

| Item | Value |
|---|---|
| Product name | ShaadiDesk `[Confirmed]` |
| Document | Product Requirements Document (PRD) |
| Author | Chanchal (owner), with Claude Code (writer) |
| Created | 2026-10-16 |
| Updated | 2026-10-24 |
| Version | v0.3 (practice project with dummy data; build in waves) |
| Status | Draft. The owner reviews each section. |
| Context | Practice project. Dummy data only. The real wedding moved (2026-10-24). `[Confirmed]` |
| Language | ASD-STE100 Simplified Technical English (STE) `[Confirmed]` |
| Build team | The owner, with Claude Code `[Confirmed]` |
| Source document | Design document: `docs/superpowers/specs/2026-10-16-wedding-management-design.md` `[Confirmed]` |
| Architecture | `docs/architecture/2026-10-24-shaadidesk-architecture.md` `[Confirmed]` |
| Rule if documents do not agree | This PRD gives the requirements. The design document gives the details. If the two documents do not agree, stop and ask the owner. `[Proposed]` |

## 2. Product Overview

> **Change on 2026-10-24** `[Confirmed]`: The first real wedding moved. ShaadiDesk is now a **practice project**. It uses **dummy data only**. The features and rules in this PRD do not change. The original wedding (approximately 500 families, 5 events, mid-January 2027) is now the **test scenario**: the dummy data must have this size and shape. Text about real guests, real dates and launch describes the target product, for a real wedding in the future.

### 2.1 Product summary

ShaadiDesk is a free web app for Indian weddings. The couple and their family and friends use it to manage events, guests, invitation tracking, RSVPs, expenses, tasks, stay and gifts in one location. Guests use one RSVP link to see only their events and reply. `[Confirmed]`

### 2.2 Background and context

- An Indian wedding has many events. Examples are haldi, mehendi, sangeet, wedding and reception. `[Confirmed]`
- Each guest family goes to some events, but not to all events. `[Confirmed]`
- Many family members pay many vendors. Money comes from the bride side and the groom side. `[Confirmed]`
- Many family members and friends help. Each helper does different tasks. `[Confirmed]`
- Today, families keep this data in WhatsApp chats, spreadsheets and their memory. `[Confirmed]`
- The test scenario is one wedding: approximately 500 families, 5 events, wedding in approximately mid-January 2027. It was a real wedding, and it moved. The app now uses dummy data for this scenario. `[Confirmed]`
- The app must support many weddings from the start. `[Confirmed]`

### 2.3 Why it is needed now

- The first wedding is in approximately mid-January 2027. `[Confirmed]`
- The family sends invitations in December 2026. The guest list, invitation tracking and RSVP must operate before then. `[Confirmed]`
- Vendor advances are possibly paid now. The family needs to record expenses early. `[Assumption]`

### 2.4 Value proposition

| For | ShaadiDesk gives | Instead of |
|---|---|---|
| Admins (couple and close family) | One view of all events, guests, replies, money and tasks. Control of who sees money. | Many WhatsApp chats and spreadsheets |
| Organizers (helpers) | A clear list of their families and tasks. A fast form to record expenses. | Calls and messages to ask "what do I do?" |
| Guests | One link. They see only their events and reply in a few taps. | Long calls and messages to confirm events and headcount |

**Main differences:** `[Confirmed]`
- Each family sees only the events on its invitation.
- The family runs the wedding together, with roles and private money.
- Guests, invitations, money and tasks are in one app.
- It is free.

## 3. Problem Statement

### 3.1 The problem

Indian weddings are tedious and difficult to manage, because many things occur at the same time. `[Confirmed]` The family must control these items, but has no single location for them:
- **Events:** Many events, each with its own date, venue, guests and costs. `[Confirmed]`
- **Guests:** Hundreds of families. Some families go only to the wedding. Some families go to all events. `[Confirmed]`
- **Replies:** The family must know who comes to which event, and how many persons. `[Confirmed]`
- **Money:** Many persons pay many vendors, often in parts (advance, then the remaining money). `[Confirmed]`
- **Tasks:** Many helpers do many tasks. `[Confirmed]`
- **Stay:** Some guests from other cities need rooms. `[Confirmed]`

### 3.2 Who has the problem and how it affects them

| Who | Effect |
|---|---|
| Couple and close family | They do not know the total cost, the money that is due, or who paid what. They cannot see the full status of the wedding in one location. `[Confirmed]` |
| Helpers (family and friends) | They do not know which families to invite or which tasks to do. They ask many questions on calls and chats. `[Confirmed]` |
| Guests | They do not know clearly which events they are invited to. They reply by calls and messages, and the family must record these replies by hand. `[Confirmed]` |

### 3.3 Current alternatives and workarounds

| Alternative | Limits |
|---|---|
| WhatsApp chats and groups `[Confirmed]` | Data is lost in long chats. Nobody has a full list of replies, money or tasks. `[Assumption]` |
| Spreadsheets (Excel) `[Confirmed]` | One person keeps the file. Other helpers cannot update it easily from a phone. Guests cannot reply in it. `[Assumption]` |
| Memory of family members `[Confirmed]` | Data is forgotten. `[Assumption]` |
| Weddingkart (India), from desk research during design `[Assumption]` | Sends WhatsApp invitations for many events and collects RSVPs. It is not known if it has expenses, tasks or family roles. Not verified. |

### 3.4 Supporting evidence

- No user research, survey or data was supplied. The problem statement comes from the experience of the owner. `[Confirmed]`
- The owner decided not to do user research before the first version, because the time is short. `[Confirmed]`

## 4. Target Users and Personas

### 4.1 User groups

| Group | Type | Who | Size (first wedding) |
|---|---|---|---|
| Admin | Primary | The bride, the groom, and their parents or siblings that an admin makes admin `[Confirmed]` | 2 to 6 persons `[Assumption]` |
| Organizer | Primary | Family members and friends that help `[Confirmed]` | 3 to 10 persons `[Assumption]` |
| Guest | Secondary | Members of invited families `[Confirmed]` | Approximately 500 families `[Confirmed]` |

Admins and organizers use the app every day. Guests use the app one or two times. `[Assumption]`

### 4.2 Goals, needs and pain points

| Group | Goals | Needs | Pain points today | Characteristics |
|---|---|---|---|---|
| Admin | Run a good wedding. Control the cost. | See all events, replies, money and tasks. Decide who sees money. Give work to helpers. | No full view. Money is not clear. `[Confirmed]` | Uses a phone and a laptop. Signs in with Google. `[Confirmed]` |
| Organizer | Do their part well. | A list of their families and tasks. A fast way to record expenses and phone replies. | Does not know what to do next. Asks many questions. `[Confirmed]` | Mostly uses a phone. Signs in with Google. Some organizers must not see money. `[Confirmed]` |
| Guest | Know their events. Reply easily. | See only their events. Reply in a few taps. Ask for a stay. | Not clear which events they are invited to. `[Confirmed]` | Uses WhatsApp on a smartphone `[Assumption]`. Many are older relatives `[Confirmed]`. Does not want an account. `[Confirmed]` |

### 4.3 Personas (hypothetical)

These persons are examples only. They are not real research.

**Priya, the bride (admin)**
- 27 years. Uses a laptop and a phone.
- Sets up the wedding and the events. Imports the guest list from Excel. Assigns families to helpers.
- Wants to see who replied and who did not, without calls to each helper.

**Dad, father of the bride (admin)**
- 58 years. Uses a phone.
- Pays most vendors. Wants to know the total cost, what is paid and what is due.
- Does not want friends to see the money.

**Ankit, a friend of the groom (organizer, no money access)**
- 28 years. Uses a phone.
- Looks after 120 groom-side families. Sends cards from his own WhatsApp and marks them as sent.
- Buys flowers for the haldi and records the cost.

**Rohan, a cousin (organizer)**
- 32 years. Uses a phone.
- Relatives call him to reply. He enters these replies in the app.
- Books the pandit and the DJ.

**Meena Aunty (guest)**
- 62 years. Uses WhatsApp on an Android phone. Does not use many apps.
- Gets the card on WhatsApp. Taps the link, finds "Sharma family", types 4 digits, and replies.
- Needs large text and clear buttons. If she has a problem, she calls a family member.

### 4.4 Key use cases

| ID | Use case | User |
|---|---|---|
| UC-1 | Make a wedding, add events and add the team | Admin |
| UC-2 | Import the guest list and assign families to organizers | Admin |
| UC-3 | Send the card outside the app and mark "Invitation sent" | Organizer |
| UC-4 | Find the family, confirm with 4 digits and reply | Guest |
| UC-5 | Request access when the guest does not know the family number | Guest, Organizer |
| UC-6 | Enter a reply that came by a phone call | Organizer |
| UC-7 | Send reminders to families with no reply | Organizer |
| UC-8 | Record an expense and its payments | Admin, Organizer |
| UC-9 | See the cost, money due and repayments | Admin |
| UC-10 | Make, assign and complete tasks | Admin, Organizer |
| UC-11 | Ask for a stay, and assign rooms | Guest, Organizer |
| UC-12 | Record gifts | Admin, Organizer |

## 5. Goals, Success Metrics, and Non-Goals

### 5.1 Product goals

| ID | Goal |
|---|---|
| G1 | Manage all of one wedding with ShaadiDesk: approximately 500 families, 5 events (test scenario with dummy data). `[Confirmed]` |
| G2 | Make the guest list, invitation tracking and RSVP operate before the family sends invitations in December 2026. `[Confirmed]` |
| G3 | Show the money clearly: budget, spent, due, who paid, and the share of each side. `[Confirmed]` |
| G4 | Keep money private from helpers who do not need it. `[Confirmed]` |
| G5 | Make the RSVP easy for older relatives on a phone. `[Confirmed]` |
| G6 | Support many weddings from the start. `[Confirmed]` |
| G7 | Cost zero, or almost zero, to operate. `[Confirmed]` |

### 5.2 Business goals

Not applicable for this release. ShaadiDesk is free and has no business model now. `[Confirmed]`

### 5.3 Success metrics

The owner accepted these metrics on 2026-10-16 and changed M4. There is no earlier data, so each baseline is TBD.

**With dummy data** `[Confirmed]`: M1, M2, M3 and M5 need real guests, so they are not measured. The reports for them (FR-54) are tested with the dummy data. M4 does not apply. M6, M7 and M8 apply as written.

| ID | Metric | Why it matters | Baseline | Target | Timeframe | Measurement method |
|---|---|---|---|---|---|---|
| M1 | Families with a reply (from the guest or from an organizer) | Shows that the RSVP process operates | TBD | 90% or more | At the RSVP last date | App report: families with a reply ÷ all families |
| M2 | Families marked "Invitation sent" | Shows that no family is forgotten | TBD | 100% | Before the RSVP last date | App report: "Invitation sent" ÷ all families |
| M3 | Replies that guests sent on their own | Shows that guests can use the RSVP page without help | TBD | 60% or more | At the RSVP last date | App report: replies by guests ÷ all replies |
| M4 | Wedding expenses recorded in the app | Shows that the family uses the app, not WhatsApp, for money | TBD | All expenses, of any amount `[Confirmed]` | 2 weeks after the wedding | Admin compares the app totals with bills and bank records |
| M5 | Access requests that an organizer approves or rejects in time | Guests must not wait | TBD | 90% in less than 24 hours | Until the RSVP last date | App report: time from request to decision |
| M6 | Time to open the RSVP page on a phone, also after a long time with no use | Older relatives leave slow pages | TBD | Approximately 1 second | Before launch and during December | Test on 3 phones on a mobile network |
| M7 | Cost to operate | The app must be free | ₹0 | ₹0 | Until 6 months after the wedding | Bills of hosting providers |
| M8 | Data loss incidents | Lost replies or money data damage trust | TBD | 0 | Until 6 months after the wedding | Incident record by the owner |

### 5.4 Non-goals and out of scope (this release)

| Item | Reason |
|---|---|
| Make, design or send the invitation card (image or PDF) | The family does this outside the app. `[Confirmed]` |
| Automatic or paid messages (WhatsApp Business API, SMS, email) | Cost, and business registration for SMS. `[Confirmed]` |
| Login with a one-time code (OTP) for guests | Cost and registration. The family search and 4-digit check replace it. `[Confirmed]` |
| Guests that add themselves to the guest list | The guest list comes from the Excel import. `[Confirmed]` |
| Guests that edit a reply after they submit it | Organizers change replies. `[Confirmed]` |
| Food preferences | All food is vegetarian. `[Confirmed]` |
| Travel data (arrival, departure, pickup) | Not necessary for the first version. `[Confirmed]` |
| Payments in the app | The app records money only. `[Confirmed]` |
| More than one language | English only. `[Confirmed]` |
| Photo gallery, live stream, day schedule, full vendor page | Later versions. `[Confirmed]` |
| Sales to other couples, billing, marketing website | ShaadiDesk is free. `[Confirmed]` |

## 6. Scope and Prioritization

### 6.1 MoSCoW

**Build order (changed on 2026-10-24)** `[Confirmed]`: There are no fixed dates now. The Must Have items are built in two waves:
- **Wave 1 (first):** weddings and team (roles, money switch, Google sign-in), guest list and Excel import, RSVP page (family search, 4-digit check, one-time reply, last date, link preview, privacy note), organizers enter replies, "My families" and "Invitation sent" with progress, guest count dashboard with a "needs attention" list (three rows: no reply, no phone number, invitation not sent), event colour dots, server access rules, CSV export (three files) and daily database copy. `[Confirmed]` 2026-10-29
- **Wave 2 (after Wave 1, the owner decides):** request access and approval, reminder list and "Send reminder" (with WhatsApp buttons), fast expense form, event type icons, the "open access requests" row in "needs attention".
- Then the Should Have items, in the order of the table. Could Have items only if the owner asks.

The dates in the table are from the original plan for the real wedding. They show the order, not deadlines.

| Priority | Item | Date |
|---|---|---|
| **Must Have** | Weddings and events (also test weddings) | 10 Nov |
| | Event type list (Haldi, Mehendi, Sangeet, Mata ki Chowki, Wedding, Reception, Other) with a color for each type (icons come in Wave 2) `[Proposed]` | 10 Nov |
| | Team, roles, Google sign-in and the money access switch | 10 Nov |
| | Guest list and Excel import (primary and secondary number, events of each family, assigned organizer) | 10 Nov |
| | Invitation tracking: RSVP link, "My families", "Invitation sent", progress of each organizer | 10 Nov |
| | Reminder list and "Send reminder" button (Wave 2) | 10 Nov |
| | RSVP page: family search, 4-digit check, one-time reply, last date, link preview, privacy note | 10 Nov |
| | Request access and approval (Wave 2) | 10 Nov |
| | Organizers enter and change replies | 10 Nov |
| | Fast expense form (amount, event or whole wedding, description) | 10 Nov |
| | Dashboard: guest counts and "needs attention" (three rows in Wave 1) | 10 Nov |
| | Server access rules, CSV export, daily database copy | 10 Nov |
| **Should Have (November)** | Full expenses: payments, money due, repayments, charged-to side, category, vendor, bill photo | 30 Nov |
| | Edit history and soft delete for expenses | 30 Nov |
| | Budget views and budget summary on the dashboard | 30 Nov |
| | Reports for the success metrics (M1, M2, M3, M5) | 30 Nov |
| **Should Have (December)** | Tasks, also purchase tasks that make expenses | December |
| | Starter tasks for each event type `[Proposed]` | December |
| | Stay: request, room assignment, lists | December |
| | Gifts and shagun | December |
| | Automatic delete of guest data 6 months after the wedding, and delete of a full wedding | December |
| **Could Have** `[Proposed]` | QR code image of the RSVP link to download | If time permits |
| | WhatsApp help button to the organizer on the RSVP page | If time permits |
| | WhatsApp button to tell a person about a task | If time permits |
| **Won't Have (this release)** | All items in Section 5.4 | — |

### 6.2 MVP definition

The MVP is the Must Have list. An admin imports approximately 500 families and assigns them to organizers. Organizers send the card outside the app and mark each family as "Invitation sent". Guests open one RSVP link, find their family, confirm with 4 digits and reply one time for their events. The team sees all replies and records expenses quickly.

### 6.3 Rationale

**Must Have:**

| Item | Why it is a Must Have |
|---|---|
| Weddings, events, team and roles | All other features need them. |
| Guest list and import | Guests and replies need families. 500 families cannot be typed by hand. |
| Invitation tracking and reminders | Invitations go out in December. Organizers must know whom they invited. |
| RSVP page, request access, organizer replies | This is the main reason for the first deadline. |
| Fast expense form | Vendor advances are paid now. The family must record them early. |
| Dashboard (guests) | The team must see who replied. |
| Server access rules, export, backup | Privacy and data safety are necessary from the first day. |

**Deferrals:**

| Item | Why it can wait |
|---|---|
| Full expenses and budget views (to 30 Nov) | The fast form records the money now. The details can follow. |
| Tasks, stay, gifts (to December) | The family needs them closer to the wedding. Guests can fill the stay section later from a reminder. |
| Automatic data delete (to December) | It runs 6 months after the wedding. |
| Could Have items | They help, but the family can do the same work by WhatsApp. |

## 7. User Stories and Journeys

### 7.1 User stories

All user stories come from decisions of the owner `[Confirmed]`, except where a different label shows.

**Weddings, events and team**

| ID | User story | Priority |
|---|---|---|
| US-1 | As a bride, groom, parent or sibling, I want to make a wedding, so that my family can manage it in one location. | Must |
| US-2 | As an admin, I want to add, edit and delete events, so that the app shows the real events. | Must |
| US-3 | As an admin, I want to set the banner, greeting, colors and last dates, so that guests see our wedding details. | Must |
| US-4 | As an admin, I want to make a test wedding, so that I can try the app before the real invitations. | Must |
| US-5 | As an admin, I want to add organizers by email, so that helpers can use the app. | Must |
| US-6 | As an admin, I want to turn "can see money" on or off for each organizer, so that money stays private. | Must |
| US-7 | As an admin, I want to make a parent or sibling an admin, so that close family can share control. | Must |
| US-8 | As an admin, I want to give the families and tasks of an organizer to a different person before I remove the organizer, so that nothing is left without an owner. | Must |
| US-35 | As an admin, I want to select the event type from a list (or select "Other" and type a name), so that I add events quickly and guests see the correct icon and color. `[Proposed]` | Must |

**Guest list and invitations**

| ID | User story | Priority |
|---|---|---|
| US-9 | As an admin, I want to import the guest list from an Excel file, so that I do not type 500 families. | Must |
| US-10 | As an organizer, I want to add and edit a family, so that the guest list stays correct. | Must |
| US-11 | As an admin, I want to assign families to organizers, so that each helper knows their families. | Must |
| US-12 | As an admin, I want to copy the RSVP link, so that the family can put it on the card. | Must |
| US-13 | As an organizer, I want to see "My families" and tick "Invitation sent", so that I know whom I invited. | Must |
| US-14 | As an admin, I want to see the progress of each organizer, so that I know if invitations are late. | Must |
| US-15 | As an organizer, I want to see families with no reply and send a reminder, so that more families reply. | Must |

**RSVP**

| ID | User story | Priority |
|---|---|---|
| US-16 | As a guest, I want to find my family and confirm with 4 digits, so that I see my invitation. | Must |
| US-17 | As a guest, I want to reply yes or no for each event, with the number of persons, so that the family can plan. | Must |
| US-18 | As a guest who does not know the family numbers, I want to request access, so that I can still see the invitation. | Must |
| US-19 | As an organizer, I want to approve or reject access requests, so that only real family members get access. | Must |
| US-20 | As an organizer, I want to enter or change a reply for a family, so that replies by phone are recorded. | Must |
| US-21 | As an admin, I want to see guest counts for each event and side, so that I can plan the caterer and venue. | Must |

**Money**

| ID | User story | Priority |
|---|---|---|
| US-22 | As an organizer, I want to add an expense in a few seconds, so that I do not forget it. | Must |
| US-23 | As an admin, I want to add payments to an expense, so that I know what is paid and what is due. | Should (Nov) |
| US-24 | As an admin, I want to see budgets, totals, money due and repayments, so that I control the cost. | Should (Nov) |
| US-25 | As an admin, I want to see who changed an expense and restore a deleted expense, so that no money record is lost. | Should (Nov) |
| US-26 | As an admin, I want to see reports for the success metrics, so that I know if the RSVP process operates. | Should (Nov) |

**Tasks, stay and gifts**

| ID | User story | Priority |
|---|---|---|
| US-27 | As an admin, I want to make tasks and assign them, so that each helper knows their work. | Should (Dec) |
| US-28 | As an organizer, I want to see "My tasks", make tasks for myself and take tasks with no owner. | Should (Dec) |
| US-29 | As an organizer, I want the app to make the expense when I complete a purchase task, so that I do not enter it two times. | Should (Dec) |
| US-30 | As a guest, I want to tell the family that we need a stay, for how many persons and days. | Should (Dec) |
| US-31 | As an organizer, I want to assign a hotel and rooms to a family, so that each guest has a room. | Should (Dec) |
| US-32 | As an admin or organizer, I want to record the gift of each family, so that we can send thank-you notes and give back. | Should (Dec) |
| US-36 | As an admin, I want the app to add starter tasks for each event type, and I can keep, change or delete them, so that I do not type all tasks myself. `[Proposed]` | Should (Dec) |

**Privacy and data**

| ID | User story | Priority |
|---|---|---|
| US-33 | As an admin, I want to export all data to CSV, so that I have a copy. | Must |
| US-34 | As a guest, I want my data deleted after the wedding, so that my phone number is safe. | Should (Dec) |

### 7.2 Main journeys

**J1. Set up the wedding (Priya, admin)** — US-1 to US-11, US-35, US-36
1. Priya signs in with Google.
2. She makes the wedding and selects "Bride".
3. She adds 5 events. For each event, she selects the type from the list (for example "Haldi") and adds the date, venue and "hosted by". All event types use the same form. For a ceremony that is not on the list, she selects "Other" and types the name.
   - When tasks are available (December), the app adds starter tasks for the type. For Haldi: "Buy turmeric", "Order marigold flowers", "Yellow dupattas for family". Priya keeps, changes or deletes them.
4. She adds the banner photo, greeting, RSVP last date and stay last date.
5. She adds Dad as admin, and Ankit and Rohan as organizers. She turns money access off for Ankit.
6. She downloads the Excel template and fills it.
7. She imports the file. The app shows a preview and flags 3 duplicate numbers. She corrects them and saves.
8. She assigns 120 groom-side families to Ankit.

**J2. Send invitations (Ankit, organizer)** — US-12, US-13, US-14
1. Priya copies the RSVP link and the family puts it on the card.
2. Ankit opens "My families". He sees 120 families with the status "not sent".
3. He sends the card and the link from his own WhatsApp to the primary number of the Sharma family.
4. He ticks "Invitation sent". The app records the date and his name.
5. Priya sees "Ankit: 120 families, 80 sent, 35 replied".

**J3. Reply (Meena Aunty, guest)** — US-16, US-17
1. Meena taps the link on the card.
2. She types "Sha". The app shows "Sharma family (Meena, Jaipur)". She selects it.
3. She types the last 4 digits of her number.
4. The app shows her 2 events: haldi and wedding.
5. She selects "Yes, 2 persons" for the haldi and "Yes, 4 persons" for the wedding.
6. She pushes "Submit". The app shows a summary and a warning. She pushes "Yes, submit".
7. The app shows the reply as read-only.
8. Next time, the link opens her invitation directly.

**J4. Reply by phone (Rohan, organizer)** — US-20
1. Uncle Verma calls Rohan: "5 of us will come to the wedding."
2. Rohan opens the Verma family and enters "Wedding: yes, 5 persons".
3. The app shows "updated by Rohan".

**J5. Record an expense with payments (Dad, admin)** — US-22 to US-24
1. Dad adds an expense: ₹1,50,000, Sangeet, "Stage decoration".
2. He adds a payment: ₹50,000, paid by Dad.
3. Later, Uncle Ramesh adds a payment: ₹50,000, paid by Uncle Ramesh, not repaid.
4. The app shows: paid ₹1,00,000, due ₹50,000, and "Uncle Ramesh paid ₹50k, not repaid".

**J6. Complete a purchase task (Ankit, organizer)** — US-27 to US-29
1. Priya assigns "Buy marigold garlands – 50" (purchase) to Ankit.
2. Ankit buys them and pushes "Done".
3. The app asks for the cost. He types ₹4,000.
4. The app makes the expense with "paid by Ankit" and closes the task.

**J7. Stay (guest and organizer)** — US-30, US-31
1. In the RSVP page, the Sharma family selects "Stay needed: yes, 4 persons, 3 days" and submits.
2. Rohan sees the Sharma family in "needs a stay".
3. He types "Hotel Raj, rooms 101 and 102". The family moves to "room assigned".

### 7.3 Alternative and failure flows

| ID | Flow | What occurs |
|---|---|---|
| AF-1 | Guest types fewer than 3 letters | The app shows no matches. It shows "Type at least 3 letters." |
| AF-2 | Guest does not find the family | The app shows "No family found. Check the spelling, or ask the person who sent you the card." (Request access comes in Wave 2.) |
| AF-3 | Guest types incorrect digits | The app shows "The number does not match. Check the last 4 digits and try again." After 5 incorrect attempts, the app stops attempts on that device for a period. |
| AF-4 | Guest does not know the family numbers | The app shows "Ask the person who sent you the card." In Wave 2 the guest can use "Request access" (US-18) and an organizer approves it. |
| AF-5 | Family already replied | The app shows the reply as read-only, with "To change your reply, contact <organizer>". |
| AF-6 | Two family members submit at the same time | The app keeps the first reply. The second person sees the first reply. |
| AF-7 | Guest opens the link after the RSVP last date | The app shows "Replies are closed. Contact <organizer>." |
| AF-8 | Family reached the device limit | The app shows "Too many devices. Ask the person who sent you the card." An organizer resets the devices. |
| AF-9 | Import file has errors (duplicate numbers, missing family name, no event) | The preview shows each error. The admin downloads the error list, corrects the file and uploads it again. Save is possible only with 0 errors. |
| AF-16 | A second import has families that are already in the app | The app skips them with the note "already in the app". It adds only the new families. |
| AF-10 | Family has no phone number | The app flags the family. Guests of this family ask the person who sent the card (Wave 2: "Request access"). Organizers can enter the reply. |
| AF-11 | Admin removes an organizer | The app asks the admin to give the families and open tasks to a different person first. |
| AF-12 | Admin deletes an event | The app shows the linked families, replies, expenses and tasks, and asks for confirmation. Replies for that event are removed. Expenses and tasks move to "whole wedding". |
| AF-13 | Organizer removes an event from a family | The app removes the reply of that family for that event. |
| AF-14 | Network fails during submit | The app shows "Not sent. Try again." The reply is not saved until the server confirms it. `[Proposed]` |
| AF-15 | Organizer without money access opens a money page | The app does not show the page. The server does not send the data. |

## 8. Functional Requirements

**Rules for this section:**
- Each requirement is `[Confirmed]` in the design document, unless it has a different label.
- The priority comes from Section 6.1.
- "Must" = 10 Nov. "Should (Nov)" = 30 Nov. "Should (Dec)" = before the stay last date. "Could" = if time permits.
- "The team" = admins and organizers.
- The server applies all access rules (FR-64). It is not sufficient to hide data in the user interface.

### 8.1 Weddings, events and team

| ID | Requirement | Priority | User Story | Dependencies |
|---|---|---|---|---|
| FR-1 | Admins and organizers must sign in with Google. Guests do not sign in. | Must | US-1, US-5 | — |
| FR-2 | A signed-in person can make a wedding. The person selects their relation: bride, groom, parent or sibling. Team members also have a relation from one list: bride, groom, parent, sibling, relative, friend or other ("cousin" is shown as "Relative"). Only family can be admins: "Make admin" is off for a friend. This person becomes the admin. A real wedding must have the names of the bride and groom, and a wedding date in the future. | Must | US-1 | FR-1 |
| FR-3 | An admin can make a test wedding. A test wedding can have any date and false guests. All team pages show a "TEST" badge, and the guest pages show a "TEST" ribbon. An admin can delete a test wedding in one step. | Must | US-4 | FR-2 |
| FR-4 | An admin can set the banner photo, greeting, colors, RSVP last date and stay last date. The stay last date must be earlier than the RSVP last date. | Must | US-3 | FR-2 |
| FR-5 | An event has: type, date and start time, venue name, map link, a note (only the team sees it for now), budget and "hosted by" (bride side, groom side or both). The type comes from a list: Haldi, Mehendi, Sangeet, Mata ki Chowki, Wedding, Reception, Other. For "Other", the admin types the name. All types use the same form. The type list is `[Proposed]`. | Must | US-2, US-35 | FR-2 |
| FR-6 | Each event type has a color, shown as a small dot on the RSVP page and the dashboard. Icons for the types come in Wave 2. `[Proposed]` | Must | US-35 | FR-5 |
| FR-7 | Only admins can add or delete an event. Organizers can edit the event details. Organizers can edit the budget only with money access. | Must | US-2 | FR-5, FR-10 |
| FR-8 | Before an admin deletes an event, the app shows the number of linked families, replies, expenses and tasks, and asks for confirmation. The app removes the replies for that event. Expenses and tasks move to "whole wedding". | Must | US-2 | FR-5 |
| FR-9 | An admin can invite an organizer by name and email. The invitation goes by WhatsApp message, never by email. The app shows pending invitations. An admin can send a pending invitation again, and can change the email. The app does not send email: it shows "Invite on WhatsApp" and "Copy invite message" with the sign-in link and the email to use. "Send again" shows these buttons again. `[Confirmed]` | Must | US-5 | FR-1, FR-2 |
| FR-10 | Each organizer has a "can see money" switch. The default is off. Only admins can change it. | Must | US-6 | FR-9 |
| FR-11 | An admin can make a parent or sibling an admin. Only bride, groom, parent and sibling can be admin. | Must | US-7 | FR-2, FR-9 |
| FR-12 | Nobody can remove or demote the last admin. After the bride or groom signs in, only they can remove their own admin role. Before that, the admin that made the wedding can edit their entry. | Must | US-7 | FR-11 |
| FR-13 | Before an admin removes an organizer, the admin must give all families and open tasks of that organizer to a different team member. The records of the removed organizer (expenses, payments, history) stay. | Must | US-8 | FR-21, FR-55 |
| FR-14 | When an admin adds an event, the app adds starter tasks for its type. The admin can keep, change or delete them. "Other" has no starter tasks. `[Proposed]` | Should (Dec) | US-36 | FR-5, FR-55 |

### 8.2 Guest list and invitations

| ID | Requirement | Priority | User Story | Dependencies |
|---|---|---|---|---|
| FR-15 | A phone number without "+" is an Indian number (+91). A number with "+" can be from any country. Any real mobile or landline number is valid. Otherwise the app shows "This is not a valid phone number". `[Confirmed]` A family has: family name, contact name, city, primary number, secondary number (optional), side (bride, groom or both), assigned organizer, events on the invitation, "Invitation sent" with date, and notes. | Must | US-10 | FR-2 |
| FR-16 | An admin can import families from an Excel or CSV file. The app gives a template file to download. Columns: family name, contact name, city, primary number, secondary number, side, one column for each event (yes or no), assigned organizer (email or name), notes. Only family name and one event are required. | Must | US-9 | FR-5, FR-15 |
| FR-17 | The import shows a preview before the save. The preview flags: the same number in two families, a number that is already in the list, a missing family name, a family with no event, and a family with no phone number. Save is possible only when there are 0 errors: the admin corrects the file and uploads it again. Warnings (for example, no phone number) do not stop the save. A family that is already in the app (same family name and same number) is skipped, with the note "already in the app". A number that a different family uses is an error. `[Confirmed]` | Must | US-9 | FR-16, FR-18 |
| FR-18 | The app keeps phone numbers in one standard format. It removes the differences of "+91", a "0" at the start, spaces and dashes. A number cannot be in two families of the same wedding. | Must | US-9, US-10 | FR-15 |
| FR-19 | The app flags families with no number. An organizer can add a number in one step. An organizer can mark a number as incorrect. The app shows these numbers in a list to correct. | Must | US-10 | FR-15 |
| FR-20 | An organizer can add and edit a family. This includes the two numbers, making the secondary number the primary, and the events on the invitation. If an organizer removes an event from a family, the app removes the reply for that event. | Must | US-10 | FR-5, FR-15 |
| FR-21 | An admin can assign families to organizers, one at a time or many in one step (for example, by side or from the import file). | Must | US-11 | FR-9, FR-15 |
| FR-22 | Each wedding has one RSVP link. The app shows it with a "Copy" button. The builder selects the link format. | Must | US-12 | FR-2 |
| FR-23 | Each organizer has a "My families" list. The organizer ticks "Invitation sent" for each family. The app records the date and the organizer. | Must | US-13 | FR-21 |
| FR-24 | The admin dashboard shows, for each organizer: families, invitations sent and replies received. | Must | US-14 | FR-23 |
| FR-25 | The app shows the families with no reply. Each organizer sees their own families first. Each family has a "Send reminder" button. It opens a WhatsApp chat (`wa.me`) to the primary number with a short ready message and the RSVP link. The app records the reminder. | Must | US-15 | FR-22, FR-23 |
| FR-26 | The app shows a QR code image of the RSVP link to download. `[Proposed]` | Could | US-12 | FR-22 |

### 8.3 RSVP and guest access

| ID | Requirement | Priority | User Story | Dependencies |
|---|---|---|---|---|
| FR-27 | Screen 1 of the RSVP page shows the banner, the names of the couple, a family search box, four separate boxes for 4 digits, and the help text "Ask the person who sent you the card" (no phone numbers of team members). The "Request access" button comes in Wave 2 (FR-39). | Must | US-16 | FR-4, FR-22 |
| FR-28 | The search shows matches only after 3 letters. Each match shows the family name and the contact name or city. The app never shows the full list of families. | Must | US-16 | FR-15 |
| FR-29 | The guest gets access if the 4 digits are equal to the last 4 digits of the primary or secondary number of the selected family. | Must | US-16 | FR-18, FR-28 |
| FR-30 | The app remembers a device with access. On that device, the link opens Screen 2 directly. Each family can have 12 devices. An organizer can reset the device list of a family. | Must | US-16 | FR-29, FR-39 |
| FR-31 | The app limits incorrect attempts for one family on one device, and the total attempts from one device. After 5 incorrect attempts for one family on one device, the app stops attempts for 15 minutes. One device can make 20 attempts in one hour. `[Confirmed]` (Section 15, Q-1 and Q-2) | Must | US-16 | FR-29 |
| FR-32 | Screen 2 shows: a greeting with the family name, one card for each event on the invitation of the family (name, date, time, venue, map link), the text "Please reply by <last date>", and the privacy note. The event note is for the team only. The app does not show other events. | Must | US-16, US-17 | FR-20, FR-30 |
| FR-33 | For each event, the guest selects "Yes" or "No". For "Yes", the guest types the number of persons. There is no maximum. Nothing is selected at the start, and "Review and submit" stays locked until every event has an answer. For the whole-wedding count, a family counts once, with its largest headcount across its events. `[Confirmed]` | Must | US-17 | FR-32 |
| FR-34 | Before the submit, the app shows a summary and the warning "You cannot change this reply later. Do you want to submit?". After the submit, the reply is read-only, with "Replied by <name>, <date>". | Must | US-17 | FR-33 |
| FR-35 | Each family has one reply for each event. If two persons submit at the same time, the app keeps the first reply. The second person sees the first reply. | Must | US-17 | FR-33 |
| FR-36 | Guests cannot change a submitted reply. The page shows "To change your reply, contact <organizer name>". | Must | US-17 | FR-21, FR-34 |
| FR-37 | Guests cannot submit after the RSVP last date (23:59 India time). The page shows "Replies are closed. Contact <organizer name>." The last dates do not apply to the team. | Must | US-17 | FR-4, FR-33 |
| FR-38 | The WhatsApp link preview shows only the banner, "<Bride> & <Groom>'s Wedding", and the month and year. It never shows family names, events or guest data. | Must | US-12, US-16 | FR-4, FR-22 |
| FR-39 | A guest can push "Request access" and type their name. The request goes to a "Requests" list with the name, family and time. The assigned organizer sees it first. An organizer approves or rejects it in one step. Approval gives access to that device. The app does not keep the number of the person. | Must | US-18, US-19 | FR-21, FR-27 |
| FR-40 | The RSVP page has a button that opens a WhatsApp chat with the assigned organizer. `[Proposed]` | Could | US-18 | FR-21, FR-27 |
| FR-41 | The team can enter or change the reply, headcount and stay data of any family at any time, also after the last dates. The app shows "updated by <name>". | Must | US-20 | FR-33 |
| FR-42 | If the submit fails (for example, no network), the app shows "Not sent. Try again." The app shows a reply as sent only after the server confirms it. `[Proposed]` | Must | US-17 | FR-34 |
| FR-43 | The dashboard shows, for each event and for the full wedding: invited, replied yes (persons), replied no, and no reply. It shows these counts for bride side, groom side, both, and total. | Must | US-21 | FR-33, FR-41 |
| FR-44 | The dashboard shows a "needs attention" list. In Wave 1 it has three rows: families with no reply, families with no phone number, and invitations not sent. Later it adds: open access requests, money due soon (only with money access), and open tasks. Money and task items come when those features are ready. | Must | US-21 | FR-43, FR-39 |

### 8.4 Money

| ID | Requirement | Priority | User Story | Dependencies |
|---|---|---|---|---|
| FR-45 | The team can add an expense with three required fields: amount (total cost), event or "whole wedding", and description. A simple purchase (one payment for the full amount) needs only one step. | Must | US-22 | FR-5 |
| FR-46 | An organizer without money access sees only the expenses that they entered. | Must | US-22 | FR-10, FR-45 |
| FR-47 | An expense can have these optional fields: category, vendor name and phone, due date, and a photo of the bill. The builder gives a start list of categories. The couple can add categories. | Should (Nov) | US-23 | FR-45 |
| FR-48 | An expense has a list of payments. Each payment has: amount, date, paid by, and repaid (yes or no). Paid = the sum of the payments. Due = total cost minus paid. | Should (Nov) | US-23 | FR-45 |
| FR-49 | Each expense has "charged to": bride side, groom side, or split. The default comes from "hosted by" of the event. For "both", the default split is 50/50. A user can set different percentages. | Should (Nov) | US-23, US-24 | FR-5, FR-45 |
| FR-50 | With money access, a user sees: budget, spent and remaining for each event; total spent for the full wedding by category and by side; money due with due dates; and payments that are not repaid. | Should (Nov) | US-24 | FR-48, FR-49 |
| FR-51 | The dashboard shows a budget summary to users with money access. | Should (Nov) | US-24 | FR-50 |
| FR-52 | Each change to an expense or payment records who, when, the old value and the new value. | Should (Nov) | US-25 | FR-45, FR-48 |
| FR-53 | A delete of an expense or payment is a soft delete. An admin can restore it from a "Deleted" list. | Should (Nov) | US-25 | FR-45 |
| FR-54 | Admins see reports for M1 (replies by the RSVP last date), M2 (invitations sent), M3 (replies by guests compared to replies by the team) and M5 (access requests handled in 24 hours). | Should (Nov) | US-26 | FR-23, FR-34, FR-39, FR-41 |

### 8.5 Tasks

| ID | Requirement | Priority | User Story | Dependencies |
|---|---|---|---|---|
| FR-55 | A task has: name, quantity (optional), event or "whole wedding", assigned person (also a pending organizer), due date, status ("to do" or "done"), and a "purchase" flag. | Should (Dec) | US-27 | FR-5, FR-9 |
| FR-56 | An admin can make a task for any team member and move a task to a different person. An organizer can make tasks only for themselves, and can take a task with no owner. Guests cannot have tasks. | Should (Dec) | US-27, US-28 | FR-55 |
| FR-57 | Each person has a "My tasks" list for all events. The dashboard shows open tasks that are due soon. | Should (Dec) | US-28 | FR-55 |
| FR-58 | When a user sets a purchase task to "done", the app asks for the cost. Then it makes the expense and one payment ("paid by" = the user), and closes the task, in one transaction. | Should (Dec) | US-29 | FR-48, FR-55 |
| FR-59 | A WhatsApp button next to a task opens a chat with the assigned person and a short message about the task. `[Proposed]` | Could | US-27 | FR-55 |

### 8.6 Stay

| ID | Requirement | Priority | User Story | Dependencies |
|---|---|---|---|---|
| FR-60 | The RSVP page has a stay section for the family: stay needed (yes or no), number of persons and number of days (nights). The guest submits it one time, before the stay last date. If the section was not ready at the first reply, the guest can fill it one time later. | Should (Dec) | US-30 | FR-4, FR-32 |
| FR-61 | An organizer can type a hotel name and room numbers for a family. The app shows: families that need a stay (persons and days), total persons, and families with and without a room. | Should (Dec) | US-31 | FR-60 |

### 8.7 Gifts and shagun

| ID | Requirement | Priority | User Story | Dependencies |
|---|---|---|---|---|
| FR-62 | Admins and all organizers can record a gift for a family: a cash or shagun amount, or a description of an item, and the event. | Should (Dec) | US-32 | FR-5, FR-15 |
| FR-63 | An organizer without money access sees only the gifts that they recorded. Admins and organizers with money access see and edit all gifts. Gifts have edit history and soft delete. | Should (Dec) | US-32 | FR-10, FR-52, FR-53, FR-62 |

### 8.8 Privacy and data

| ID | Requirement | Priority | User Story | Dependencies |
|---|---|---|---|---|
| FR-64 | The server checks each request. A guest gets only the data of their family and their events. A team member gets only the data of their weddings. Money and all gifts go only to users with money access. | Must | US-6, US-16 | FR-1, FR-10, FR-30 |
| FR-65 | An admin can export to CSV. In Wave 1 the export is three files: families with their phone numbers, replies, and the team. Stay, expenses, tasks and gifts are added when those features are built. `[Confirmed]` | Must | US-33 | FR-15, FR-33 |
| FR-66 | The system makes a copy of the database (`pg_dump`) each day and keeps it on a different host. | Must | US-33 | — |
| FR-67 | 6 months after the wedding date, the app deletes guest phone numbers, stay data, access requests and guest devices. Before this, the app warns the admins and they can download a full CSV export. The app keeps expenses, payments and totals. | Should (Dec) | US-34 | FR-65 |
| FR-68 | Only the bride or the groom can delete all data of a wedding, at any time. Other admins cannot. `[Confirmed]` | Should (Dec) | US-34 | FR-2, FR-12 |

---

**Sections 9 to 17 are in a separate document:** `2026-10-16-shaadidesk-prd-part-2.md`.
