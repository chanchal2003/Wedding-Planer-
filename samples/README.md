# Sample guest files (fake data only)

All names, cities and numbers in these files are invented. There is no real guest in this project.
The files are made by `npm run samples` (the script is `scripts/make-sample-guest-files.ts`). The seed is
fixed, so you get exactly the same files every time.

| File | What it is |
|---|---|
| `guests-clean-500.xlsx` | 500 families with no mistakes. 10 families have no number (only a warning). About 27% have a second number. Numbers are written in four different ways on purpose. Row 252 is the "Sharma family" (98765 11111): if you added that family by hand, the import says "499 new families, 1 already in the app". |
| `guests-messy.xlsx` | 28 rows. 10 are good, the others have deliberate mistakes (see below). |

## Before you import them, make this in the app

1. A wedding with these **5 events** (the names must be exactly like this): Haldi, Mehendi, Sangeet, Wedding, Reception.
2. Two team members (they can stay "pending"): **Rohan** with the email `rohan@example.com` and **Ankit** with the email `ankit@example.com`.
3. Add **one family by hand**: "Sharma family", main number `98765 11111`, Groom's side, with any event. The messy file has a family with the same number (an error), and the clean file has the Sharma family itself (skipped as "already in the app").

## What the messy file contains

| Mistake | Row (family name) | What the import should say |
|---|---|---|
| A number used by another family | Gupta family (98765 11111) | Error: the number is used by the Sharma family |
| The same number twice in the file | the two Verma families | Error on both rows |
| No family name | two rows with an empty name | Error |
| No event with yes | Nair family, Iyer family | Error |
| A number in a wrong format | Bose (98765 1111), Das (hello), Rao (12345) | Error: "This is not a valid phone number" |
| A second number with no main number | Menon family | Error |
| The same number as main and second | Pillai family | Error |
| An organizer who is not on the team | Kapoor family (stranger@example.com) | Error |
| An organizer written as a name | Khanna family ("Rohan") | Error: use their email |
| A side that is not allowed | Saxena family ("middle") | Error |
| An empty side | Bhatt family | Warning: goes to Both sides |
| No number at all | Joshi family | Warning only |
| A column that is not an event of the wedding | the column "Mehndi" | Error for the whole file |

Import order for the practice (step 6.5): first the messy file, see all the errors, correct the file, and save it. Then the clean file (the Sharma family is skipped, because it is in the app already).
