import db from "./db.js";

export async function checkUser(email,roll){
    try{
        return await db.query("SELECT * FROM users WHERE email=$1 AND roll = $2", [email,roll]);
    }catch(err){
        console.error('Error checking user:', err);
        throw err;
    }
}

export async function updateLoginAttempts(email) {
    try {
        return await db.query(
            "UPDATE users SET login_attempts = 0, last_attempt_time = NULL, total_attempt = total_attempt + 1, right_attempt = right_attempt + 1 WHERE email = $1",
            [email]
        );
    } catch (err) {
        console.error('Error updating login attempts:', err);
        throw err;
    }
}

export async function updateLoginwrongAttempts(email) {
    try {
        return await db.query("UPDATE users SET login_attempts = login_attempts + 1, last_attempt_time = CURRENT_TIMESTAMP, total_attempt = total_attempt + 1, wrong_attempt = wrong_attempt + 1 WHERE email = $1", [email]);
    } catch (err) {
        console.error('Error updating login attempts:', err);
        throw err;
    }
}

export async function registerUser(email, password, name, roll) {
    try {
        return await db.query(
            "INSERT INTO users (email, password, name, roll) VALUES ($1, $2, $3, $4)",
            [email, password, name, roll]
        );
    } catch (err) {
        console.error('Error registering user:', err);
        throw err;
    }
}