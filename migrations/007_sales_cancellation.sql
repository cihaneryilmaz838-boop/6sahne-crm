ALTER TABLE sales ADD COLUMN is_cancelled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sales ADD COLUMN cancelled_at TEXT;
ALTER TABLE sales ADD COLUMN cancelled_by INTEGER REFERENCES users(id);
ALTER TABLE sales ADD COLUMN cancel_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_sales_is_cancelled ON sales(is_cancelled);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_book_id ON sales(book_id);
CREATE INDEX IF NOT EXISTS idx_sales_location_id ON sales(location_id);
