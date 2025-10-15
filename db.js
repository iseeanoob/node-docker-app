const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// database file stored in project directory
const dbPath = path.resolve(__dirname, 'database.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Database connection failed", err);
  } else {
    console.log("✅ Connected to SQLite database");
  }
});

// Example table (users)
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE
  )`);
});

module.exports = db;
