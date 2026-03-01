# 6sahne-crm

Offline/LAN CRM for 6Sahne Arts Center.

Tech stack:
- Node.js + Express
- SQLite (WAL enabled)
- Server-rendered EJS views + minimal vanilla JS/CSS

## Module status

All core modules are implemented and connected:
- **Finance**: ledger, filtering, cancellation, categories (admin).
- **Students**: student records, payment plans, payment history, overdue visibility.
- **Books**: book catalog CRUD with active/inactive support.
- **Inventory**: locations, stock view, stock move, stock adjust.
- **Sales**: sales creation, list, cancellation with reason.
- **Reports**: dashboard/report page for finance, students, stock and recent sales.

## How to run (Mac)

1. Install Node.js 20+
2. Open Terminal in repo root.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start app:
   ```bash
   npm start
   ```
5. Open `http://localhost:3000/login`

## How to run (Windows)

1. Install Node.js 20+
2. Open **PowerShell** in repo root.
3. Install dependencies:
   ```powershell
   npm install
   ```
4. Start app:
   ```powershell
   npm start
   ```
5. Open `http://localhost:3000/login`

## Default admin credentials (first run)

If `users` table is empty, migrations seed:
- username: `admin`
- password: `admin1234`
- role: `ADMIN`

> Change this password immediately after first login from **Change Password** (`/account/password`).

## Authentication notes

- Login uses `users` table credentials (`password_hash` + `password_salt`, Node `crypto.scryptSync`).
- Roles are normalized to uppercase: `ADMIN | STAFF | PATRON`.
- Session user payload: `{ id, username, role }`.
- Dev-only helper exists: `/login-as/PATRON|STAFF|ADMIN` (disabled in production).

## Data policy and cancellation rules

- **No hard delete policy**: records are not physically removed.
- Finance cancellations set cancellation fields and keep history visible.
- Sales cancellation marks sale and related records as cancelled with a reason.
- Audit logging is available via `core/audit.js`.

## Manual smoke test

1. `npm start`
2. Open `http://localhost:3000/login`
3. Login with seeded admin
4. Confirm dashboard (`/`) and reports (`/reports`) open
5. Use logout and verify redirect to `/login`

## Project structure

```text
.
├── app.js
├── core/
├── migrations/
├── modules/
├── public/
└── views/
```
