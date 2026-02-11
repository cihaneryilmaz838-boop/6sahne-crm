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
- `http://localhost:3000`

Quick role login for skeleton testing:
- `GET /login-as/Patron`
- `GET /login-as/Staff`
- `GET /login-as/Admin`

Module endpoints are mounted but intentionally return `Not implemented yet`.

## Project Structure

```text
.
├── app.js                  # Express bootstrap, sessions, role middleware, module loading
├── db.js                   # SQLite connection, WAL, base schema init
├── core/
│   ├── auth.js             # Authentication + role guard middleware
│   ├── audit.js            # Shared audit logging helper for all modules
│   └── errors.js           # Central error types and handlers
├── modules/
│   ├── finance/
│   ├── students/
│   ├── books/
│   ├── inventory/
│   ├── sales/
│   └── reports/
│       ├── routes.js       # Placeholder router (501: Not implemented yet)
│       ├── service.js      # Placeholder business layer
│       ├── repo.js         # Placeholder data access layer
│       └── views/          # Server-rendered templates (empty skeleton)
└── crm-specification/      # Product and architecture specs
```

## Notes

- Global data policy: **No hard delete**. Use cancellation fields and audit logging.
- `audit_log` is initialized and available through `core/audit.js` for future module actions.
