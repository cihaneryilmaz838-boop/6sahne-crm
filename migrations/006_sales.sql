CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  location_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  unit_price INTEGER NOT NULL CHECK(unit_price > 0),
  total_amount INTEGER NOT NULL CHECK(total_amount > 0),
  payment_method TEXT NOT NULL CHECK(payment_method IN ('CASH', 'TRANSFER', 'CARD')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by INTEGER,
  FOREIGN KEY(book_id) REFERENCES books(id),
  FOREIGN KEY(location_id) REFERENCES locations(id),
  FOREIGN KEY(created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_sales_book_id ON sales(book_id);
CREATE INDEX IF NOT EXISTS idx_sales_location_id ON sales(location_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
