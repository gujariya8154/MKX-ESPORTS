const express = require("express");
const crypto = require("crypto");
const db = require("./database");

const app = express();

/* =====================================================
   SERVER
===================================================== */

const PORT = process.env.PORT || 3000;


/* =====================================================
   ADMIN LOGIN
===================================================== */

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;


/* =====================================================
   TOURNAMENT SETTINGS
===================================================== */

const TOURNAMENT_ID = "GT-S01";
const MAX_SEATS = 48;


/* =====================================================
   MIDDLEWARE
===================================================== */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));


/* =====================================================
   HOME
===================================================== */

app.get("/", (req, res) => {

    res.sendFile(
        __dirname + "/public/index.html"
    );

});


/* =====================================================
   REGISTER SOLO PLAYER
===================================================== */

app.post("/register", (req, res) => {

    try {

        const {
            playerName,
            playerIgn,
            playerUid,
            mobile,
            email
        } = req.body;


        /* =============================================
           CLEAN INPUT
        ============================================= */

        const cleanPlayerName =
            String(playerName || "").trim();

        const cleanPlayerIgn =
            String(playerIgn || "").trim();

        const cleanPlayerUid =
            String(playerUid || "").trim();

        const cleanMobile =
            String(mobile || "").trim();

        const cleanEmail =
            String(email || "").trim();


        /* =============================================
           REQUIRED FIELDS
        ============================================= */

        if (
            !cleanPlayerName ||
            !cleanPlayerIgn ||
            !cleanPlayerUid ||
            !cleanMobile
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please fill all required fields."

            });

        }


        /* =============================================
           NAME VALIDATION
        ============================================= */

        if (cleanPlayerName.length < 2) {

            return res.status(400).json({

                success: false,

                message:
                    "Player name must contain at least 2 characters."

            });

        }


        /* =============================================
           IGN VALIDATION
        ============================================= */

        if (cleanPlayerIgn.length < 2) {

            return res.status(400).json({

                success: false,

                message:
                    "Free Fire IGN must contain at least 2 characters."

            });

        }


        /* =============================================
           MOBILE VALIDATION
        ============================================= */

        if (!/^[0-9]{10}$/.test(cleanMobile)) {

            return res.status(400).json({

                success: false,

                message:
                    "Mobile number must contain exactly 10 digits."

            });

        }


        /* =============================================
           UID VALIDATION
        ============================================= */

        if (!/^[0-9]{1,15}$/.test(cleanPlayerUid)) {

            return res.status(400).json({

                success: false,

                message:
                    "Free Fire UID must contain 1 to 15 digits."

            });

        }


        /* =============================================
           EMAIL VALIDATION
           Only validate when provided
        ============================================= */

        if (
            cleanEmail &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please enter a valid email address."

            });

        }


        /* =============================================
           CHECK AVAILABLE SEATS
        ============================================= */

        const seatCount = db
            .prepare(`
                SELECT COUNT(*) AS total
                FROM registrations
                WHERE tournament_id = ?
                AND status != 'Rejected'
            `)
            .get(TOURNAMENT_ID);


        if (seatCount.total >= MAX_SEATS) {

            return res.status(409).json({

                success: false,

                message:
                    "All 48 tournament seats are already filled."

            });

        }


        /* =============================================
           DUPLICATE UID CHECK
        ============================================= */

        const existingUID = db
            .prepare(`
                SELECT registration_id
                FROM registrations
                WHERE tournament_id = ?
                AND player_uid = ?
                LIMIT 1
            `)
            .get(
                TOURNAMENT_ID,
                cleanPlayerUid
            );


        if (existingUID) {

            return res.status(409).json({

                success: false,

                message:
                    "This Free Fire UID is already registered."

            });

        }


        /* =============================================
           REGISTRATION ID
        ============================================= */

        let registrationId;

        let exists = true;


        while (exists) {

            registrationId =
                "MKX-" +
                crypto
                    .randomBytes(4)
                    .toString("hex")
                    .toUpperCase();


            const check = db
                .prepare(`
                    SELECT id
                    FROM registrations
                    WHERE registration_id = ?
                `)
                .get(registrationId);


            exists = !!check;

        }


        /* =============================================
           INSERT
        ============================================= */

        const insert = db.prepare(`

            INSERT INTO registrations (

                registration_id,

                tournament_id,

                player_name,

                player_ign,

                player_uid,

                mobile,

                email,

                status

            )

            VALUES (

                @registration_id,

                @tournament_id,

                @player_name,

                @player_ign,

                @player_uid,

                @mobile,

                @email,

                'Pending'

            )

        `);


        insert.run({

            registration_id:
                registrationId,

            tournament_id:
                TOURNAMENT_ID,

            player_name:
                cleanPlayerName,

            player_ign:
                cleanPlayerIgn,

            player_uid:
                cleanPlayerUid,

            mobile:
                cleanMobile,

            email:
                cleanEmail || null

        });


        /* =============================================
           SUCCESS
        ============================================= */

        return res.json({

            success: true,

            registrationId:
                registrationId,

            message:
                "Registration successful."

        });

    }


    /* =============================================
       ERROR
    ============================================= */

    catch (error) {

        console.error(
            "Registration Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Registration failed. Please try again."

        });

    }

});


/* =====================================================
   TRACK REGISTRATION
===================================================== */

app.get(
    "/track/:registrationId",
    (req, res) => {

        try {

            const registrationId =
                String(
                    req.params.registrationId || ""
                ).trim();


            if (!registrationId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Registration ID is required."

                });

            }


            const registration =
                db.prepare(`

                    SELECT

                        registration_id,

                        player_name,

                        player_ign,

                        tournament_id,

                        status,

                        created_at

                    FROM registrations

                    WHERE registration_id = ?

                `).get(registrationId);


            if (!registration) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Registration not found."

                });

            }


            return res.json({

                success: true,

                registration:
                    registration

            });

        }


        catch (error) {

            console.error(
                "Track Error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to find registration."

            });

        }

    }
);


/* =====================================================
   GET AVAILABLE SEATS
===================================================== */

app.get(
    "/tournament/GT-S01",
    (req, res) => {

        try {

            const result =
                db.prepare(`

                    SELECT COUNT(*) AS total

                    FROM registrations

                    WHERE tournament_id = ?

                    AND status != 'Rejected'

                `).get(TOURNAMENT_ID);


            const registered =
                result.total;

            const available =
                Math.max(
                    MAX_SEATS - registered,
                    0
                );


            return res.json({

                success: true,

                tournament: {

                    id:
                        TOURNAMENT_ID,

                    name:
                        "GT TOURNAMENT — SEASON 01",

                    game:
                        "Free Fire",

                    mode:
                        "Solo",

                    maxSeats:
                        MAX_SEATS,

                    registered:
                        registered,

                    available:
                        available

                }

            });

        }


        catch (error) {

            console.error(
                "Tournament Error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to load tournament information."

            });

        }

    }
);


/* =====================================================
   ADMIN - ALL REGISTRATIONS
===================================================== */

app.get(
    "/admin/registrations",
    (req, res) => {

        try {

            const registrations =
                db.prepare(`

                    SELECT

                        registration_id,

                        player_name,

                        player_ign,

                        player_uid,

                        mobile,

                        email,

                        status,

                        created_at,

                        updated_at

                    FROM registrations

                    WHERE tournament_id = ?

                    ORDER BY id DESC

                `).all(
                    TOURNAMENT_ID
                );


            return res.json({

                success: true,

                registrations:
                    registrations

            });

        }


        catch (error) {

            console.error(
                "Admin Registration Error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to load registrations."

            });

        }

    }
);


/* =====================================================
   ADMIN - FULL REGISTRATION DETAILS
===================================================== */

app.get(
    "/admin/registration/:registrationId",
    (req, res) => {

        try {

            const registrationId =
                String(
                    req.params.registrationId || ""
                ).trim();


            const registration =
                db.prepare(`

                    SELECT *

                    FROM registrations

                    WHERE registration_id = ?

                    AND tournament_id = ?

                `).get(

                    registrationId,

                    TOURNAMENT_ID

                );


            if (!registration) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Registration not found."

                });

            }


            return res.json({

                success: true,

                registration:
                    registration

            });

        }


        catch (error) {

            console.error(
                "Admin Details Error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to load registration details."

            });

        }

    }
);


/* =====================================================
   ADMIN - UPDATE STATUS
===================================================== */

app.post(
    "/admin/registration/status",
    (req, res) => {

        try {

            const {
                registrationId,
                status
            } = req.body;


            const allowedStatuses = [

                "Pending",

                "Under Review",

                "Approved",

                "Rejected",

                "Waitlisted"

            ];


            if (
                !registrationId ||
                !allowedStatuses.includes(status)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid registration ID or status."

                });

            }


            const result =
                db.prepare(`

                    UPDATE registrations

                    SET

                        status = ?,

                        updated_at =
                            CURRENT_TIMESTAMP

                    WHERE registration_id = ?

                    AND tournament_id = ?

                `).run(

                    status,

                    registrationId,

                    TOURNAMENT_ID

                );


            if (result.changes === 0) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Registration not found."

                });

            }


            return res.json({

                success: true,

                message:
                    "Registration status updated successfully."

            });

        }


        catch (error) {

            console.error(
                "Status Update Error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to update registration status."

            });

        }

    }
);


/* =====================================================
   ADMIN LOGIN
===================================================== */

app.post(
    "/admin/login",
    (req, res) => {

        const {
            username,
            password
        } = req.body;


        if (
            ADMIN_USERNAME &&
            ADMIN_PASSWORD &&
            username === ADMIN_USERNAME &&
            password === ADMIN_PASSWORD
        ) {

            return res.json({

                success: true

            });

        }


        return res.status(401).json({

            success: false,

            message:
                "Invalid username or password."

        });

    }
);


/* =====================================================
   START SERVER
===================================================== */

app.listen(
    PORT,
    () => {

        console.log(
            `MKX ESPORTS server running on port ${PORT}`
        );

    }
);