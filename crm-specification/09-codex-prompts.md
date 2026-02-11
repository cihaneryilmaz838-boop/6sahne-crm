# Codex Prompt Pack (copy/paste prompts)

## How to run with Codex
1) Create a repo folder.
2) Paste these md files into /crm-specification.
3) In Codex chat, provide the relevant md files for the sprint and ask for code.

---

## Prompt: Sprint 0 (Skeleton)
You are implementing an offline LAN CRM for 6Sahne.
Tech locked: Node.js + Express, SQLite (WAL), server-rendered HTML + minimal JS.
Read:
- crm-specification/01-intro.md
- crm-specification/02-architecture.md
- crm-specification/03-roles-and-audit.md

Task:
Create the full project skeleton with:
- app.js (Express bootstrap)
- db.js (SQLite connection, WAL enabled, migrations runner or schema init)
- auth/session (cookie-based session)
- role middleware (Patron/Staff/Admin)
- audit logger helper + audit_log table
- cancellation fields convention
- folder structure: core/ and modules/ with placeholder routes/services/repos/views

Output:
- Provide complete file tree and code for each file.
- Keep business logic minimal (placeholders).
- Include a README with run instructions on Mac.

---

## Prompt: Sprint 1 (Finance)
Read:
- crm-specification/04-finance.md
- crm-specification/03-roles-and-audit.md

Task:
Implement categories + finance transaction ledger:
- DB tables + indexes
- Routes + views:
  - list with filters
  - create
  - cancel with mandatory reason
  - category admin management
- Audit log on create/cancel/update.

Output:
- Provide code files + SQL migrations.
- Include minimal CSS for readability.

---

## Prompt: Sprint 2 (Students)
Read:
- crm-specification/05-students.md
- crm-specification/04-finance.md
- crm-specification/03-roles-and-audit.md

Task:
Implement students module:
- student CRUD + search by name/phone
- payment plan entry at student creation:
  - total_fee, plan_type, manual due dates (N dates required for 2/3/4)
- student detail:
  - show plan summary, installment schedule with overdue flags
  - show linked payments (finance tx)
- add payment action:
  - creates finance IN tx
  - staff chooses category
  - link to student

Output:
- code + DB schema/migrations
- include domain functions for balance + overdue

---

## Prompt: Sprint 3 (Books + Inventory)
Read:
- crm-specification/06-books-inventory-sales.md
- crm-specification/03-roles-and-audit.md

Task:
Implement:
- book CRUD
- location CRUD
- inventory movements: purchase, transfer, adjust
- stock views per book and per location
- prevent negative stock on transfer

---

## Prompt: Sprint 4 (Sales)
Read:
- crm-specification/06-books-inventory-sales.md
- crm-specification/04-finance.md
- crm-specification/03-roles-and-audit.md

Task:
Implement sales:
- create sale with multiple items, per-item discount
- on finalize: create inventory SALE_OUT for each item, create finance IN for total
- staff selects finance category
- cancel sale (reason required): cancel sale + its generated records, audit everything

---

## Prompt: Sprint 5 (Reports)
Read:
- crm-specification/07-reports.md
- crm-specification/04-finance.md

Task:
Implement monthly income & expense tables:
- month columns + total/average
- hierarchical category rows with parent totals
- patron read-only access

---

## Prompt: Sprint 6 (Polish)
Task:
- export CSV
- better search UX
- recent activity widgets
- small UI improvements without adding heavy frameworks
