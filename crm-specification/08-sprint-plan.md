# Sprint Plan (Implementation Order)

Sprint 0: Project skeleton
- app bootstrap, routing, db init, sessions, roles
- audit log infra
- cancellation standard

Sprint 1: Finance core
- categories (admin)
- finance tx CRUD + cancel
- filtering

Sprint 2: Students
- student CRUD + search
- payment plan: total_fee + plan_type + manual due dates
- student payments create finance tx
- balance + overdue computation

Sprint 3: Books + Inventory
- book CRUD
- location CRUD
- inventory tx: purchase, transfer, adjust
- stock view (by book, by location)

Sprint 4: Sales
- sale create (multi-item) + discounts
- sale => inventory out + finance in
- cancel sale => cancel related records with reason + audit

Sprint 5: Reports
- income & expense monthly tables matching spreadsheet look

Sprint 6: usability polish
- faster search, recent activity, export CSV
