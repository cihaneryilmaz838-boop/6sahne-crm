const path = require('path');
const Database = require('better-sqlite3');
const { runMigrations } = require('./migrate');

const dbFile = path.join(__dirname, '..', 'crm.sqlite');
const migrationsDir = path.join(__dirname, '..', 'migrations');

const db = new Database(dbFile);
db.pragma('foreign_keys = ON');

runMigrations(db, migrationsDir);

module.exports = db;
