# Roles & Audit

## Roles
- Patron: read-only, reports/dashboard only.
- Staff: daily operations; can create/edit records and CAN cancel records with mandatory reason.
- Admin: full access, manage categories and system settings.

Role enforcement:
- Patron cannot create/update/cancel anything.

## Cancellation policy (no delete)
For cancelable entities (finance_tx, sale, stock_tx, etc):
- is_cancelled boolean
- cancelled_at datetime
- cancelled_by user_id
- cancel_reason text (required)
Cancelled records should not affect reports/stock/balances.

## Audit logging (mandatory)
An audit_log record must be written for:
- CREATE, UPDATE, CANCEL actions
- on: finance_tx, student, stock_tx, sale, category, location

Audit fields (suggested):
- id
- action_type (CREATE/UPDATE/CANCEL)
- actor_user_id
- entity_type
- entity_id
- reason (for cancel; optional for others)
- payload_json (diff or snapshot)
- created_at

## Staff cancellation: allowed
Staff can cancel without Admin approval, but cancel_reason is required and must be saved + audited.
