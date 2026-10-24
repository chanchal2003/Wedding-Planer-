# Wedding Management App: Design

Date: 2026-10-16
Status: Approved (revised 2026-10-16). The PRD (`docs/prd/2026-10-16-shaadidesk-prd.md`) is based on this version.
Language: ASD-STE100 Simplified Technical English (STE)

## 1. Intent

Indian weddings are difficult to manage. A wedding has many events. Examples are haldi, mehendi, sangeet, wedding and reception. A wedding has hundreds of guests. Each guest goes to some events, but not to all events. A wedding has many vendors. Many family members pay money. Today, people keep this data in WhatsApp chats, in spreadsheets and in their memory.

The app gives one location for all wedding data. The couple and their helpers (family and friends) use the app to manage:
- Events
- Guests and RSVPs
- Invitations
- Expenses
- Tasks
- Gifts
- Stay arrangements.

The family sends its own invitation card to guests, outside the app. The card has one RSVP link for the full wedding. A guest opens this link, finds their family, and confirms with a phone number. Then the guest sees only the events that the family can go to, and replies.

**First wedding:** The first user is one real wedding. This wedding has approximately 500 guests and 5 events. The wedding date is approximately mid-January 2027.

**Many weddings:** The app must support many weddings from the start. At first, only one wedding will use the app.

**Cost:** The app is free. The cost to operate the app must be zero, or almost zero, at this size.

## 2. Goals

- Manage all of one real wedding with the app. This includes guests, invitations, RSVPs, expenses, tasks, gifts and stay arrangements.
- Make invitations and RSVPs operate early. The family must send invitations before the other parts are complete.
- Invite each family to specific events. Record a headcount for each event.
- Show the money clearly: budget, money spent, money due to vendors, who paid, and the share of each side. Hide money from helpers who do not need it.
- Show different views to different persons (refer to Section 5).
- Make the app easy to use on a phone. Most guests and many organizers use phones.
- Use a data model that supports many weddings from the start.

## 3. Non-goals (first version)

The first version does not include these items:
- Photo gallery (later).
- Live stream (later). The plan is to show a YouTube or Facebook stream link. Do not build a streaming system.
- Day schedule for the wedding day, with times and owners (later).
- Automatic or paid messages (WhatsApp Business API, SMS). Organizers send messages manually (refer to Section 7).
- **Invitation card (decided):** The app does not make, design, split or send the invitation card (image or PDF). The family and the organizers do this outside the app.
- Email invitations.
- Guests that add themselves to the guest list.
- Login with a one-time code (OTP) for guests. The app keeps the phone numbers, so you can add OTP later.
- A full vendor page that shows all money for one vendor in all events (later). The app keeps the vendor name and phone number on each expense.
- More than one language. Use English only.
- A different invitation design for each family. Each wedding has one design.
- Payments in the app. The app records money. The app does not send or receive money.
- Sales to many couples or planners, billing, and a marketing website.

## 4. Anti-goals

These results are failures, even if the app operates:
- A guest sees an event that is not on the invitation of the guest. A guest sees the data of a different family. The server must apply these limits. It is not sufficient to hide data in the user interface.
- A guest sees money, budgets or gifts. An organizer without money access sees money, budgets or gifts.
- It is slow or difficult to enter an expense or a task. Then the family stops using the app and goes back to WhatsApp.
- Older relatives cannot open or use the invitation. Causes include slow pages and lockouts that they do not understand.
- The app costs money that the couple did not expect.

## 5. Roles

Each role is for one wedding. One person can be an organizer in one wedding and a guest in a different wedding.

| Role | Who | Permissions | Login |
|---|---|---|---|
| Admin (couple) | The bride, the groom, and the parents or siblings that an admin makes admin | All permissions. This includes all money, gifts and guest data. An admin adds and removes organizers. An admin sets the money access of each organizer. An admin assigns and reassigns tasks. An admin edits the invitation content. | Google sign-in |
| Organizer | Family and friends that help | Manage guests. Look after the families that an admin assigns to them. Mark "invitation sent". Enter RSVPs for a family. Edit event details and stay data. Send reminders. Approve access requests. Make tasks for themselves. Take tasks that have no owner. Add expenses. See money and gifts only if "can see money" is on. | Google sign-in, after an admin adds their email |
| Guest | Invited families | See only the events on their invitation. Send an RSVP with a headcount. Enter stay data. | The wedding RSVP link, family search and phone number check (refer to Section 7) |

### 5.1 Money access for organizers (decided)

Each organizer has a "can see money" switch. An admin sets this switch. The default is off. An admin always sees all data.

| Data | Switch on (for example, parents, siblings) | Switch off (for example, friends) |
|---|---|---|
| Event details, guest list, RSVPs | Sees | Sees |
| Own tasks. Set a purchase task to done and enter the cost. | Yes | Yes |
| Expenses that the organizer entered | Sees | Sees |
| Budgets, other expenses, who paid, repayments, money due, side split | Sees | Does not see |
| Gifts and shagun | Sees all. Records gifts. | Records gifts. Sees only the gifts that the organizer recorded. |

"Does not see" means that the server does not send the data. It is not sufficient to hide the data in the user interface.

### 5.2 Make a wedding (decided)

- A person signs in with Google to make a new wedding.
- Only the bride, the groom, or their parents or siblings can make a wedding. Friends and other helpers cannot make a wedding. An admin can add them as organizers.
- The person that makes the wedding selects their relation: bride, groom, parent or sibling. This person becomes the admin of the wedding.
- Only these relations can be admin. An admin can make a parent or a sibling an admin. A friend can only be an organizer. Reason: only close family can change roles or data that is important to the wedding.
- *Decision of the writer:* The app cannot verify the relation. The app records the relation and accepts it.
- A real wedding must have the names of the bride and the groom. The wedding date must be in the future.
- *Decision of the writer:* There is no limit on the number of weddings for one account. Examine this limit again if more couples use the app.
- **Test wedding (decided):** An admin can make a wedding with the "test" flag. A test wedding can have any date and false guests. Use a test wedding to try the app before you send the real invitations. The app shows the "test" label on all pages of a test wedding. An admin can delete a test wedding in one step.

### 5.3 Special conditions for roles

- An admin invites an organizer by email.
- The app shows invitations that are pending (the person did not sign in yet). An admin can send a pending invitation again.
- If the person signs in with a different Google account, the admin can change the email.
- An admin can assign tasks to a pending organizer. The organizer sees these tasks at the first sign-in.
- Nobody can remove or demote the last admin.
- **Protection for the bride and groom (decided):**
  - After the bride or groom signs in, other persons cannot remove their admin role. Only the bride or groom can remove their own admin role.
  - Before the bride or groom signs in, the admin that made the wedding can edit their entry. For example, the admin can correct an incorrect email.
- *Decision of the writer:* An admin can demote a different admin. This is not possible if that admin is a bride or groom who signed in.
- **Remove an organizer (decided):** Before an admin removes an organizer, the app asks the admin to give the families and the open tasks of that organizer to a different team member. The app does not remove the organizer until all families and open tasks have a new owner. The records of that person (expenses, payments, history) stay.

## 6. Features

### 6.1 Weddings and events

- A wedding has these data:
  - Names of the couple
  - Banner photo
  - Greeting text
  - Colors
  - RSVP last date
  - Stay last date. This date is earlier than the RSVP last date (for example, 20 December and 31 December). The family needs this date to book rooms.
  - Test flag.
- A wedding has many events. Each event has these data:
  - Name (for example, haldi or sangeet)
  - Date and start time
  - Venue name and map link
  - Dress code or note
  - Budget
  - "Hosted by": bride side, groom side, or both.
- **Who manages events (decided):** Only admins can add or delete an event. Organizers can edit the details of an event (for example, time, venue or note). Organizers cannot edit the budget unless they have money access.
- If an admin deletes an event, the app shows how many families, replies, expenses and tasks link to it, and asks for confirmation. Expenses and tasks of that event move to "whole wedding".
- The event list shows "hosted by".
- "Hosted by" is the default "charged to" side for each expense of that event. A user can change the side for each expense.
- The dashboard shows the weddings of the user. Then the wedding dashboard shows:
  - The list of events
  - Tasks that are due soon
  - The budget summary (only with money access)
  - A "needs attention" list: guests with no reply, access requests, money that is due soon, and open tasks.
- Click an event to open the event page. The event page shows:
  - Tasks
  - Expenses, budget and money spent (only with money access)
  - Guest counts.

### 6.2 Guest list (families)

- The unit of invitation is the family. A guest that comes alone is a family of one person.
- A family has these data:
  - Family name (for example, "Sharma family")
  - Contact name (for example, "Meena") and city (optional). The family search shows these data to identify families with the same name.
  - Primary phone number (required)
  - Secondary phone number (optional)
  - Side: bride, groom, or both
  - Assigned organizer (refer to Section 7.1)
  - Invitation sent: yes or no, with the date
  - Notes.
- **Primary and secondary numbers (decided):**
  - Each family has one primary number. A family can also have one secondary number. There are no other numbers.
  - The organizer sends the invitation and the reminders to the primary number.
  - A guest can use the primary number or the secondary number to confirm the family on the RSVP page.
  - An organizer can change the two numbers. An organizer can make the secondary number the primary number.
  - The Excel or CSV import has one column for each number.
  - Other family members get access with a "Request access" (refer to Section 7.2). The app does not keep their numbers.
  - **Example:**
    - The Sharma family has two numbers. The primary number is the number of Meena (98765 11111). The secondary number is the number of her son Rohan (98765 22222).
    - The organizer sends the card and the RSVP link to Meena.
    - Meena sends the card to Rohan. Rohan opens the RSVP link, selects "Sharma family", and types the last 4 digits of his own number (2222). The app finds this number as the secondary number. Rohan gets access.
    - Meena sends the card to her daughter Priya. Priya does not know the family numbers. Priya pushes "Request access". An organizer approves the request. Then Priya can open the Sharma invitation on her phone.
- Each family has a list of the events on its invitation. For example: "Haldi, Wedding". There is no limit on the number of persons (refer to Section 6.3).
- The names of each family member are optional in the first version.
- **Make the guest list (decided):** Import an Excel or CSV file. This is the main method, because typing 500 guests is not practical. An organizer can also add one family at a time. The builder selects the file format. Guests cannot add themselves to the list in the first version.
- **Import columns (decided):** The import file has these columns: family name, contact name, city, primary number, secondary number, side, one column for each event (yes or no), assigned organizer (email or name), notes. Only family name and one event are required. The builder gives a template file to download.
- The import shows a preview before the app saves the data.
- The import flags duplicates:
  - The same phone number in two families.
  - A phone number that is already in the list.
- You can import a family with no phone number. The app flags this family. Guests of this family cannot confirm on the RSVP page until an organizer adds a number. They can use "Request access". Organizers can enter an RSVP for this family.
- An organizer can add or change the phone number of a family in one step from the dashboard.
- An organizer can mark a number as incorrect or not reachable. The app then shows this number in a list to correct.
- The dashboard shows counts for each event and for the full wedding:
  - Invited
  - Replied yes (number of persons)
  - Replied no
  - No reply.
- The dashboard shows these counts for the bride side, the groom side, "both", and the total.

### 6.3 RSVP page (guest view)

The RSVP page is the only page that guests use. It has two screens.

#### Screen 1: Find your family

The guest opens the RSVP link from the invitation card. This screen shows:
- The banner photo and the names of the couple.
- A search box: "Type your family name".
- A box for the last 4 digits of the family phone number.
- A "Request access" button.

Section 7.2 gives the full procedure for this screen.

When the guest opens the link again on the same phone, the app does not show Screen 1. The app opens Screen 2 directly.

#### Screen 2: Your invitation

This screen shows only the data of the family of the guest. It shows these items, from top to bottom:

1. **Greeting.** For example: "Namaste, Sharma family".
2. **One card for each event of the family.** The app does not show other events. Each card shows:
   - Event name, date and time
   - Venue and map link
   - Dress code or note.
3. **Reply on each card.**
   - "Yes" or "No".
   - If "Yes": the number of persons that come. There is no maximum number (decided).
4. **Stay.** One section for the full family: stay needed, number of persons and number of days. Refer to Section 6.6.
5. **"Submit" button.** After the guest pushes "Submit", the page shows the reply as read-only, with "Replied by <name>, <date>".
6. **Privacy note.** For example: "We use your data only for this wedding. We delete it after the wedding."
7. **Photos and live stream.** An empty area for a later version.

The couple edits the banner photo, the greeting, the colors and the note of each event from the dashboard. All guests see the same design.

#### Rules for replies

- **One reply for each family.** All family members with access see the same reply.
- **Guests cannot edit a reply (decided):**
  - A guest submits the reply one time.
  - *Decision of the writer:* Before the submit, the app shows a summary of the reply and this warning: "You cannot change this reply later. Do you want to submit?" The guest pushes "Yes, submit" or "Go back".
  - After the submit, the reply is read-only for all guests of that family.
  - If two family members submit at the same time, the app keeps the first reply. The second person sees the first reply.
  - If another family member opens the page later, they see the reply that was submitted. They cannot change it.
  - To change a reply, the guest must tell an organizer. The page shows this text: "To change your reply, contact <organizer name>", with a button that opens a WhatsApp chat with the assigned organizer.
  - Only organizers and admins can change a reply.
- **Stay:** *Decision of the writer:* The same rule applies. A guest submits the stay section one time. After that, only organizers can change it. If this section was not ready at the first reply, the guest can fill it one time later.
- **Last dates:**
  - Guests must submit the event replies before the RSVP last date (23:59 India time).
  - Guests must submit the stay section before the stay last date.
  - After these dates, guests cannot submit. The page shows "Replies are closed. Contact <organizer name>."
  - The last dates do not apply to organizers and admins.
- **If the stay section is not ready:** Open the RSVP page without this section. Tell guests about it later in a reminder.

#### Organizers reply for a family

- Many relatives reply by a phone call or in a WhatsApp chat. Then an organizer enters the reply in the app.
- Organizers and admins can change the RSVP, headcount and stay data of any family at any time. This is also possible after the last dates.
- The app shows these changes as "updated by <organizer name>".
- *Decision of the writer:* If an organizer removes an event from the invitation of a family, the app also removes the reply of that family for that event. The organizer does this on purpose, so the app does not ask for review.

#### WhatsApp link preview

- When a person sends the RSVP link on WhatsApp, WhatsApp shows a small preview card.
- This card shows only:
  - The banner photo of the couple
  - The text "<Bride> & <Groom>'s Wedding"
  - The month and year.
- The card never shows family names, events or guest data.
- The builder sets this with Open Graph tags on the RSVP page.

### 6.4 Expenses

**Money model:**
- The amount of an expense is the total cost.
- A payment is money that a person gave. Examples are an advance, a part payment and the last payment.
- An expense has a list of payments.
- Each payment has these data:
  - Amount
  - Date
  - Paid by (a person)
  - Repaid: yes or no.
- Paid = the sum of all payments.
- Due = total cost minus paid. An expense can have a due date.
- "Spent" in the budget views is the total cost of all expenses. The dashboard also shows paid and due.
- A simple purchase is one expense with one payment for the full amount. The user enters it in one step.

**Required fields:** Fast entry is important. Only these three fields are required:
- Amount (total cost)
- Event, or "whole wedding"
- Description.

"Whole wedding" is for costs that are not for one event. Examples are clothes, jewellery and the photographer.

**Optional fields:** The user can enter these fields later:
- Category (for example, food, decor, venue, clothes, gifts). The builder can give a start list. The couple can add categories.
- Vendor name and phone number.
- Payments and the due date of the remaining money.
- Charged to: bride side, groom side, or split. The default comes from "hosted by" of the event. The builder selects how to keep the split. The default split is 50/50. A user can set different percentages.
- A photo of the bill or receipt.

**Edit history and recovery (decided):**
- Each expense and each payment records:
  - Who made it.
  - Each change: who, when, old value and new value. For example: "Caterer amount ₹2L → ₹2.4L by Rohan, 3 Dec".
- The delete function is a soft delete. A deleted expense goes to a "deleted" list. An admin can restore it from this list.

**Views (only with money access):**
- For each event: budget, money spent and money that remains.
- For the full wedding: total money spent, by category and by side.
- Money due. For example: "₹1L due to decorator by 14 Jan".
- Repayments. For example: "Uncle Ramesh paid ₹80k, not repaid".

**Example: the sangeet decorator**

1. **1 November: the deal.** The decorator gives a price of ₹1,50,000 for the sangeet decoration. Dad adds an expense with the three required fields:
   - Amount (total cost): ₹1,50,000
   - Event: Sangeet
   - Description: Stage and hall decoration.
2. **Optional fields.** Dad can add these now or later:
   - Category: Decor
   - Vendor: Sharma Decorators, phone number
   - Charged to: Split 50/50. The app sets this value because the sangeet is "hosted by: both". Dad can change it.
   - Bill photo: a photo of the price quotation.
3. **1 November: the advance.** Dad pays ₹50,000. He adds a payment to the expense: ₹50,000, paid by Dad, 1 Nov.
4. **20 December: the second payment.** Dad is not in town. Uncle Ramesh pays ₹50,000 with his own money. He adds a payment: ₹50,000, paid by Uncle Ramesh, 20 Dec, Repaid: No.
5. **The result.** The app shows this expense:

```
Stage and hall decoration — Sangeet
Total cost:   ₹1,50,000
Paid:         ₹1,00,000  (Dad ₹50k, Uncle Ramesh ₹50k)
Due:          ₹50,000    by 14 Jan
Charged to:   Bride side ₹75k · Groom side ₹75k
```

6. **Edit history.** Later, Rohan changes the total cost to ₹1,65,000. The app records: "Total ₹1.5L → ₹1.65L by Rohan, 3 Dec". If a person deletes the expense by mistake, an admin can restore it from the "Deleted" list.

**Example: other expenses**
- **Simple purchase:** Ankit buys flowers for ₹5,000. He enters the expense in one step. The app makes one payment of ₹5,000 by Ankit. If the flowers are a purchase task, Ankit sets the task to "done" and types ₹5,000.
- **Whole wedding:** The photographer works at all 5 events. The expense uses "Whole wedding", not one event.

**Example: what persons with money access see**
- Sangeet: budget ₹4L, spent ₹2.8L, remaining ₹1.2L.
- Full wedding: ₹18L total. Food ₹7L, decor ₹3L. Bride side ₹9.5L, groom side ₹8.5L.
- Money due: "₹50k due to Sharma Decorators by 14 Jan".
- Repayments: "Uncle Ramesh paid ₹50k, not repaid".

An organizer without money access (for example, Ankit) sees only the expenses that he entered, for example the ₹5,000 for flowers.

### 6.5 Tasks

Tasks replace the shopping list.

- A task has these data:
  - Name
  - Quantity (optional)
  - Event, or "whole wedding"
  - Assigned person. This is a team member: an admin or an organizer. It can be a pending organizer.
  - Due date
  - Status: "to do" or "done"
  - A flag "is a purchase".
- Examples:
  - "Buy marigold garlands – 50" (purchase)
  - "Book pandit"
  - "Confirm caterer headcount by 10 Jan".
- When a user sets a purchase task to "done", the app asks for the cost. Then the app makes the related expense. The app sets "paid by" to the user. This prevents double entry.
- An organizer without money access can also do this. This organizer can see the expense that they made.
- **Who assigns tasks (decided):**
  - An admin makes tasks and assigns them to any team member.
  - An organizer can make tasks only for themselves.
  - An organizer can take a task that has no owner.
  - Only an admin can move a task from one person to a different person.
  - Guests are not in the list of persons for tasks.
- Each person has a "My tasks" list for all events.
- The app does not send automatic messages for tasks. An admin can push a WhatsApp button to tell a person about a task. This is the same method as for reminders.

**Example: the wedding team**

The team has three persons: the admin, Ankit (a friend, organizer, no money access) and Rohan (a cousin, organizer).

1. **The admin makes tasks:**

| Task | Event | Assigned to | Due | Purchase |
|---|---|---|---|---|
| Buy marigold garlands – 50 | Haldi | Ankit | 10 Jan | Yes |
| Book pandit | Wedding | Rohan | 15 Dec | No |
| Confirm caterer headcount | Whole wedding | Rohan | 10 Jan | No |
| Arrange DJ | Sangeet | (no owner) | 20 Dec | No |

2. **The admin tells Ankit.** The admin pushes the WhatsApp button next to the task. WhatsApp opens the chat of Ankit with this text: "Hi Ankit, new task: Buy marigold garlands by 10 Jan". The admin pushes "send".
3. **Each person sees their own list.** Ankit opens "My tasks" and sees one task: "Buy marigold garlands – 50 (Haldi, due 10 Jan)". Rohan sees his two tasks. "Arrange DJ" is in the list of tasks with no owner.
4. **Ankit completes a purchase task.** Ankit buys the garlands and pushes "Done". The task is a purchase, so the app asks: "How much did it cost?". Ankit types ₹4,000. The app makes this expense: ₹4,000, Haldi, "Marigold garlands", paid by Ankit. Nobody enters it again. Ankit can see this expense, but he cannot see other money.
5. **Rohan completes a normal task.** Rohan books the pandit and pushes "Done". The task is not a purchase, so the app does not make an expense.
6. **Rohan takes a task with no owner.** Rohan pushes "I'll do it" on "Arrange DJ". The task goes into his "My tasks" list.
7. **The admin dashboard** shows open tasks that are due soon. For example: "Book pandit, due 15 Dec, Rohan".

**Permissions for tasks:**

| Action | Admin | Organizer |
|---|---|---|
| Make a task for any team member | Yes | No |
| Make a task for themselves | Yes | Yes |
| Take a task with no owner | Yes | Yes |
| Move a task from one person to a different person | Yes | No |
| Assign a task to a guest | No | No |

### 6.6 Stay

**Food (decided):** All food at the wedding is vegetarian. The app does not ask guests for food preferences.

**Travel (decided):** The app does not ask for arrival, departure or pickup data in the first version.

**What the guest enters:** The guest fills these data for the family on the RSVP page. An organizer can also enter them.
- Stay needed: yes or no.
- If yes:
  - Number of persons that need a stay.
  - Number of days.

*Decision of the writer:* "Number of days" counts the nights of the stay. The app does not ask for dates. The organizers confirm the dates with the family if necessary.

**Organizer functions:**
- Assign a hotel and room to a family. Use text fields for the hotel name and the room numbers.
- See these lists:
  - Families that need a stay, with the number of persons and days
  - Total persons that need a stay
  - Families with a room assigned and families without a room.

**Example:**
- The Sharma family replies: "Stay needed: yes. 4 persons. 3 days."
- The organizer sees the Sharma family in the "needs a stay" list.
- The organizer books 2 rooms at Hotel Raj and types "Hotel Raj, rooms 101 and 102" for the Sharma family.
- The Sharma family moves to the "room assigned" list.

### 6.7 Gifts and shagun (decided: included, December tier)

- For each family, record the gift:
  - A cash or shagun amount, or a description of an item
  - The event.
- Purpose: thank-you notes, and the correct gift to give back at events of that family.
- **Who records gifts (decided):** Admins and all organizers can record a gift. An organizer without money access sees only the gifts that they recorded. Admins and organizers with money access see and edit all gifts.
- Gifts have the same edit history and soft delete as expenses.

## 7. Messages and guest access (decided: free and manual)

### 7.1 Invitations: sent by organizers, outside the app (decided)

- **Card:** The family makes the invitation card (image or PDF) outside the app. The card contains the RSVP link of the wedding and, if the family wants, a QR code of this link. The app shows the RSVP link with a "Copy" button. *Decision of the writer:* The app also shows a QR code image of the link to download.
- **One RSVP link for the full wedding:** For example, `ourwedding.app/priya-rahul`. All families get the same link. Guests can forward the card and the link. There are no personal links for each family.
- **Assigned families:** An admin assigns each family to one organizer. For example: "Ankit: 120 families of the groom side". An admin can assign many families in one step (for example, by side or from the import file).
- **"My families" list:** Each organizer sees a list of their families, like a to-do list.
- **Send:** The organizer sends the card and the RSVP link to the primary number of each family from their own WhatsApp. The app does not send it and does not open WhatsApp for it.
- **Mark as sent:** After the organizer sends the card, the organizer ticks "Invitation sent" for that family. The app records the date and the organizer.
- **Progress:** The admin dashboard shows, for each organizer: number of families, invitations sent, replies received.
- **Reminders:**
  - The app shows the families that did not reply. Each organizer sees their own families first.
  - *Decision of the writer:* Each family has a "Send reminder" button. This button opens the WhatsApp chat of the primary number (a `wa.me` link) with a short ready message and the RSVP link. The organizer pushes "send" in WhatsApp. The app records the reminder. The organizer can also send reminders without the button.
- Do not send many messages automatically from a personal number. WhatsApp can block the number.

### 7.2 Guest access: family search and phone number check (decided)

1. The guest opens the RSVP link.
2. The guest types the first letters of the family name. The app shows the families that match. Each match shows the family name and the contact name or city, for example "Sharma family (Meena, Jaipur)". The app starts to show matches only after 3 letters. The app does not show the full list of families.
3. The guest selects their family.
4. The app asks for the last 4 digits of the family phone number. The guest can use the primary number or the secondary number.
5. If the 4 digits are equal to the last 4 digits of one of these numbers, the guest gets access. The page then shows the invitation of this family (Section 6.3).
6. The app keeps all phone numbers in one standard format. This format removes the differences of "+91", a "0" at the start, spaces and dashes.
7. The app remembers the device with a long-life cookie or session. When the guest opens the link again on that device, the app opens the family invitation directly.
8. **Request access:**
   - A family member does not know the phone numbers of the family, or the digits are not correct.
   - The app shows: "The number does not match. You can request access."
   - The person types their name and pushes "Request access".
   - The request goes to a "Requests" list on the dashboard. The list shows the name, the family and the time. The assigned organizer of the family sees the request first.
   - An organizer approves or rejects the request in one step.
   - If the organizer approves, the device of the person gets access to the family invitation. The app does not keep the number of the person.
   - If the organizer rejects, the device does not get access.
   - *Decision of the writer:* The page also shows a button that opens a WhatsApp chat with the assigned organizer, for fast help.
9. **Limit on attempts:**
   - Each family can have 10 to 15 devices with access. An organizer can reset the device list of a family.
   - After a small number of incorrect attempts for one family, the app stops attempts for that family on that device for a period.
   - The app also limits the total number of attempts from one device, so a person cannot try many families.

**Known risks that the user accepts:**
- Anybody with the link can see the names of families that match the letters they type. The app shows matches only after 3 letters and never shows the full list.
- 4 digits are not strong security. A person who knows the last 4 digits of a family number can reply for that family. The attempt limits decrease guessing. For a family wedding, this risk is acceptable.
- Family members who do not know the family numbers need an organizer approval. This adds some work for organizers.
- Organizers send all invitations and reminders manually.

## 8. Constraints

- **Stack: PERN (decided).** This is PostgreSQL, Express, React and Node. The user changed the stack from MERN to PERN. Reason: the data has many relations, and money needs exact totals and safe changes. Section 8.1 gives the database design.
- **Free to operate:**
  - Use free tiers for hosting, the database and storage. For example: a free PostgreSQL tier (Neon is one example), free hosting for the API and the frontend, and free storage for banner and receipt photos.
  - The database must also agree with the "fast first load" rule. Some free PostgreSQL plans pause a project after some days with no use. Do not use a plan that pauses for days. A plan that wakes in less than approximately 1 second is satisfactory.
  - The builder selects the providers.
- **Fast first load (decided):**
  - Some free servers stop when nobody uses them. Then the next user waits 30 to 60 seconds. This is not permitted.
  - Older relatives must not wait.
  - A page must open in approximately 1 second, also after a long time with no use.
  - Serve the frontend as static files.
  - Put the API on a service that does not stop, or that starts in approximately 1 second. Serverless functions are one example.
  - The builder must examine the current rules of the free plans before the selection.
  - A "keep-alive" ping is the last option.
- **Backups:**
  - Do not trust the free database tier for backups. Free tiers keep little or no history.
  - Supply CSV export of guests, RSVPs, stay data, expenses, tasks and gifts.
  - Make a database copy (`pg_dump`) at a set interval, for example each day. Keep this copy on a different host.
- **Size:** For each wedding, approximately 500 families or guests, 5 events and a small number of organizers.
- **Many weddings:**
  - Each record belongs to one wedding.
  - Roles are for each wedding.
  - One Google user can be in many weddings.
- **Phones first:** The guest pages are for phones first. The organizer pages must also operate on phones.
- **Privacy:**
  - Guest phone numbers, money and gifts are sensitive data.
  - The server must check each request:
    - A guest gets only the data of their family and of their events.
    - An organizer gets only the data of their weddings.
    - An organizer gets money and gifts only with money access.
  - The India DPDP Act applies to guest data. Keep only the data that is necessary.
- **Data retention (decided):**
  - The app deletes guest phone numbers, stay data, access requests and guest devices 6 months after the wedding date. This is automatic.
  - Before the delete, the app gives a warning to the admins. The admins can download a full CSV export.
  - The app keeps expenses and totals for the couple.
  - The couple can delete all data of a wedding at any time.
- **Time:**
  - The wedding is in approximately mid-January 2027.
  - The family sends invitations in December. The family selects the day.
  - The app must not set a fixed send date.
  - Refer to the cut line in Section 9.

### 8.1 Database design (PostgreSQL)

This section gives the main tables and rules. The builder decides the columns, names and indexes (refer to Section 10). The rules in this section must stay.

**Main tables:**

| Table | One row is | Main links |
|---|---|---|
| `users` | One Google account | — |
| `weddings` | One wedding (also test weddings) | — |
| `wedding_members` | One person in the team of one wedding | `users`, `weddings`. Role (admin or organizer), relation, money access, pending email |
| `events` | One event (haldi, sangeet…) | `weddings`. "Hosted by" side, budget |
| `families` | One guest family | `weddings`, assigned organizer (`wedding_members`). Primary and secondary number, side, invitation sent |
| `family_events` | One event on the invitation of one family | `families`, `events` |
| `replies` | The reply of one family for one event | `family_events`. Yes or no, headcount, replied by, date |
| `stays` | The stay request of one family | `families`. Persons, days, hotel, rooms |
| `guest_devices` | One phone or browser with access to one family | `families` |
| `access_requests` | One "Request access" | `families`. Name, status |
| `expenses` | One expense (total cost) | `weddings`, `events` (empty = whole wedding), category, vendor, charged-to split |
| `payments` | One payment for one expense | `expenses`, paid by, repaid |
| `tasks` | One task | `weddings`, `events`, assigned person, linked expense (for purchase tasks) |
| `gifts` | One gift of one family | `families`, `events` |
| `history` | One change to a money or gift record | Table name, row, who, when, old value, new value |

**Rules that the database must apply:**
- **Many weddings:** Each table (except `users`) links to one wedding, directly or through its parent. Each query filters by wedding.
- **One reply:** Only one row in `replies` for each family and event (unique constraint). If two family members submit at the same time, the first reply stays.
- **Reply only for invited events:** A reply links to `family_events`. Thus a family cannot reply to an event that is not on its invitation.
- **Remove an event from a family:** When an organizer removes a row from `family_events`, the database also removes the reply for that row (cascade delete).
- **Phone numbers:** Keep phone numbers in one standard format. A phone number cannot be in two families of the same wedding (unique constraint for each wedding).
- **One team role:** One person has only one row in `wedding_members` for each wedding.
- **Money:** Keep money in an exact number type (`numeric`, or whole paise as `bigint`). Do not use floating-point numbers.
- **Purchase task to expense:** When a user sets a purchase task to "done", the app makes the expense, makes the payment and updates the task in one transaction. If one step fails, no step stays.
- **Soft delete:** Expenses, payments and gifts have a `deleted_at` column. A delete sets this column. A restore clears it.
- **Edit history:** Each change to an expense, payment or gift adds a row to `history` in the same transaction as the change.
- **Data retention:** The 6-month delete (Section 8) clears phone numbers and stay data, and removes `guest_devices` and `access_requests`. It keeps expenses, payments and totals.

## 9. Build sequence and cut line (decided)

| Tier | Last date | Scope |
|---|---|---|
| **Must ship** | approximately 10 November 2026 | Steps 1 to 4, and a fast expense form (amount, event or whole wedding, description). Load the real list of approximately 500 families. 3 to 5 relatives try the app on their phones. |
| **Should ship** | 30 November 2026 | Step 5: all expense functions. |
| **Can move to December** | before the stay last date | Steps 6 to 8: tasks, stay, gifts. A reminder message sends guests back to the stay section. |

1. Weddings (also test weddings), events with "hosted by", roles, the money access switch, Google sign-in for admins and organizers.
2. Guest families with a primary and an optional secondary number, contact name and city, the events of each family, Excel or CSV import with preview and duplicate flags, sides, assigned organizer.
3. The RSVP page with a safe link preview, the family search and the 4-digit check, the "Request access" procedure and the requests list, RSVP with headcount, the RSVP last date, and the privacy note.
4. The RSVP link with "Copy" and QR code. "My families" list with the "Invitation sent" tick. Progress for each organizer. Reminder button. RSVP dashboards.
5. Expenses (all fields, payments, edit history, soft delete), budgets, money due, repayments, views by side and by category.
6. Tasks, also purchase tasks that make expenses.
7. Stay (persons and days) and room assignment.
8. Gifts and shagun.
9. Later: photo gallery (simple albums for each event first), live stream (link only), day schedule, full vendor page, OTP login, automatic messages, more languages.

## 10. Decisions for the builder

The builder makes these decisions:
- Hosting providers. They must agree with the "fast first load" rule.
- Project structure, libraries, user interface kit and visual design. The design will get more work later.
- The details of the database: columns, names, indexes and migrations. The tables and rules in Section 8.1 must stay.
- The database tool for Node: Prisma or Drizzle are good examples.
- The CSV format, the start list of categories, and how to keep the expense split.
- The exact device limit (10 to 15). The number of incorrect attempts that causes a stop, and the length of the stop.
- The format of the RSVP link (for example, a short name of the couple).
- The test procedure.

## 11. Research notes (approximate values)

- **Nearest competitor:** Weddingkart (India). It sends WhatsApp invitations for many events and collects RSVPs. We do not know if it has expenses, task lists or roles for family organizers. The advantage of this app is that it has all of these functions together.
- **Message costs:**
  - The WhatsApp Business API in India costs approximately ₹0.12 (utility) to ₹0.9–1 (marketing) for each message.
  - SMS OTP in India needs DLT registration with an Indian business.
  - For these two reasons, the first version uses manual WhatsApp messages and the family search with the phone number check.
- **Live stream:** Show a YouTube or Facebook link. Do not build a stream system.
- **Photos:** Face search with cloud services is not expensive, but it causes privacy problems. Make simple albums first.
