CREATE TABLE IF NOT EXISTS locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS inventory_stock (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  location_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity >= 0),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(book_id) REFERENCES books(id),
  FOREIGN KEY(location_id) REFERENCES locations(id),
  UNIQUE(book_id, location_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_stock_book_id ON inventory_stock(book_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_location_id ON inventory_stock(location_id);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  from_location_id INTEGER,
  to_location_id INTEGER,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by INTEGER,
  FOREIGN KEY(book_id) REFERENCES books(id),
  FOREIGN KEY(from_location_id) REFERENCES locations(id),
  FOREIGN KEY(to_location_id) REFERENCES locations(id),
  FOREIGN KEY(created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_book_id ON inventory_movements(book_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_from_location_id ON inventory_movements(from_location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_to_location_id ON inventory_movements(to_location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements(created_at);
