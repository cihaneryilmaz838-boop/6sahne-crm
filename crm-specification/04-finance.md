# Finance Module (Ledger)

## Purpose
Track all money movements as transactions and generate monthly summary tables like existing spreadsheets.

## Finance Transaction fields
- id
- direction: IN | OUT
- amount (integer cents or numeric; choose a consistent approach)
- currency: default TRY
- date: transaction date (user-entered)
- category_id (required)
- payment_method: CASH | TRANSFER | CARD (required)
- note (optional)
- ref_type (optional)
- ref_id (optional)
- cancellation fields + created_at/by, updated_at/by

## Categories
We will import existing spreadsheet category hierarchy (income & expense):
- Categories are hierarchical (parent_id nullable)
- Each category belongs to a side: IN or OUT (or a 'kind' field)
- Admin can create/edit categories, but never hard delete (archive/cancel if needed)

## Screens
- Finance list: filter by date range, direction, category, payment_method, include/exclude cancelled
- Create transaction
- Cancel transaction (reason required)
- Category management (Admin): tree view (simple list ok for MVP)

## Rules
- Cancelled finance tx must not affect reports.
- Staff chooses category manually (locked decision).
