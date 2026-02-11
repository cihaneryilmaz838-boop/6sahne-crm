# Books + Inventory + Sales

## Book "Card" (stable identity)
- id
- title (required)
- author (optional)
- publisher (optional)
- group_code (optional)  # internal class/group categorization
- is_active

## Locations
Track stock in locations (depo/raf).
- id
- code (required, unique) e.g. DEP-1, RAF-3B
- name (required)
- is_active

## Inventory Transactions (stock movements)
Stock is NOT stored as a single number field; it is derived from movements.

Types:
- PURCHASE_IN: adds qty to a location
  - fields: book_id, location_id, qty, unit_cost, date, note
- TRANSFER: moves qty from one location to another
  - fields: book_id, from_location_id, to_location_id, qty, date, note
- SALE_OUT: removes qty from a location
  - fields: book_id, location_id, qty, unit_price, discount_amount or discount_pct, date, note, sale_id
- ADJUST: +/- correction with reason
  - fields: book_id, location_id, qty_delta (+/-), date, reason, note

Cancellation applies to inventory_tx too:
- cancelling a movement should restore derived stock to previous state (because queries ignore cancelled rows)

## Sales (bulk supported)
A Sale is a receipt-like entity:
- sale header:
  - id, date, payment_method (CASH/TRANSFER/CARD), note, total_amount, discount_total (optional)
- sale items (multiple):
  - book_id, qty, location_id, unit_price, discount (optional per item)

When completing a sale:
- create SALE_OUT inventory tx per item (link with sale_id)
- create one FINANCE IN transaction for the net total
  - Staff chooses finance category manually (locked)
  - link finance tx to sale via ref_type='sale', ref_id=sale_id

## Rules
- No returns/exchanges.
- Prevent negative stock: cannot sell more than available in selected location.
- Transfer cannot move more than available in from_location.
