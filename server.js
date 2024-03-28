//Mark Cummins
//x20400634

//Basis for code from https://blog.logrocket.com/building-simple-login-form-node-js/ 

// Imports express and sqlite3
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require("path")

// Creates an express.js app
const app = express();
// Sets the port to 3000
const PORT = 3000;
// Creates a new sqlite3 database
const db = new sqlite3.Database('./database.db');

// Parses URL encoded requests https://www.geeksforgeeks.org/express-js-express-urlencoded-function/ 
app.use(express.urlencoded({ extended: true }));
app.use(express.static('html'));

// Creates a user table in the database if one doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    password TEXT
)`);

// Routing for registration - registration form is now vulnerable to XSS attacks as a users input is inserted directly into the HTML response
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    // Checks if a username already exists in the database
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        // If an error is thrown, inform the user
        if (err) {
            res.status(500).send('Internal Server Error');
            return;
        }
        // If username already exists, inform the user - commented out to demonstrate XSS attacks
        // if (row) {
        //     res.send('Username already exists. Please choose a different username.');
        //     return;
        // }
        // Otherwise, insert a new user into the database - query is parameterised to prevent sql injection attacks
        db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], (err) => {
            if (err) {
                res.status(500).send('Internal Server Error');
                return;
            }
            // Directly inserting a users input into the HTML response to enable XSS attack - https://owasp.org/www-community/attacks/xss/ 
            res.send('Successfully Registered! You can now proceed to <a href="/">login</a>. Welcome, ' + username);
        });
    });
});


// Routing for login - login form is now vulnerable to SQL injection as the users input is inserted directly into query
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // Now vulnerable to SQL injection as user input is inserted directly into the SQL query - https://www.w3schools.com/sql/sql_injection.asp 
    db.get(`SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`, (err, row) => {
        if (err) {
            res.status(500).send('Internal Server Error');
            return;
        }
        // Redirect the user to the welcome screen, else, inform them they may have entered username or password incorrectly
        if (row) {
            res.redirect('/welcome');
        } else {
            res.send('Invalid username or password. Return to <a href="/">login</a> page.');
        }
    });
});


// Routing to serve the registration page
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '/html/register.html'));
});

// Routing to serve the welcome page
app.get('/welcome', (req, res) => {
    res.sendFile(path.join(__dirname, '/html/welcome.html'));
});

// Logs that server is running
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
