# 6Sahne CRM - Intro

## Goal
Build an offline/LAN CRM for 6Sahne (arts center) running on a Mac server. Clients access via browser on same network.

Core domains:
1) Students (CRM)
2) Books inventory + sales (location-based stock)
3) Finance (income/expense ledger + monthly summary like existing spreadsheets)

Key design: data entry is transaction-based; monthly spreadsheet-like tables are generated reports.

## Tech decisions (locked)
- Node.js + Express
- SQLite (WAL enabled)
- Server-rendered HTML + minimal vanilla JS

## Non-goals
- No internet dependency
- No book returns/exchanges
- No Admin approval needed for cancellations (but reason + log is mandatory)

## Language
UI labels and content in Turkish.
