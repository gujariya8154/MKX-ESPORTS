const Database = require("better-sqlite3");

const db = new Database("mkx_esports.db");

// Create registrations table if it does not exist
db.exec(`
    CREATE TABLE IF NOT EXISTS registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registration_id TEXT UNIQUE NOT NULL,

        team_name TEXT NOT NULL,

        captain_name TEXT NOT NULL,
        captain_mobile TEXT NOT NULL,
        captain_email TEXT,

        player1_name TEXT NOT NULL,
        player1_ign TEXT NOT NULL,
        player1_uid TEXT NOT NULL,

        player2_name TEXT NOT NULL,
        player2_ign TEXT NOT NULL,
        player2_uid TEXT NOT NULL,

        player3_name TEXT NOT NULL,
        player3_ign TEXT NOT NULL,
        player3_uid TEXT NOT NULL,

        player4_name TEXT NOT NULL,
        player4_ign TEXT NOT NULL,
        player4_uid TEXT NOT NULL,

        status TEXT DEFAULT 'Pending',

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

console.log("MKX ESPORTS database ready! ⚡");

// IMPORTANT:
// Do NOT close the database here.
// server.js needs to keep using this connection.

module.exports = db;