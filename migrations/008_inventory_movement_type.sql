ALTER TABLE inventory_movements
ADD COLUMN movement_type TEXT NOT NULL DEFAULT 'MOVE';

CREATE INDEX IF NOT EXISTS idx_inventory_movements_movement_type
ON inventory_movements(movement_type);
