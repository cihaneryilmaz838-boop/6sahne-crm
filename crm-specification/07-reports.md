# Reports

## Goal
Generate spreadsheet-like monthly tables for income and expense based on finance transactions.

## Inputs
- finance_transactions (non-cancelled)
- categories (hierarchical)

## Output tables
Two main tables:
1) Income report
2) Expense report

Format:
- Columns: months (Sep..Aug or user-selected year range)
- Rows: category hierarchy
  - show parent category totals (sum of children)
  - show child category rows
- Right-side: Total and Average columns

## Rules
- Cancelled finance tx excluded.
- Category totals computed from child rows.
- Patron role can only access reports (and maybe dashboard).

## Dashboard (optional MVP)
- current month income / expense / net
- top categories by spend
- payment method split
