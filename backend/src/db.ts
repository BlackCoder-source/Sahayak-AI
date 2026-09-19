const sqlite3 = require('sqlite3')
const { open } = require('sqlite')

async function initDb() {
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  })

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS saved_schemes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      scheme_id INTEGER,
      scheme_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `)

  return db
}

module.exports = { initDb }
