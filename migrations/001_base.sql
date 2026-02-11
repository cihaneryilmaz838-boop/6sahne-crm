CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK(role IN ('PATRON', 'STAFF', 'ADMIN')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action_type TEXT NOT NULL CHECK(action_type IN ('CREATE', 'UPDATE', 'CANCEL')),
  actor_user_id INTEGER,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  reason TEXT,
  payload_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(actor_user_id) REFERENCES users(id)
);

INSERT OR IGNORE INTO users (id, username, role) VALUES
  (1, 'admin', 'ADMIN'),
  (2, 'staff', 'STAFF'),
  (3, 'patron', 'PATRON');
