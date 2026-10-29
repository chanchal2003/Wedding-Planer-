# ShaadiDesk PRD: Sections 9 to 17

**Part of:** ShaadiDesk PRD. This document has Sections 9 to 17. Main document (Sections 1 to 8): `2026-10-16-shaadidesk-prd.md`. The label rules, user stories (US-n) and functional requirements (FR-n) are in the main document.

## 9. Non-Functional Requirements

**Rules for this section:**
- "Guest pages" = the RSVP page. "Team pages" = all pages for admins and organizers.
- The builder selects the tools and providers. The requirements in this section must stay.

### 9.1 Performance and capacity

| ID | Requirement | Measure | Label |
|---|---|---|---|
| NFR-1 | A page opens fast, also after a long time with no use. Hosting that stops and starts again in 30 to 60 seconds is not permitted. | Approximately 1 second on a phone on a mobile network (M6) | `[Confirmed]` |
| NFR-2 | The frontend is static files. The API runs on a service that does not stop, or that starts in approximately 1 second. A "keep-alive" ping is the last option. | Builder records the selected providers and their start time | `[Confirmed]` |
| NFR-3 | The database wakes in approximately 1 second. Do not use a plan that pauses for days. | Approximately 1 second | `[Confirmed]` |
| NFR-4 | Each wedding supports approximately 500 families, 5 events and a small team. The app supports many weddings. | 500 families with no slow pages | `[Confirmed]` |
| NFR-5 | The dashboard and lists stay fast with 500 families. | Approximately 1 second for a list of 500 families | `[Proposed]` |

### 9.2 Cost

| ID | Requirement | Measure | Label |
|---|---|---|---|
| NFR-6 | Hosting, database and photo storage use free tiers only. The builder examines the current rules of each free plan before the selection. | ₹0 each month until 6 months after the wedding (M7) | `[Confirmed]` |

### 9.3 Security and access

| ID | Requirement | Measure | Label |
|---|---|---|---|
| NFR-7 | The server applies all access rules (FR-64). It is not sufficient to hide data in the user interface. | A test for each role shows that the server does not send data outside the rules | `[Confirmed]` |
| NFR-8 | All pages and API calls use HTTPS. | No HTTP pages | `[Proposed]` |
| NFR-9 | Guest devices keep access with a long-life cookie or session. The cookie is only for one wedding and one family. | — | `[Confirmed]` |
| NFR-10 | Attempt limits stop guessing of the 4 digits (FR-31). | Builder selects the numbers (Section 15) | `[Confirmed]` |
| NFR-11 | The owner accepts these risks: anybody with the link can see family names that match 3 letters; a person who knows 4 digits can reply for a family. | — | `[Confirmed]` |

### 9.4 Privacy

| ID | Requirement | Measure | Label |
|---|---|---|---|
| NFR-12 | Guest phone numbers, money and gifts are sensitive data. The app keeps only the data that is necessary. The India DPDP Act applies. | — | `[Confirmed]` |
| NFR-13 | The RSVP page shows the privacy note to guests. | Note is on Screen 2 | `[Confirmed]` |
| NFR-14 | The WhatsApp link preview never shows guest data (FR-38). | — | `[Confirmed]` |
| NFR-15 | Guest data is deleted 6 months after the wedding (FR-67). | — | `[Confirmed]` |

### 9.5 Reliability and data safety

| ID | Requirement | Measure | Label |
|---|---|---|---|
| NFR-16 | No reply, expense, payment or gift is lost. | 0 data loss incidents (M8) | `[Confirmed]` |
| NFR-17 | Money is kept in an exact number type. Floating-point numbers are not permitted. | — | `[Confirmed]` |
| NFR-18 | Changes that have more than one step (for example, a purchase task that makes an expense) use one transaction. If one step fails, no step stays. | — | `[Confirmed]` |
| NFR-19 | A daily database copy is kept on a different host (FR-66). | 1 copy each day | `[Confirmed]` |
| NFR-20 | The owner restores a database copy one time before the invitations go out, to prove that the copy operates. | 1 successful restore test before December | `[Proposed]` |

### 9.6 Accessibility (simple version)

The owner selected a simple version, not the full WCAG 2.2 AA standard. `[Confirmed]` Many guests are older relatives.

| ID | Requirement | Measure | Label |
|---|---|---|---|
| NFR-21 | Large text. | Body text at least 16 px on phones | Rule `[Confirmed]`, number `[Proposed]` |
| NFR-22 | Strong contrast between text and background. | Text is easy to read in daylight on a phone | `[Confirmed]` |
| NFR-23 | Big tap targets for buttons and fields. | At least 44 × 44 px | Rule `[Confirmed]`, number `[Proposed]` |
| NFR-24 | Clear error messages in simple words. Each message tells the person what to do next. For example: "The number does not match. Check the last 4 digits and try again." | — | `[Confirmed]` |

### 9.7 Devices and browsers

| ID | Requirement | Measure | Label |
|---|---|---|---|
| NFR-25 | Guest pages operate on Android Chrome, iPhone Safari and the WhatsApp in-app browser. | Versions from the last 2 years | `[Confirmed]` |
| NFR-26 | Team pages operate on the same phone browsers, and on desktop Chrome and Edge. | Versions from the last 2 years | `[Confirmed]` |
| NFR-27 | All pages are for phones first. Team pages also operate on phones. | — | `[Confirmed]` |

### 9.8 Usability and localization

| ID | Requirement | Measure | Label |
|---|---|---|---|
| NFR-28 | Guests do not make an account and do not sign in. | — | `[Confirmed]` |
| NFR-29 | A guest replies in a few taps. | 3 to 5 test persons reply on their own phones with no help, with dummy data | Rule `[Confirmed]`, measure `[Proposed]` |
| NFR-30 | The app is in English only. | — | `[Confirmed]` |
| NFR-31 | The app uses India time for all dates and last dates. | — | `[Confirmed]` |
| NFR-32 | Money uses ₹ and the Indian number format, for example ₹1,50,000. | — | `[Proposed]` |

### 9.9 Operation and maintenance

| ID | Requirement | Measure | Label |
|---|---|---|---|
| NFR-33 | The owner builds and maintains the app with Claude Code. The code must be simple to read and change. | — | `[Confirmed]` |
| NFR-34 | The app records server errors in a log that the owner can read. | Builder selects a free tool | `[Proposed]` |

## 10. UX and UI Flows and States

This section gives the screens, the flows between them and the states of each screen. It does not give the visual design. The builder selects the visual design, and the design will get more work later. `[Confirmed]`

### 10.1 Design principles

| ID | Principle | Label |
|---|---|---|
| UX-1 | Phones first. All guest pages and team pages operate on a phone. | `[Confirmed]` |
| UX-2 | Simple words. Each error message tells the person what to do next (NFR-24). | `[Confirmed]` |
| UX-3 | One main action on each screen. For example, on Screen 2 of the RSVP page the main action is "Submit". | `[Proposed]` |
| UX-4 | Show status with words and color. Do not use only color. For example: a green label "Sent", not only a green dot. | `[Proposed]` |
| UX-5 | Ask for confirmation before an action that cannot be undone (Section 10.5). | `[Confirmed]` |
| UX-6 | Keep data that the person typed if a save fails. The person must not type it again. | `[Proposed]` |

### 10.2 Screens

**Guest screens (no sign-in)**

| Screen | Purpose | FR |
|---|---|---|
| RSVP Screen 1: Find your family | Search, 4 digits, help text (request access in Wave 2) | FR-27 to FR-31, FR-39 |
| RSVP Screen 2: Your invitation | Event cards, reply, stay, privacy note | FR-32 to FR-37, FR-60 |

**Team screens (Google sign-in)**

| Screen | Purpose | Who | FR |
|---|---|---|---|
| Sign in | Google sign-in | Team | FR-1 |
| My weddings | List of the weddings of the user. "Make a wedding" button. | Team | FR-2, FR-3 |
| Wedding dashboard | Events, guest counts, organizer progress, "needs attention", tasks due soon, budget summary (money access) | Team | FR-24, FR-43, FR-44, FR-51, FR-57 |
| Wedding settings | Banner, greeting, colors, last dates, RSVP link with "Copy". "Delete wedding" for real weddings comes in a later release (test weddings: Wave 1) | Admin | FR-4, FR-22, FR-68 |
| Events and event page | Event list with type, icon and "hosted by". Event page with details, guest counts, tasks and money (money access). | Team | FR-5 to FR-8 |
| Team | Admins, organizers, pending invitations, money switch, remove organizer | Admin | FR-9 to FR-13 |
| Families | Full guest list with search and filters (side, event, organizer, no reply, no number) | Team | FR-15, FR-19, FR-20 |
| Family page | Family data, events, reply, stay, gift, history of changes | Team | FR-20, FR-41, FR-61, FR-62 |
| Import | Template download, file upload, preview with flags, save | Admin | FR-16, FR-17 |
| My families | Families of the organizer, "Invitation sent" tick, "Send reminder" | Organizer | FR-23, FR-25 |
| Requests | Access requests, approve or reject | Team | FR-39 |
| Expenses | Expense list, fast expense form, expense page with payments and history, "Deleted" list | Team (organizers without money access see only their own) | FR-45 to FR-53 |
| Money views | Budget by event, totals by category and side, money due, repayments | Money access | FR-50 |
| Reports | M1, M2, M3, M5 | Admin | FR-54 |
| Tasks | "My tasks", all tasks, tasks with no owner | Team | FR-55 to FR-59 |
| Stay | Families that need a stay, room assignment | Team | FR-61 |
| Gifts | Gift list | Team (organizers without money access see only their own) | FR-62, FR-63 |
| Export | CSV export | Admin | FR-65 |

**Navigation on phones** `[Proposed]`: a bar at the bottom with 5 items: Dashboard, Families, Money, Tasks, More. For an organizer without money access, "Money" shows only "My expenses". "More" has the other screens.

### 10.3 Main flows

The journeys J1 to J7 (Section 7.2) give the steps. This section gives the RSVP flow in detail, because it is the most important flow for guests.

**RSVP flow (guest)**

```
Guest opens the RSVP link
│
├─ Device has access? ──Yes──► Screen 2
│
└─ No ──► Screen 1
          │
          Types 3 or more letters ──► Matches (family name + contact name or city)
          │
          ├─ Family not in the list ──► "No family found" + "Ask the person who sent you the card"
          │
          Selects family ──► Types last 4 digits
          │
          ├─ Match ──► device gets access ──► Screen 2
          ├─ No match ──► error + "Check the last 4 digits and try again"
          └─ Too many attempts ──► locked state

Screen 2
│
├─ Already replied ──► read-only reply
├─ After the RSVP last date and no reply ──► closed state
│
└─ Not replied ──► Yes/No and persons for each event ──► "Submit"
                   │
                   Summary + warning ──► "Go back" or "Yes, submit"
                   │
                   ├─ Server confirms ──► read-only reply
                   ├─ A family member replied first ──► shows the first reply
                   └─ Network fails ──► "Not sent. Try again."
```

**Request access flow**

```
Guest pushes "Request access" ──► types name ──► "Request sent" state
│
Organizer opens Requests ──► Approve or Reject
│
├─ Approve ──► next time the guest opens the link, the device opens Screen 2
└─ Reject ──► the device stays on Screen 1
```

### 10.4 States of each screen

**RSVP Screen 1**

| State | What the guest sees |
|---|---|
| Start | Banner, names of the couple, search box: "Type your family name". |
| Fewer than 3 letters | "Type at least 3 letters." |
| No matches | "No family found. Check the spelling, or ask the person who sent you the card." `[Proposed]` |
| Incorrect digits | "The number does not match. Check the last 4 digits and try again." |
| Too many attempts | "Too many tries. Please wait 15 minutes, then try again, or ask the person who sent you the card." `[Confirmed]` |
| Device limit | "Too many devices. Ask the person who sent you the card." |
| Request sent (Wave 2) | "Your request is sent. <organizer name> will approve it." `[Proposed]` |
| Request rejected (Wave 2) | "Your request was not approved. Contact <organizer name>." `[Proposed]` |
| Loading | "Loading…" text. The page opens in approximately 1 second (NFR-1). |

**RSVP Screen 2**

| State | What the guest sees |
|---|---|
| Not replied | Event cards with Yes/No and persons, stay section, "Submit". |
| Confirm | Summary of the reply and the warning, with "Yes, submit" and "Go back". |
| Sending | "Sending…". The "Submit" button cannot be pushed two times. `[Proposed]` |
| Replied | Read-only reply with "Replied by <name>, <date>" and "To change your reply, contact <organizer name>". |
| Updated by the team | Read-only reply with "Updated by <organizer name>". |
| Closed | "Replies are closed. Contact <organizer name>." |
| Stay not ready | Page without the stay section. |
| Stay open, events replied | Read-only event replies and an open stay section with its own "Submit". |
| Stay closed | Stay section read-only, or "Stay requests are closed. Contact <organizer name>." `[Proposed]` |
| Network error | "Not sent. Try again." The typed reply stays on the page. `[Proposed]` |

**Team screens**

| Screen | Empty state | Other states |
|---|---|---|
| My weddings | "You have no weddings. Make a wedding." | Pending invitation: "<name> added you to <wedding>." |
| Wedding dashboard | "Add your first event." | Test wedding: "TEST" badge on team pages and "TEST" ribbon on guest pages. |
| Families | "Import your guest list." with "Download template". | Flags: no number, incorrect number, duplicate. |
| Import | — | Preview with the errors of each row and "Download error list". The admin corrects the file and uploads it again. "Save" is available only with 0 errors. `[Confirmed]` |
| My families | "No families are assigned to you. Ask an admin." | All sent: "All invitations sent." |
| Requests | "No requests." | — |
| Expenses | "No expenses. Add the first expense." | Organizer without money access: only their own expenses. |
| Money pages without access | — | Not in the menu. If opened by a direct link: "You do not have access to this page." The server does not send the data. |
| Tasks | "No tasks." | Tasks with no owner, with "I'll do it". |
| Any screen | — | Save failed: "Not saved. Try again." The typed data stays (UX-6). |

### 10.5 Confirmations

| Action | Confirmation text (example) | FR |
|---|---|---|
| Guest submits the reply | "You cannot change this reply later. Do you want to submit?" | FR-34 |
| Admin deletes an event | "This event has 120 families, 85 replies, 6 expenses and 4 tasks. Replies will be deleted. Expenses and tasks move to 'whole wedding'. Delete?" | FR-8 |
| Admin removes an organizer | "Give the 120 families and 3 open tasks of Ankit to a different person first." | FR-13 |
| Organizer removes an event from a family | No confirmation. The organizer does this on purpose. | FR-20 |
| Admin saves an import | "Save 500 families?" `[Proposed]` | FR-17 |
| Delete an expense, payment or gift | "Delete? An admin can restore it." | FR-53, FR-63 |
| Bride or groom deletes the wedding | "All data of this wedding will be deleted. Type the wedding name to confirm." `[Proposed]` | FR-68 |

### 10.6 Ready messages

| Message | Text (example) | Label |
|---|---|---|
| Reminder to a family (FR-25) | "Namaste <family name>, please reply for the wedding of <Bride> & <Groom> before <RSVP last date>: <RSVP link>" | `[Proposed]` |
| Task message (FR-59) | "Hi <name>, new task: <task> by <due date>" | `[Confirmed]` |

## 11. Acceptance Criteria

**Rules for this section:**
- Each Must and Should requirement has acceptance criteria. Could requirements (FR-26, FR-40, FR-59) do not.
- The ID is AC-[FR number].[n]. For example, AC-29.1 is the first criterion of FR-29.
- The examples use the people from Section 7: Priya (bride, admin), Dad (admin), Ankit (organizer, no money access), Rohan (organizer, money access), Meena Aunty (guest, Sharma family).
- A criterion has the label of its FR, unless it has a different label.

### 11.1 Weddings, events and team

| ID | Given | When | Then |
|---|---|---|---|
| AC-1.1 | A person is not signed in | They open a team page | The app shows the Google sign-in page |
| AC-1.2 | A guest opens the RSVP link | The page opens | The app does not ask for a sign-in |
| AC-2.1 | Priya is signed in | She makes a wedding and selects "Bride" | The wedding is made and Priya is its admin |
| AC-2.2 | Priya makes a real wedding | She types a wedding date in the past, or leaves a couple name empty | The app does not save it and shows the error |
| AC-3.1 | Priya makes a test wedding | She opens any page of it | The page shows the "TEST" label |
| AC-3.2 | A test wedding exists | An admin pushes "Delete test wedding" and confirms | All data of the test wedding is deleted |
| AC-4.1 | Priya edits the wedding settings | She sets the stay last date later than the RSVP last date | The app does not save it and shows the error |
| AC-5.1 | Priya adds an event | She selects "Haldi" and fills the date, venue and "hosted by" | The event is saved with the type "Haldi" |
| AC-5.2 | Priya adds an event | She selects "Other" and types "Mata ki Jagran" | The event is saved with the name "Mata ki Jagran" |
| AC-6.1 | The wedding has a Haldi event | Meena opens Screen 2 | The Haldi card shows the Haldi icon and color `[Proposed]` |
| AC-7.1 | Ankit is an organizer | He opens an event | He can edit the time, venue and note. He cannot see the "Delete" button |
| AC-7.2 | Ankit has no money access | He sends a request to change the budget | The server refuses the request |
| AC-8.1 | The Sangeet has 120 families, 85 replies, 6 expenses and 4 tasks | Priya deletes the Sangeet and confirms | The 85 replies are deleted. The 6 expenses and 4 tasks show "whole wedding" |
| AC-9.1 | Priya invites ankit@gmail.com | Ankit did not sign in yet | The team list shows Ankit as "pending" with "Send again" |
| AC-9.2 | Ankit is pending | He signs in with ankit@gmail.com | He sees the wedding as an organizer |
| AC-10.1 | Priya adds a new organizer | The organizer is saved | "Can see money" is off |
| AC-11.1 | Priya adds a friend | She tries to make the friend an admin | The app does not permit it. A friend can only be an organizer |
| AC-12.1 | Dad is the only admin | Dad tries to remove his own admin role | The app does not permit it |
| AC-12.2 | Priya (bride) signed in | Dad tries to remove Priya's admin role | The app does not permit it |
| AC-13.1 | Ankit has 120 families and 3 open tasks | Priya pushes "Remove" for Ankit | The app asks her to give the families and tasks to a different person. It removes Ankit only after that |
| AC-13.2 | Ankit is removed | Priya opens an expense that Ankit entered | The expense and its history still show Ankit |
| AC-14.1 | Tasks are available | Priya adds a Haldi event | The app adds the starter tasks for Haldi. Priya can change or delete each one `[Proposed]` |

### 11.2 Guest list and invitations

| ID | Given | When | Then |
|---|---|---|---|
| AC-15.1 | Rohan adds a family | He fills only the family name, primary number, side and one event | The family is saved. Contact name, city, secondary number and notes are optional |
| AC-16.1 | Priya opens Import | She pushes "Download template" | She gets a file with all columns and one column for each event |
| AC-16.2 | The file has a row with only a family name and "yes" for one event | Priya imports the file | The row is accepted |
| AC-17.1 | The file has the same number in two rows | Priya imports the file | The preview flags both rows. Nothing is saved before Priya confirms |
| AC-17.2 | The file has a row with no family name, or with no event | Priya imports the file | The preview shows the error on that row |
| AC-17.3 | The file has a family with no number | Priya imports the file | The preview flags the family. The family can be saved |
| AC-17.4 | The preview shows 5 errors | Priya tries to save | "Save" is not available. She can download the error list and upload a corrected file |
| AC-17.5 | The app has the Sharma family with 98765 11111 | Priya imports a file with "Sharma family, 98765 11111" and 50 new families | The preview shows "50 new families, 1 already in the app". The save adds only the 50 new families. The Sharma family does not change |
| AC-17.6 | The app has the Sharma family with 98765 11111 | Priya imports a file with "Gupta family, 98765 11111" | The preview shows an error on that row: the number is used by the Sharma family |
| AC-18.1 | A number is typed as "+91 98765-11111" | The app saves it | It is kept as the same number as "09876511111" |
| AC-18.2 | The Sharma family has 98765 11111 | An organizer adds the same number to a different family | The app does not save it and shows which family has the number |
| AC-19.1 | Rohan marks a number as incorrect | He opens the list of numbers to correct | The family is in the list |
| AC-20.1 | The Sharma family replied "Yes" for the Haldi | Rohan removes the Haldi from the Sharma invitation | The Haldi reply of the Sharma family is deleted |
| AC-21.1 | 120 families are on the groom side | Priya assigns "all groom side" to Ankit | Ankit has the 120 families in "My families" |
| AC-22.1 | Priya opens the settings | She pushes "Copy" | The RSVP link is copied |
| AC-23.1 | Ankit sent the card to the Sharma family | He ticks "Invitation sent" | The family shows "sent", the date and "Ankit" |
| AC-24.1 | Ankit has 120 families, 80 sent, 35 replied | Priya opens the dashboard | She sees "Ankit: 120 families, 80 sent, 35 replied" |
| AC-25.1 | The Verma family did not reply | Ankit pushes "Send reminder" | WhatsApp opens a chat to the primary number with the ready message and the RSVP link. The app records the reminder |

### 11.3 RSVP and guest access

| ID | Given | When | Then |
|---|---|---|---|
| AC-27.1 | The device has no access | Meena opens the RSVP link | She sees Screen 1 with the banner, couple names, search box, four digit boxes and the help text "Ask the person who sent you the card" |
| AC-28.1 | Meena is on Screen 1 | She types "Sh" | The app shows no matches and "Type at least 3 letters." |
| AC-28.2 | Meena is on Screen 1 | She types "Sha" | The app shows "Sharma family (Meena, Jaipur)" and other matches. It does not show the full list |
| AC-29.1 | The Sharma family has the primary number 98765 11111 and the secondary number 98765 22222 | A guest types "1111" or "2222" | The guest gets access to the Sharma invitation |
| AC-29.2 | The Sharma family is selected | A guest types "5555" | The app shows "The number does not match. Check the last 4 digits and try again." |
| AC-30.1 | Meena got access on her phone | She opens the link again on the same phone | Screen 2 opens directly |
| AC-30.2 | The Sharma family has the maximum number of devices | A new device types the correct digits | The app shows "Too many devices. Ask the person who sent you the card." |
| AC-30.3 | The Sharma family has the maximum number of devices | Rohan resets the device list | A new device can get access |
| AC-31.1 | A device typed incorrect digits for the Sharma family up to the limit | It types digits again for the Sharma family | The app does not check them and shows "Too many tries. Please wait 15 minutes, then try again, or ask the person who sent you the card." |
| AC-31.2 | A device reached the total attempt limit | It tries a different family | The app does not check the digits |
| AC-32.1 | The Sharma family is invited to Haldi and Wedding only | Meena opens Screen 2 | She sees 2 event cards: Haldi and Wedding. She does not see other events. She sees the privacy note |
| AC-33.1 | Meena is on Screen 2 | She selects "Yes" for the Wedding and types 12 persons | The app accepts 12. There is no maximum |
| AC-34.1 | Meena filled her reply | She pushes "Submit" | The app shows the summary and the warning, with "Yes, submit" and "Go back" |
| AC-34.2 | The confirmation shows | Meena pushes "Yes, submit" and the server saves it | The page shows the reply as read-only, with "Replied by Meena, <date>" |
| AC-35.1 | Meena and Rohan (her son) open Screen 2 at the same time | Both submit | The server keeps the first reply. The second person sees the first reply |
| AC-36.1 | The Sharma family replied | Meena opens the link again | The reply is read-only, with "To change your reply, contact <organizer name>" |
| AC-36.2 | The Sharma family replied | A request to change the reply comes from a guest device | The server refuses the request |
| AC-37.1 | The RSVP last date was 31 Dec and it is 1 Jan, 00:01 India time | The Verma family opens Screen 2 with no reply | The page shows "Replies are closed. Contact <organizer name>." |
| AC-37.2 | It is after the RSVP last date | Rohan enters a reply for the Verma family | The reply is saved |
| AC-38.1 | Priya sends the RSVP link on WhatsApp | WhatsApp shows the preview | The preview shows only the banner, "Priya & Rahul's Wedding" and "January 2027" |
| AC-39.1 | Meena's daughter does not know the numbers | She pushes "Request access", types "Priya Sharma" and selects the Sharma family | The request shows in the Requests list with the name, family and time. Rohan (assigned organizer) sees it first |
| AC-39.2 | The request is in the list | Rohan pushes "Approve" | The next time her device opens the link, Screen 2 of the Sharma family opens |
| AC-39.3 | The request is in the list | Rohan pushes "Reject" | Her device stays on Screen 1 |
| AC-41.1 | Uncle Verma calls Rohan | Rohan enters "Wedding: yes, 5 persons" | The reply is saved and shows "Updated by Rohan" |
| AC-42.1 | Meena pushes "Yes, submit" and the network fails | The server does not confirm | The page shows "Not sent. Try again." Her reply stays on the page. The page does not show "Replied" `[Proposed]` |
| AC-43.1 | 300 families are invited to the Wedding. 200 replied yes (650 persons), 40 replied no | Priya opens the dashboard | She sees for the Wedding: invited 300, yes 650 persons, no 40, no reply 60. She also sees these counts for each side |
| AC-44.1 | There are 2 open access requests and 60 families with no reply | Priya opens the dashboard | In Wave 1, "Needs attention" shows the 60 families with no reply (the access request row comes in Wave 2) |

### 11.4 Money

| ID | Given | When | Then |
|---|---|---|---|
| AC-45.1 | Ankit opens the expense form | He types ₹5,000, Haldi, "Flowers" and saves | The expense is saved |
| AC-45.2 | Ankit opens the expense form | He leaves the amount, event or description empty | The app does not save it and shows which field is missing |
| AC-46.1 | Ankit has no money access | He opens Expenses | He sees only the expenses that he entered |
| AC-46.2 | Ankit has no money access | He sends a request for all expenses | The server sends only his expenses |
| AC-47.1 | Dad saved an expense with the three required fields | Later, he adds the category "Decor", the vendor and a bill photo | The expense shows these fields |
| AC-48.1 | The decoration expense is ₹200 | Uncle Verma adds a payment of ₹100 | Paid is ₹100. Due is ₹100 |
| AC-48.2 | Uncle Verma paid ₹100 | Uncle Sharma adds a payment of ₹100 | Paid is ₹200. Due is ₹0. The expense shows "settled" `[Proposed]` |
| AC-48.3 | Uncle Ramesh paid ₹50,000 with "Repaid: No" | Rohan opens the repayments view | He sees "Uncle Ramesh paid ₹50k, not repaid" |
| AC-49.1 | The Sangeet is "hosted by: both" | Dad adds a Sangeet expense of ₹1,50,000 | "Charged to" is split 50/50: bride side ₹75,000, groom side ₹75,000 |
| AC-49.2 | The expense is split 50/50 | Dad changes it to 60/40 | Bride side ₹90,000, groom side ₹60,000 |
| AC-50.1 | The Sangeet has budget ₹4L and expenses of ₹2.8L | Rohan opens money views | He sees budget ₹4L, spent ₹2.8L, remaining ₹1.2L |
| AC-50.2 | ₹50,000 is due to Sharma Decorators by 14 Jan | Rohan opens money due | He sees "₹50k due to Sharma Decorators by 14 Jan" |
| AC-51.1 | Ankit has no money access | He opens the dashboard | He does not see the budget summary |
| AC-52.1 | The caterer amount is ₹2L | Rohan changes it to ₹2.4L | The history shows "₹2L → ₹2.4L by Rohan, <date>" |
| AC-53.1 | Rohan deletes an expense | Priya opens the "Deleted" list and pushes "Restore" | The expense is back in all lists and totals |
| AC-53.2 | An expense is deleted | Rohan opens the totals | The deleted expense is not in the totals |
| AC-54.1 | 450 of 500 families replied by the RSVP last date | Priya opens Reports | M1 shows 90% |
| AC-54.2 | 300 replies came from guests and 150 from the team | Priya opens Reports | M3 shows 67% from guests |

### 11.5 Tasks

| ID | Given | When | Then |
|---|---|---|---|
| AC-55.1 | Priya makes a task | She leaves the event empty | The task shows "whole wedding" |
| AC-56.1 | Ankit is an organizer | He makes a task for Rohan | The app does not permit it |
| AC-56.2 | "Arrange DJ" has no owner | Rohan pushes "I'll do it" | The task is in Rohan's "My tasks" |
| AC-56.3 | "Book pandit" is assigned to Rohan | Ankit tries to move it to himself | The app does not permit it. Only an admin can move it |
| AC-57.1 | Ankit has 1 task | He opens "My tasks" | He sees only his task |
| AC-58.1 | "Buy marigold garlands" is a purchase task of Ankit | He pushes "Done" and types ₹4,000 | The app makes the expense ₹4,000, Haldi, paid by Ankit, and closes the task |
| AC-58.2 | Ankit completes the purchase task | The expense save fails | The task stays "to do" and no expense or payment is saved |

### 11.6 Stay

| ID | Given | When | Then |
|---|---|---|---|
| AC-60.1 | The stay section is open | The Sharma family submits "Stay: yes, 4 persons, 3 days" | The stay is saved and becomes read-only for guests |
| AC-60.2 | The stay last date passed | A family with no stay reply opens Screen 2 | The family cannot submit the stay section |
| AC-60.3 | The family replied to events before the stay section was ready | The family opens Screen 2 when the stay section is ready | The family can submit the stay section one time |
| AC-61.1 | The Sharma family needs a stay | Rohan types "Hotel Raj, rooms 101 and 102" | The family moves from "needs a stay" to "room assigned" |

### 11.7 Gifts

| ID | Given | When | Then |
|---|---|---|---|
| AC-62.1 | Ankit has no money access | He records "₹5,100 shagun, Wedding" for the Verma family | The gift is saved |
| AC-63.1 | Ankit recorded 3 gifts and Rohan recorded 10 | Ankit opens Gifts | He sees only his 3 gifts |
| AC-63.2 | Rohan has money access | He opens Gifts | He sees all 13 gifts |

### 11.8 Privacy and data

| ID | Given | When | Then |
|---|---|---|---|
| AC-64.1 | Meena has access to the Sharma family | Her device sends a request for the Verma family data | The server refuses the request |
| AC-64.2 | Rohan is an organizer in wedding A only | He sends a request for wedding B | The server refuses the request |
| AC-65.1 | Priya opens Export | She pushes "Export CSV" | She gets three CSV files: families with phone numbers, replies, and the team |
| AC-66.1 | A day passed | The owner checks the backup host | There is a new database copy for that day |
| AC-67.1 | The wedding date is 15 Jan 2027 | It is approximately 15 Jul 2027 | The app deleted the phone numbers, stay data, access requests and guest devices. Expenses and totals stay |
| AC-67.2 | The automatic delete is near | Priya opens the app | She sees a warning and a "Download full export" button |
| AC-68.1 | Dad is an admin, not the bride or groom | He opens the wedding settings | He does not see "Delete wedding" |
| AC-68.2 | Priya (bride) pushes "Delete wedding" | She types the wedding name and confirms | All data of the wedding is deleted |

## 12. Data and Integrations

This section is high level. The design document (Section 8.1) gives the tables and database rules. The builder decides the columns, names, indexes and migrations. `[Confirmed]`

### 12.1 Main data

| Data | One record is | Main links | Sensitive | FR |
|---|---|---|---|---|
| Users | One Google account | — | Email | FR-1 |
| Weddings | One wedding (also test weddings) | — | — | FR-2 to FR-4 |
| Team members | One person in the team of one wedding: role, relation, money access, pending email | Users, weddings | Email | FR-9 to FR-13 |
| Events | One event: type, date, venue, budget, "hosted by" | Weddings | Budget | FR-5 to FR-8 |
| Families | One guest family: numbers, side, assigned organizer, "Invitation sent" | Weddings, team members | **Phone numbers** | FR-15 to FR-21 |
| Family events | One event on the invitation of one family | Families, events | — | FR-20 |
| Replies | The reply of one family for one event: yes or no, persons, replied by, date | Family events | — | FR-33 to FR-41 |
| Stays | The stay of one family: persons, days, hotel, rooms | Families | Yes | FR-60, FR-61 |
| Guest devices | One phone or browser with access to one family | Families | Yes | FR-30 |
| Access requests | One "Request access": name, status | Families | Name | FR-39 |
| Expenses | One expense: total cost, event or whole wedding, category, vendor, split | Weddings, events | **Money** | FR-45 to FR-53 |
| Payments | One payment: amount, date, paid by, repaid | Expenses | **Money** | FR-48 |
| Tasks | One task, with a link to an expense for purchase tasks | Weddings, events, team members, expenses | — | FR-55 to FR-58 |
| Gifts | One gift of one family | Families, events | **Money** | FR-62, FR-63 |
| History | One change to an expense, payment or gift: who, when, old value, new value | All money and gift records | Money | FR-52 |

**Rules that must stay** `[Confirmed]`:
- Each record belongs to one wedding. Each query filters by wedding.
- One reply for each family and event. The first submit stays.
- A family can reply only to events on its invitation.
- If an event is removed from a family, the reply for it is removed.
- A phone number is in only one family of a wedding. Numbers are kept in one standard format.
- One person has only one role in each wedding.
- Money uses an exact number type.
- A purchase task, its expense and its payment are saved in one transaction.
- Expenses, payments and gifts use soft delete. Each change adds a history record in the same transaction.

### 12.2 Data in and data out

| Flow | Direction | Format | FR |
|---|---|---|---|
| Guest list import | In | Excel or CSV, from the template. The builder selects the formats. | FR-16, FR-17 |
| Banner photo | In | Image upload | FR-4 |
| Bill or receipt photo | In | Image upload | FR-47 |
| CSV export | Out | Wave 1: three CSV files (families with phone numbers, replies, team). Later: stay, expenses, tasks and gifts | FR-65 |
| Database copy | Out | `pg_dump` file each day, on a different host | FR-66 |
| QR code of the RSVP link | Out | Image download `[Proposed]` | FR-26 |

### 12.3 Integrations

All integrations are free. The app does not use paid services. `[Confirmed]`

| Integration | Use | How | Label |
|---|---|---|---|
| Google sign-in | Sign-in for admins and organizers | Google OAuth | `[Confirmed]` |
| WhatsApp links (`wa.me`) | "Send reminder", the WhatsApp help button and the task button open a chat with a ready message. The person pushes "send". | A link only. No WhatsApp API. No automatic messages. | `[Confirmed]` |
| WhatsApp link preview | The preview card of the RSVP link | Open Graph tags on the RSVP page | `[Confirmed]` |
| Maps | The map link of each venue | The team pastes a link (for example, a Google Maps link). No map API. | `[Proposed]` |
| PostgreSQL host | The database | Neon free tier for the deployed app. It wakes in approximately 1 second. Development uses normal PostgreSQL on the laptop. | `[Confirmed]` |
| App hosting | Frontend and server code | Vercel free plan, at a free `vercel.app` address | `[Confirmed]` |
| Photo storage | Banner and bill photos | Cloudflare R2 (S3 API), free tier | `[Confirmed]` |
| Backup host | The daily database copy | Cloudflare R2. A GitHub Actions job makes the copy each night. | `[Confirmed]` |

**Not integrated in this release** `[Confirmed]`: WhatsApp Business API, SMS or OTP, email messages, payment gateways, photo gallery, live stream.

### 12.4 Data retention

| Data | Kept until | FR |
|---|---|---|
| Phone numbers, stay data, access requests, guest devices | 6 months after the wedding date. Then the app deletes them automatically, after a warning and an export. | FR-67 |
| Families (names), replies, expenses, payments, gifts, tasks, history | Until the bride or groom deletes the wedding | FR-68 |
| Test wedding | Until an admin deletes it | FR-3 |
| Daily database copies | The last 30 days of copies. Older copies are deleted. Thus deleted guest data leaves the copies approximately 30 days after FR-67. `[Proposed]` (Q-5) | FR-66 |

## 13. Risks

Likelihood and impact are the estimate of the writer. `[Assumption]` The owner of all risks is Chanchal, unless the table gives a different owner.

**Practice project** (2026-10-24): R-2, R-7, R-8, R-9, R-10 and R-13 need real guests or a real team. They apply only when a real wedding uses the app. R-1 now means: Wave 1 takes longer than planned. The other risks apply as written.

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-1 | The Must items are not ready by 10 Nov. One person builds the app in approximately 3.5 weeks. | High | High | Build only the Must items first (Section 6). Do Could items only if time permits. If necessary, move Should items to December. The invitations go out only in December. |
| R-2 | Older relatives cannot find their family or reply. | Medium | High | Simple accessibility (NFR-21 to NFR-24). 3 to 5 relatives test before launch. Organizers enter replies from phone calls (FR-41). |
| R-3 | A free tier changes its rules, sleeps, or reaches a limit during December. | Medium | High | Examine the plan rules before the selection (NFR-6). Keep-alive ping as the last option. Daily copy and CSV export (FR-65, FR-66) to move to a different provider. |
| R-4 | Data is lost (replies or money). | Low | High | Daily copy on a different host. One restore test before December (NFR-20). Transactions and soft delete. |
| R-5 | A person who knows 4 digits replies for a different family. | Low | Medium | Attempt limits (FR-31). Organizers can change any reply (FR-41). The owner accepts this risk (NFR-11). |
| R-6 | Anybody with the link sees family names that match 3 letters. | Medium | Low | Matches only after 3 letters. No full list. The owner accepts this risk (NFR-11). |
| R-7 | The guest list in Excel has errors: missing numbers, duplicates, incorrect events. | High | Medium | Template, preview and flags (FR-16, FR-17). List of families with no number or an incorrect number (FR-19). |
| R-8 | Organizers forget to tick "Invitation sent", or do not use the app. | Medium | Medium | Progress for each organizer (FR-24). M2 report. Admins follow up. |
| R-9 | Access requests wait too long. Guests stop. | Medium | Medium | The assigned organizer sees the request first. "Needs attention" list (FR-44). M5 report. |
| R-10 | A guest submits an incorrect reply and cannot change it. | Medium | Low | Summary and warning before the submit (FR-34). The organizer changes the reply (FR-41). |
| R-11 | An organizer without money access sees money data. | Low | High | The server applies the rules (FR-64). A test for each role (NFR-7). |
| R-12 | The WhatsApp in-app browser does not keep the device cookie. The guest must type the 4 digits again. Each new cookie uses one more device of the family limit. `[Assumption]` | Medium | Low | Test on real phones before launch. The organizer resets the device list (FR-30). |
| R-13 | WhatsApp blocks the number of an organizer. | Low | Medium | No automatic or bulk messages. The organizer pushes "send" for each message. |
| R-14 | New ideas (gallery, live stream, vendors) delay the Must items. | Medium | Medium | Won't Have list (Section 5.4). Add new ideas to Section 15 as questions, not to the build. |
| R-15 | The guest data does not agree with the India DPDP Act. | Low | Medium | Keep only necessary data. Privacy note. Automatic delete (FR-67). |

## 14. Timeline and Launch

**Practice project** (2026-10-24) `[Confirmed]`: The wedding moved, so there are no fixed dates. The build follows the waves in Section 6.1. The milestones and launch steps below are from the original plan. Use them when a real wedding uses the app. Until then, steps 1 (test wedding) and 5 (go criteria) apply to the dummy data, and the other steps do not apply.

### 14.1 Milestones

| Date | Milestone | Label |
|---|---|---|
| 16 Oct 2026 | PRD and design document approved. Then the build plan. | `[Confirmed]` |
| Approximately 10 Nov 2026 | Must items ready. Load the real list of approximately 500 families. 3 to 5 relatives try the app on their phones. | `[Confirmed]` |
| 30 Nov 2026 | Should (Nov) items ready: full expenses, history, budget views, reports. | `[Confirmed]` |
| Before 1 Dec 2026 | Restore test of a database copy (NFR-20). | `[Proposed]` |
| December 2026 | The family sends the invitations. The family selects the day. The app does not set a send date. | `[Confirmed]` |
| Before the stay last date | Should (Dec) items ready: tasks, stay, gifts, automatic delete. If the stay section is late, a reminder tells guests to come back to it. | `[Confirmed]` |
| Stay last date, then RSVP last date | TBD. The design document gives 20 Dec and 31 Dec as examples. The admins set the real dates (FR-4). | TBD |
| Approximately mid-January 2027 | The wedding. | `[Confirmed]` |
| 2 weeks after the wedding | M4 check: the app totals against bills and bank records. | `[Confirmed]` |
| 6 months after the wedding | Automatic delete of guest data (FR-67). | `[Confirmed]` |

### 14.2 Launch steps

| Step | What occurs | Label |
|---|---|---|
| 1. Test wedding | The owner makes a test wedding with false families and tries all Must flows. | `[Confirmed]` |
| 2. Relatives test | 3 to 5 relatives open the RSVP link on their own phones and reply. The owner records problems. | `[Confirmed]` |
| 3. Real data | The admins import the real list, correct the flags and assign families to organizers. | `[Confirmed]` |
| 4. Team training | The owner shows each organizer "My families", "Invitation sent", "Send reminder" and "Requests". 15 minutes for each person. | `[Proposed]` |
| 5. Go or no-go | The owner checks the go criteria below. | `[Proposed]` |
| 6. Invitations | Organizers send the cards and tick "Invitation sent". | `[Confirmed]` |
| 7. Watch | Each day in December, an admin checks "needs attention", requests and organizer progress. | `[Proposed]` |

**Go criteria** `[Proposed]`:
- All Must acceptance criteria pass.
- The RSVP page opens in approximately 1 second on 3 phones, also after a long time with no use (M6).
- 3 to 5 relatives replied with no help.
- A database copy was restored one time.
- The real list has no open flags, or each open flag has an owner.

**If the app fails during December** `[Proposed]`: Organizers collect replies by phone and WhatsApp, as before. When the app operates again, they enter the replies (FR-41). The admins use the last CSV export to continue.

## 15. Assumptions, Questions and Decisions

### 15.1 Assumptions

| ID | Assumption | Section | Check |
|---|---|---|---|
| A-1 | Vendor advances are possibly paid now, so the family needs to record expenses early. | 2.3 | Owner accepted Section 2 |
| A-2 | WhatsApp chats lose data. Spreadsheets are hard to update from a phone. People forget data. | 3.3 | — |
| A-3 | Weddingkart sends WhatsApp invitations and collects RSVPs. Not verified. | 3.3 | Not necessary for the build |
| A-4 | A wedding has 2 to 6 admins and 3 to 10 organizers. | 4.1 | Owner did not object |
| A-5 | The team uses the app each day. Guests use it one or two times. | 4.1 | — |
| A-6 | Guests use WhatsApp on a smartphone. | 4.2 | Relatives test (Section 14.2) |
| A-7 | The free tiers stay free and keep their rules until 6 months after the wedding. | 9.2 | Examine before the selection |
| A-8 | The WhatsApp in-app browser keeps the device cookie. | 13 (R-12) | Test on real phones |
| A-9 | Likelihood and impact of the risks. | 13 | — |

### 15.2 Open questions

| ID | Question | Owner | Needed by | Proposal |
|---|---|---|---|---|
| Q-1 | How many devices can each family have? | Builder | Before the build of FR-30 | Decided 2026-10-24: 12 devices `[Confirmed]` |
| Q-2 | How many incorrect attempts cause a stop, and for how long? What is the total limit for one device? | Builder | Before the build of FR-31 | Decided 2026-10-24: 5 incorrect attempts for one family, then a 15-minute stop. 20 attempts for one device in one hour. `[Confirmed]` |
| Q-3 | What is the format of the RSVP link? | Builder | Before the build of FR-22 | Decided 2026-10-24: the app suggests a short name of the couple (`/priya-rahul`). The admin can change it. It must be unique. It locks when the first family is marked "Invitation sent". `[Confirmed]` |
| Q-4 | Which providers for the database, hosting, photos and backups? | Builder | Start of the build | Decided on 2026-10-24: Neon, Vercel, Cloudflare R2, GitHub Actions (D-1). Check the current free plan rules at setup. |
| Q-5 | How long are daily database copies kept? | Owner | Before the build of FR-66 | 30 days `[Proposed]` |
| Q-6 | What are the real RSVP last date and stay last date? | Admins | Before the invitations | — |
| Q-7 | What is the start list of expense categories? | Builder | Before the build of FR-47 | Food, decor, venue, clothes, jewellery, gifts, photography, other `[Proposed]` |
| Q-8 | Which import formats (xlsx, csv)? | Builder | Before the build of FR-16 | Decided 2026-10-24: both `.xlsx` and `.csv`. The template is `.xlsx`. `[Confirmed]` |
| Q-9 | Which starter tasks for each event type? | Owner | December | The owner gives the lists |

### 15.3 Decisions

| ID | Decision | Date | By |
|---|---|---|---|
| D-1 | Stack is Next.js (App Router, TypeScript) with PostgreSQL on Neon, Cloudflare R2 for files and backups, Vercel hosting and a private GitHub repository. No Express. This replaces PERN (2026-10-16). Refer to the architecture document. | 2026-10-24 | Owner |
| D-2 | Free tiers only. ₹0 cost to operate. No hosting that stops for 30 to 60 seconds. | 2026-10-16 | Owner |
| D-3 | The app does not make or send the invitation card. One RSVP link for the full wedding. | 2026-10-16 | Owner |
| D-4 | Guests confirm with the family name and the last 4 digits of the primary or secondary number. No OTP. | 2026-10-16 | Owner |
| D-5 | Guests cannot change a reply after the submit. Only the team can. | 2026-10-16 | Owner |
| D-6 | No food preferences (all food is vegetarian). No travel or pickup data. | 2026-10-16 | Owner |
| D-7 | Roles for each wedding: admin (bride, groom, parents, siblings) and organizer (with a money switch, default off). | 2026-10-16 | Owner |
| D-8 | Any organizer can record a gift. Without money access, they see only their own gifts. | 2026-10-16 | Owner |
| D-9 | Guest data is deleted 6 months after the wedding. | 2026-10-16 | Owner |
| D-10 | M4 target is all expenses, of any amount. | 2026-10-16 | Owner |
| D-11 | Simple accessibility (not full WCAG 2.2 AA). Devices as in NFR-25 and NFR-26. | 2026-10-16 | Owner |
| D-12 | Event type list. All event types use the same form. Starter tasks in December. | 2026-10-16 | Owner (writer proposal) |
| D-13 | Only the bride or the groom can delete a full wedding (FR-68). | 2026-10-16 | Owner |
| D-14 | The PRD is in STE, in two documents: Sections 1 to 8, and Sections 9 to 17. | 2026-10-16 | Owner |
| D-15 | Import: save only with 0 errors (correct the file and upload again). Families that are already in the app are skipped (FR-17). | 2026-10-24 | Owner |
| D-16 | The RSVP link uses a free `vercel.app` address. No own domain. | 2026-10-24 | Owner |
| D-17 | The wedding moved. ShaadiDesk is a practice project with dummy data only. The features do not change. | 2026-10-24 | Owner |
| D-18 | Build the Must Have items in two waves. Wave 1 first. Then the owner decides about Wave 2 (Section 6.1). | 2026-10-24 | Owner |
| D-19 | Organizer invitations are shared by the admin on WhatsApp or by a copied message. The app sends no email (FR-9). | 2026-10-24 | Owner |
| D-20 | Validation uses Zod. Claude Code writes the code and the owner reviews each step. Build plan: `docs/plans/2026-10-24-wave-1-build-plan.md`. | 2026-10-24 | Owner |
| D-21 | Development uses normal PostgreSQL on the laptop (not Docker). Neon is only for production. | 2026-10-25 | Owner |
| D-22 | The database tool is Prisma 7, not Drizzle. | 2026-10-25 | Owner |
| D-23 | Tests: a small number of Vitest tests, only for the access rules and the import rules. No Playwright. No CI for now. | 2026-10-25 | Owner |
| D-24 | No seed script. The wedding, events and team are created in the app. Fake families come from sample Excel files through the import. | 2026-10-26 | Owner |

### 15.4 Proposals that the owner must approve

These items have the label `[Proposed]`. If the owner does not approve an item, remove it before the build.

| Area | Items |
|---|---|
| Requirements | FR-6 (icon and color), FR-14 (starter tasks), FR-42 and AF-14 (network failure), FR-26, FR-40, FR-59 (Could items) |
| NFR | NFR-5, NFR-8, NFR-20, NFR-21 and NFR-23 numbers, NFR-29 measure, NFR-32, NFR-34 |
| UX | UX-3, UX-4, UX-6, phone menu, new messages (Section 10.4), delete-wedding confirmation, reminder text |
| Other | "settled" label (AC-48.2), map links (Section 12.3), backup copies 30 days (Q-5), launch steps 4, 5 and 7, go criteria, plan if the app fails, Q-1, Q-2, Q-7, Q-8 proposals |

## 16. Glossary

| Term | Meaning in this PRD |
|---|---|
| Admin | A team member with full control of one wedding. Only the bride, groom, parents and siblings. |
| Organizer | A team member (family or friend) that helps. Money access only if an admin turns it on. |
| Team | All admins and organizers of one wedding. |
| Guest | A person in a guest family. Guests do not sign in. |
| Family | The unit of invitation. A guest that comes alone is a family of one person. |
| Side | Bride side, groom side, or both. |
| Hosted by | The side that pays for an event. It gives the default "charged to" side of its expenses. |
| Charged to | The side (or the split between the sides) that pays an expense. |
| Whole wedding | Costs or tasks that are not for one event, for example the photographer. |
| Haldi | A ceremony before the wedding. Family members put turmeric paste on the bride and groom. |
| Mehendi | A ceremony before the wedding. Henna designs are put on the hands of the bride and the women. |
| Sangeet | An evening of music and dance before the wedding. |
| Mata ki Chowki | A religious evening with prayers and songs for the goddess. Some families do it before the wedding. |
| Reception | A party after the wedding. |
| Shagun | A gift of money for good luck, usually in an envelope. |
| RSVP | A reply to an invitation: who comes, and how many persons. |
| RSVP link | The one link of the wedding that guests open to reply. |
| RSVP last date | The last date for guests to reply. After it, only the team can enter replies. |
| Stay last date | The last date for guests to ask for a stay. It is earlier than the RSVP last date. |
| Invitation sent | A tick that an organizer sets after they send the card to a family. |
| Request access | A request from a guest that does not know the family numbers. An organizer approves or rejects it. |
| Money access | The "can see money" switch of an organizer. |
| Test wedding | A wedding with the "test" flag, to try the app with false data. |
| Payment | Money that one person gave for an expense. |
| Paid / Due | Paid is the sum of the payments. Due is the total cost minus paid. |
| Repaid | The family gave the money back to the person that paid. |
| Purchase task | A task to buy something. When it is done, the app makes the expense. |
| Soft delete | A delete that keeps the record in a "Deleted" list, so an admin can restore it. |
| `wa.me` link | A link that opens a WhatsApp chat with a ready message. The person pushes "send". |
| Open Graph | Tags on a web page that set the preview card in WhatsApp. |
| Next.js | A React framework. It makes pages on the server and runs the server code of the app. |
| Neon | The service that hosts the PostgreSQL database. |
| Cloudflare R2 | The service that keeps photos and database copies. It uses the S3 API. |
| `pg_dump` | A tool that makes a copy of a PostgreSQL database. |
| DPDP Act | The India Digital Personal Data Protection Act. |
| MoSCoW | Must, Should, Could, Won't. A method to set priorities. |
| STE | ASD-STE100 Simplified Technical English. The language rules of this PRD. |

## 17. References

| Reference | Use |
|---|---|
| Design document: `docs/superpowers/specs/2026-10-16-wedding-management-design.md` | The source of the details for all sections. If this PRD and the design document do not agree, stop and ask the owner. |
| PRD main document: `docs/prd/2026-10-16-shaadidesk-prd.md` | Sections 1 to 8 |
| Architecture document: `docs/architecture/2026-10-24-shaadidesk-architecture.md` | Stack, system diagram, main flows and folder structure |

No other research or data was used.

---

## Closing summary

### Summary in 5 points

1. **What:** ShaadiDesk is a free web app (Next.js and PostgreSQL, ₹0 cost) for an Indian wedding. The first use is one wedding: approximately 500 families, 5 events, mid-January 2027.
2. **Guests:** One RSVP link. Guests find their family, confirm with 4 digits, see only their events and reply one time. Help comes from "Request access" and organizers.
3. **Team:** Admins (close family) and organizers (helpers) import the list, track invitations, send reminders by WhatsApp links, and record expenses, tasks, stay and gifts. Money is private by default.
4. **Plan:** Must items by approximately 10 Nov, full expenses by 30 Nov, tasks, stay and gifts in December. Invitations go out in December.
5. **Safety:** The server checks all access. Daily database copies, CSV export, edit history and soft delete. Guest data is deleted 6 months after the wedding.

### Top 5 decisions to confirm

1. **Backup copies:** keep 30 days (Q-5).
2. **Attempt and device limits:** 12 devices, 5 incorrect attempts then a 15-minute stop, 20 attempts for one device each hour (Q-1, Q-2).
3. **Event type list, icons and colors as Must items** by 10 Nov (FR-5, FR-6).
4. **Real last dates:** the RSVP last date and the stay last date (Q-6).
5. **Go criteria and the plan if the app fails** in December (Section 14.2).

### Checklist before the build

- [ ] The owner approved all sections of the PRD.
- [ ] The owner approved or removed each `[Proposed]` item (Section 15.4).
- [ ] The design document agrees with the PRD. Update it for: event types, starter tasks, delete of a wedding only by the bride or groom, backup copies.
- [ ] The builder examined the free plans and selected the providers (Q-4).
- [ ] A Google sign-in project is ready (OAuth client).
- [ ] The family has the guest list, or has started to put it in the template format.
- [ ] The emails of the admins and organizers are known.
- [ ] 3 to 5 relatives with different phones agree to test.
- [ ] The PRD and the design document are committed to git.
- [ ] The build plan is written (next step, when the owner says to start).
