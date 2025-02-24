import express from "express";
import bodyParser from "body-parser";
import pg from "pg";


const app = express();
const port = 3000;

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "users",
    password: "ayush@123",
    port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.render("home.ejs");
});

app.get("/login", (req, res) => {
    res.render("login.ejs");
});

app.get("/register", (req, res) => {
    res.render("register.ejs");
});

app.get("/main", (req,res)=>{
    res.render("main.ejs");
});

app.post("/register", async (req, res) => {
    const email = req.body.username;
    const password = req.body.password;
    const name = req.body.name;

    try {
        const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
            email,
        ]);

        if (checkResult.rows.length > 0) {
            // res.send("Email already exists. Try logging in.");
            res.json({ success: false });
        } else {
            const result = await db.query("INSERT INTO users (email, password, name) VALUES ($1, $2, $3)", [email, password, name]);
            // const result = await db.query("INSERT INTO users (email, password) VALUES ($1, $2)", [email, password]);
            console.log(result);
            // res.render("login.ejs");
            res.json({ success: true });
        }
    } catch (err) {
        console.log(err);
    }
});

app.post("/login", async (req, res) => {
    const email = req.body.username;
    const password = req.body.password;

    try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const storedPassword = user.password;

            // check if 

            const lockoutDuration = 30 * 1000;
            const currentTime = new Date();
            const lastAttemptTime = user.last_attempt_time ? new Date(user.last_attempt_time) : new Date(0);
            const timeDiff = currentTime - lastAttemptTime;

            if (user.login_attempts >= 3 && timeDiff < lockoutDuration) {
                const remainingTime = lockoutDuration - timeDiff;
                const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
                return res.json({
                    success: false,
                    message: `Account is locked. Try again in ${minutes}m:${seconds}s`
                });
            }

            if (password === storedPassword) {
                await db.query("UPDATE users SET login_attempts = 0, last_attempt_time = NULL, total_attempt = total_attempt + 1, right_attempt = right_attempt + 1 WHERE email = $1", [email]);
                // res.render("main.ejs");
                res.json({ success: true });
            } else {
                await db.query("UPDATE users SET login_attempts = login_attempts + 1, last_attempt_time = CURRENT_TIMESTAMP, total_attempt = total_attempt + 1, wrong_attempt = wrong_attempt + 1 WHERE email = $1", [email]);
                // res.send("incorrect passsword");
                res.json({ success: false, message: "Incorrect password" });
            }
        } else {
            // res.send("user not found");
            res.json({ success: false, message: "user not found, try again." });
        }
    } catch (err) {
        console.log(err);
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
