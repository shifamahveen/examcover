const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.sqlite');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    reset_token TEXT
  )`);
});

module.exports = db;