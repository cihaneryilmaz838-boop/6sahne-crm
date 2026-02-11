# Architecture (stack-specific but implementation-agnostic)

## Module layout
Use modular structure:
- core/ (db, auth, validation, errors, audit)
- modules/
  - finance/
  - students/
  - books/
  - inventory/
  - sales/
  - reports/

Each module should have:
- routes.js (Express router)
- service.js (business rules)
- repo.js (DB access)
- views/ (server templates)

## Data style
- No hard delete.
- Use cancellation (soft cancel) with mandatory reason and audit logging.
- Reports are derived by aggregating transactions.

## Reference linking
Many records may reference another entity:
- ref_type: 'student' | 'sale' | 'stock_tx' | 'manual' etc.
- ref_id: integer id

This enables:
- student payments to link to student
- sales to link to finance tx
- stock movements to link to purchases/sales

## UI style
- Minimal, fast, form-heavy UI.
- Must work on mobile browsers.
- Navigation: Students / Books / Finance / Reports.
