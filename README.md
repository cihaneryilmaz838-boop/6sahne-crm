# 6sahne-crm

Offline/LAN CRM skeleton for 6Sahne Arts Center.

Tech stack (locked):
- Node.js + Express
- SQLite (WAL enabled)
- Server-rendered HTML + minimal vanilla JS

## Installation

1. Install Node.js 20+ on your Mac.
2. Clone this repository.
3. Install dependencies:

```bash
npm install
```

## Run on Mac

Start the server:

```bash
npm start
```

Then open:
- `http://localhost:3000/login`

## Authentication

- Real login is enabled with username + password from the `users` table.
- Passwords are stored as `password_hash` + `password_salt` using Node `crypto.scryptSync`.
- Roles are read from DB and normalized as uppercase `ADMIN | STAFF | PATRON`.
- Session user shape: `{ id, username, role }`.

### First-run admin bootstrap (development/default install)

If the `users` table is empty, migrations seed this default account:
- username: `admin`
- password: `admin1234`
- role: `ADMIN`

> ⚠️ Change this password immediately after first login using **Change Password** (`/account/password`).

## Dev helper

Quick role login for skeleton testing (development only):
- `GET /login-as/PATRON`
- `GET /login-as/STAFF`
- `GET /login-as/ADMIN`

## Manual smoke test

1. `npm start`
2. Open `http://localhost:3000/login`
3. Login with seeded admin (`admin` / `admin1234`)
4. Verify `/reports` is accessible
5. Use logout button and confirm redirect to `/login`

## Project Structure

```text
.
├── app.js
├── core/
│   ├── auth.js
│   ├── csrf.js
│   ├── password.js
│   ├── audit.js
│   └── errors.js
├── migrations/
├── modules/
└── views/
```

## Notes

- Global data policy: **No hard delete**. Use cancellation fields and audit logging.
- `audit_log` is initialized and available through `core/audit.js` for module actions.
