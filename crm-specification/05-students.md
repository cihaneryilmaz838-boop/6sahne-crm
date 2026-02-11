# Students Module

## Student record (grouped)
A) Student
- full_name (required)
- birth_date (optional)
- school (optional)
- status: ACTIVE | INACTIVE
- first_registration_date (required)

B) Guardians / Contact
- guardian1_name, guardian1_phone (required phone)
- guardian2_name, guardian2_phone (optional)
- invoice_address (optional)
- contact_preference (optional): WHATSAPP | CALL

C) Courses / Enrollment (MVP)
- student can be linked to multiple course tags (drama/oyunculuk/yaratıcılık etc.)
- store as join table or json; prefer join for querying

D) Operational notes
- talent_notes (optional)
- sports (optional)
- allergy_notes (optional, important)
- health_notes (optional, important)
- meal_preference (optional)

## Payment plan (locked)
Plan types:
- CASH (Peşin)
- INST_2 (2 taksit)
- INST_3 (3 taksit)
- INST_4 (4 taksit)

We support "pay later" (student can owe money).

### Plan creation (Option A - locked)
When creating student (or immediately after), Staff enters:
- total_fee (required)
- plan_type (required)
- installment_due_dates: Staff manually enters each due date (DATE input)
  - For Peşin: 0 or 1 date depending on UX; simplest: no schedule, just total_fee due immediately
  - For 2/3/4 taksit: require exactly N due dates

### Payments
Staff records payments over time:
- payment creates a FINANCE transaction (direction IN)
- Staff chooses category manually (locked)
- transaction references student (ref_type='student', ref_id=student_id)

### Balance computation (domain rule)
- Expected debt = total_fee
- Paid = sum of non-cancelled linked finance IN transactions for that student
- Remaining = debt - paid
- Overpayment allowed? (default: allow but show warning)

### Overdue installments
Using due_dates and payment totals, compute:
- which installments are overdue as of today
Simple approach:
- sort due_dates
- distribute paid amount sequentially against installments
- any due_date in past with unpaid portion => overdue

## Screens
- Student list (search by name or phone)
- Student detail:
  - profile/contact/courses/notes
  - plan summary: total, paid, remaining
  - installment schedule with overdue indicators
  - payment history (linked finance tx list)
- Add payment (creates finance tx)
- Cancel payment (cancel finance tx with reason)
