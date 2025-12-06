import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('sensorDatabase.db');

db.execSync(`
  CREATE TABLE IF NOT EXISTS sensor_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    glucose REAL NOT NULL,
    timestamp DATETIME,
    user_id TEXT,
    device_id TEXT,
    device_model TEXT,
    os_version TEXT,
    is_duplicate INTEGER DEFAULT 0,
    synced INTEGER DEFAULT 0
  );
  PRAGMA journal_mode=WAL;
`);

export default db;
