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

// Sets the view engine and path to access views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'html'));

// Parses URL encoded requests https://www.geeksforgeeks.org/express-js-express-urlencoded-function/ 
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Creates a user table in the database if one doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    password TEXT
)`);

// Creates a table for a customers details if one doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    address TEXT,
    age INTEGER,
    col TEXT
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

// Routing to serve the login page
app.get('/', (req, res) => {
    res.render('index'); 
});

// Routing to serve the registration page
app.get('/register', (req, res) => {
    res.render('register'); 
});

// Routing to serve the welcome page
app.get('/welcome', (req, res) => {
    // Fetches every username from the database
    db.all('SELECT username FROM users', (err, rows) => {
        if (err) {
            res.status(500).send('Internal Server Error');
            return;
        }
        // Will display a list of all registered users without input santization - Stored XSS vulnerability
        let userList = '';
        rows.forEach(row => {
            userList += row.username + '<br>';
        });
        res.send(`Welcome! New Users:<br>${userList}`);
    });
});

// Routing to serve the details page
app.get('/info', (req, res) => {
    res.render('info'); 
});

// Route to display user information page
app.get('/userInfo', (req, res) => {
    // Fetch the latest user information from the database - unsecure and exposes application to sensitive data exposure
    db.get(`SELECT * FROM info ORDER BY id DESC LIMIT 1`, (err, row) => {
        if (err) {
            res.status(500).send('Internal Server Error');
            return;
        }
        if (!row) {
            res.status(404).send('User information not found');
            return;
        }
        // Render user information HTML page with data
        res.render('userInfo', { user: row });
    });
});

// Routing for saving user details - used to showcase sensitive data exposure
app.post('/saveInfo', (req, res) => {
    const { name, address, age, col} = req.body;
    // Inserting users information into the database
    db.run(`INSERT INTO info (name, address, age, col) VALUES ('${name}', '${address}', ${age}, '${col}')`, (err) => {
        if (err) {
            res.status(500).send('Internal Server Error');
            return;
        }
        res.redirect('/userInfo');
    });
});

// Logs that server is running
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


