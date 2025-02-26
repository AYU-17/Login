import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import db from "./db.js";
import { checkUser, updateLoginAttempts,updateLoginwrongAttempts, registerUser } from "./queries.js";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

// checkRole section 
const checkRole = (roll) => {
    return (req, res, next) => {
        if (req.session.roll === roll) {
            next();
        }
         else {
            res.status(403).json({ success: false, message: "Unauthorized access" });
        }
    };
};


app.get("/", (req, res) => {
    res.render("home.ejs");
});

app.get("/login", (req, res) => {
    res.render("login.ejs");
});

app.get("/register", (req, res) => {
    res.render("register.ejs");
});

app.get("/main",checkRole('user'), (req,res)=>{
    res.render("main.ejs");
});

app.get("/main1",checkRole('admin'), (req,res)=>{
    res.render("main1.ejs");
});

// app.get("/logout", (req,res)=>{
//     res.render("home.ejs");
// });


app.post("/register", async (req, res) => {
    const email = req.body.username;
    const password = req.body.password;
    const name = req.body.name;
    const roll = req.body.roll;

    try {
        const result = await registerUser(email, password, name, roll);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.json({ success: false });
    }
});





app.post("/login", async (req, res) => {
    const roll = req.body.roll;
    const email = req.body.username;
    const password = req.body.password;

    try {
        const result = await checkUser(email,roll);
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
            if (password === storedPassword ) {

                req.session.roll = roll;
                req.session.user = {
                    email: email,
                    roll: roll
                };

                await updateLoginAttempts(email);
                return res.json({success:true,
                    redirect: roll === 'admin' ? '/main1' : '/main'
                });
            } else {
                await updateLoginwrongAttempts(email);
                // db.query("UPDATE users SET login_attempts = login_attempts + 1, last_attempt_time = CURRENT_TIMESTAMP, total_attempt = total_attempt + 1, wrong_attempt = wrong_attempt + 1 WHERE email = $1", [email]);
                // res.send("incorrect passsword");
                res.json({ success: false, message: "Incorrect password" });
            }
        } else {
            // res.send("user not found");
            res.json({ success: false, message: "user not found, try again." });
        }
    } catch (err) {
        console.log(err);
        res.json({ success: false, message: "Server error" });
    }
});

// app.post('/logout', (req, res) => {
//     req.session.destroy();
//     res.json({ success: true, redirect: '/login' });
// });

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
