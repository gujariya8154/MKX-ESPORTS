const express = require("express");
const crypto = require("crypto");
const db = require("./database");

const app = express();

// Hosting par PORT automatically male, local ma 3000 use thase
const PORT = process.env.PORT || 3000;

// =========================
// ADMIN LOGIN DETAILS
// =========================

// IMPORTANT:
// Aa credentials public GitHub ma mukva nahi.
// Proper deployment pela environment variables use karishu.
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "mkxadmin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "MKX@Admin2026";

// =========================
// MIDDLEWARE
// =========================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));

// =========================
// HOME
// =========================

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

// =========================
// TEAM REGISTRATION
// =========================

app.post("/register", (req, res) => {

    try {

        const {
            teamName,
            captainName,
            captainMobile,
            captainEmail,

            player1Name,
            player1Ign,
            player1Uid,

            player2Name,
            player2Ign,
            player2Uid,

            player3Name,
            player3Ign,
            player3Uid,

            player4Name,
            player4Ign,
            player4Uid
        } = req.body;


        // =========================
        // REQUIRED FIELD VALIDATION
        // =========================

        if (
            !teamName ||
            !captainName ||
            !captainMobile ||

            !player1Name ||
            !player1Ign ||
            !player1Uid ||

            !player2Name ||
            !player2Ign ||
            !player2Uid ||

            !player3Name ||
            !player3Ign ||
            !player3Uid ||

            !player4Name ||
            !player4Ign ||
            !player4Uid
        ) {

            return res.status(400).json({
                success: false,
                message: "Please fill all required fields."
            });

        }


        // =========================
        // MOBILE VALIDATION
        // EXACTLY 10 NUMBERS
        // =========================

        if (!/^[0-9]{10}$/.test(String(captainMobile))) {

            return res.status(400).json({
                success: false,
                message: "Captain mobile number must contain exactly 10 digits."
            });

        }


        // =========================
        // UID VALIDATION
        // 1 TO 15 DIGITS
        // =========================

        const playerUIDs = [
            player1Uid,
            player2Uid,
            player3Uid,
            player4Uid
        ];

        for (let i = 0; i < playerUIDs.length; i++) {

            if (!/^[0-9]{1,15}$/.test(String(playerUIDs[i]))) {

                return res.status(400).json({
                    success: false,
                    message: `Player ${i + 1} UID must contain 1 to 15 digits only.`
                });

            }

        }


        // =========================
        // DUPLICATE UID CHECK
        // SAME TEAM
        // =========================

        const uniqueUIDs = new Set(
            playerUIDs.map(uid => String(uid))
        );

        if (uniqueUIDs.size !== playerUIDs.length) {

            return res.status(400).json({
                success: false,
                message: "Player UIDs must be different."
            });

        }


        // =========================
        // REGISTRATION ID
        // =========================

        const registrationId =
            "MKX-" +
            crypto.randomBytes(4).toString("hex").toUpperCase();


        // =========================
        // INSERT REGISTRATION
        // =========================

        const insert = db.prepare(`

            INSERT INTO registrations (

                registration_id,
                team_name,

                captain_name,
                captain_mobile,
                captain_email,

                player1_name,
                player1_ign,
                player1_uid,

                player2_name,
                player2_ign,
                player2_uid,

                player3_name,
                player3_ign,
                player3_uid,

                player4_name,
                player4_ign,
                player4_uid

            )

            VALUES (

                @registration_id,
                @team_name,

                @captain_name,
                @captain_mobile,
                @captain_email,

                @player1_name,
                @player1_ign,
                @player1_uid,

                @player2_name,
                @player2_ign,
                @player2_uid,

                @player3_name,
                @player3_ign,
                @player3_uid,

                @player4_name,
                @player4_ign,
                @player4_uid

            )

        `);


        insert.run({

            registration_id: registrationId,

            team_name: teamName.trim(),

            captain_name: captainName.trim(),
            captain_mobile: String(captainMobile),
            captain_email: captainEmail
                ? captainEmail.trim()
                : null,

            player1_name: player1Name.trim(),
            player1_ign: player1Ign.trim(),
            player1_uid: String(player1Uid),

            player2_name: player2Name.trim(),
            player2_ign: player2Ign.trim(),
            player2_uid: String(player2Uid),

            player3_name: player3Name.trim(),
            player3_ign: player3Ign.trim(),
            player3_uid: String(player3Uid),

            player4_name: player4Name.trim(),
            player4_ign: player4Ign.trim(),
            player4_uid: String(player4Uid)
        });


        // =========================
        // SUCCESS
        // =========================

        res.json({
            success: true,
            registrationId: registrationId
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Registration failed."
        });

    }

});


// =========================
// TRACK REGISTRATION
// =========================

app.get("/track/:registrationId", (req, res) => {

    try {

        const registrationId =
            req.params.registrationId;

        const registration = db.prepare(`

            SELECT
                registration_id,
                team_name,
                captain_name,
                created_at,
                status

            FROM registrations

            WHERE registration_id = ?

        `).get(registrationId);


        if (!registration) {

            return res.status(404).json({
                success: false,
                message: "Registration not found."
            });

        }


        res.json({
            success: true,
            registration: registration
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to find registration."
        });

    }

});


// =========================
// ADMIN - ALL REGISTRATIONS
// =========================

app.get("/admin/registrations", (req, res) => {

    try {

        const registrations = db.prepare(`

            SELECT
                registration_id,
                team_name,
                captain_name,
                captain_mobile,
                captain_email,
                status,
                created_at

            FROM registrations

            ORDER BY id DESC

        `).all();


        res.json({
            success: true,
            registrations: registrations
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to load registrations."
        });

    }

});


// =========================
// ADMIN - FULL REGISTRATION DETAILS
// =========================

app.get("/admin/registration/:registrationId", (req, res) => {

    try {

        const registrationId =
            req.params.registrationId;

        const registration = db.prepare(`

            SELECT *
            FROM registrations
            WHERE registration_id = ?

        `).get(registrationId);


        if (!registration) {

            return res.status(404).json({
                success: false,
                message: "Registration not found."
            });

        }


        res.json({
            success: true,
            registration: registration
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to load registration details."
        });

    }

});


// =========================
// UPDATE REGISTRATION STATUS
// =========================

app.post("/admin/registration/status", (req, res) => {

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
                message: "Invalid registration ID or status."
            });

        }


        const result = db.prepare(`

            UPDATE registrations

            SET status = ?

            WHERE registration_id = ?

        `).run(
            status,
            registrationId
        );


        if (result.changes === 0) {

            return res.status(404).json({
                success: false,
                message: "Registration not found."
            });

        }


        res.json({
            success: true,
            message: "Registration status updated successfully."
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to update registration status."
        });

    }

});


// =========================
// ADMIN LOGIN
// =========================

app.post("/admin/login", (req, res) => {

    const {
        username,
        password
    } = req.body;


    if (
        username === ADMIN_USERNAME &&
        password === ADMIN_PASSWORD
    ) {

        res.json({
            success: true
        });

    } else {

        res.json({
            success: false,
            message: "Invalid username or password."
        });

    }

});


// =========================
// START SERVER
// =========================

app.listen(PORT, () => {

    console.log(
        `MKX ESPORTS server running on port ${PORT}`
    );

});