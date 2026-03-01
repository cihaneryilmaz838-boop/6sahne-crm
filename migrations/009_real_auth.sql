ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN password_salt TEXT;
ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;

UPDATE users
SET role = UPPER(role)
WHERE role != UPPER(role);

UPDATE users
SET password_salt = '759f563718ac6f0e4c03593575239888',
    password_hash = 'c75247cf4456c775ea837c8795ea6903633b98cec98362132282d6c3192f7bd8fbc5ef042840078e95fda8dece3efbb4fa4503a21a2cfb0c098b63489716014e'
WHERE username = 'admin' AND (password_hash IS NULL OR password_salt IS NULL);

UPDATE users
SET password_salt = '759f563718ac6f0e4c03593575239888',
    password_hash = 'c75247cf4456c775ea837c8795ea6903633b98cec98362132282d6c3192f7bd8fbc5ef042840078e95fda8dece3efbb4fa4503a21a2cfb0c098b63489716014e'
WHERE (password_hash IS NULL OR password_salt IS NULL);

INSERT INTO users (username, role, password_hash, password_salt, is_active)
SELECT 'admin', 'ADMIN',
  'c75247cf4456c775ea837c8795ea6903633b98cec98362132282d6c3192f7bd8fbc5ef042840078e95fda8dece3efbb4fa4503a21a2cfb0c098b63489716014e',
  '759f563718ac6f0e4c03593575239888',
  1
WHERE NOT EXISTS (SELECT 1 FROM users);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users(username);
