const Database = require("better-sqlite3");

const db = new Database("mkx_esports.db");

/*
====================================================
MKX ESPORTS DATABASE
GT TOURNAMENT — SEASON 01
SOLO REGISTRATION
====================================================
*/


/* ================= DATABASE SETTINGS ================= */

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");


/* ================= CHECK OLD TABLE ================= */

const tableExists = db
    .prepare(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
        AND name = 'registrations'
    `)
    .get();


/*
If old registrations table exists, check whether
it is the old 4-player/team structure.
*/

if (tableExists) {

    const columns = db
        .prepare(`
            PRAGMA table_info(registrations)
        `)
        .all();

    const columnNames =
        columns.map(column => column.name);


    const isOldTeamDatabase =
        columnNames.includes("team_name") ||
        columnNames.includes("player1_name") ||
        columnNames.includes("player2_name") ||
        columnNames.includes("player3_name") ||
        columnNames.includes("player4_name");


    if (isOldTeamDatabase) {

        console.log(
            "Old team registration database detected."
        );


        /*
        Keep old data as backup instead of deleting it.
        */

        const oldBackupExists = db
            .prepare(`
                SELECT name
                FROM sqlite_master
                WHERE type = 'table'
                AND name = 'registrations_old'
            `)
            .get();


        if (!oldBackupExists) {

            db.exec(`
                ALTER TABLE registrations
                RENAME TO registrations_old
            `);

            console.log(
                "Old registrations backed up as registrations_old."
            );

        } else {

            /*
            If backup already exists, remove the old
            registrations table so a fresh Solo table
            can be created.
            */

            db.exec(`
                DROP TABLE registrations
            `);

        }

    }

}


/* ================= SOLO REGISTRATIONS ================= */

db.exec(`
    CREATE TABLE IF NOT EXISTS registrations (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        registration_id TEXT UNIQUE NOT NULL,

        tournament_id TEXT NOT NULL DEFAULT 'GT-S01',

        player_name TEXT NOT NULL,

        player_ign TEXT NOT NULL,

        player_uid TEXT NOT NULL,

        mobile TEXT NOT NULL,

        email TEXT,

        status TEXT NOT NULL DEFAULT 'Pending',

        admin_note TEXT,

        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
`);


/* ================= INDEXES ================= */

/*
Registration ID search
*/

db.exec(`
    CREATE INDEX IF NOT EXISTS
    idx_registration_id
    ON registrations(registration_id)
`);


/*
UID search / duplicate checking
*/

db.exec(`
    CREATE INDEX IF NOT EXISTS
    idx_player_uid
    ON registrations(player_uid)
`);


/*
Status filtering in Admin Dashboard
*/

db.exec(`
    CREATE INDEX IF NOT EXISTS
    idx_status
    ON registrations(status)
`);


/*
Tournament filtering
*/

db.exec(`
    CREATE INDEX IF NOT EXISTS
    idx_tournament_id
    ON registrations(tournament_id)
`);


/* ================= DATABASE READY ================= */

console.log("====================================");
console.log("MKX ESPORTS database ready! ⚡");
console.log("Tournament : GT TOURNAMENT — SEASON 01");
console.log("Mode       : SOLO");
console.log("Players    : 1 per registration");
console.log("Capacity   : 48 seats");
console.log("====================================");


/* ================= EXPORT ================= */

module.exports = db;