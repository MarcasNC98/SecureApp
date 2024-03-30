//Mark Cummins
//x20400634

//Basis for code from https://blog.logrocket.com/building-simple-login-form-node-js/ 

// Imports express and sqlite3
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require("path")
// Using escape-html library to escape HTML special characters, sanitizing the username before being included in HTML response https://www.npmjs.com/package/escape-html  
const escapeHtml = require('escape-html');
// Using sanitize-html library to sanitize every username retrieved from the database https://www.npmjs.com/package/sanitize-html 
const sanitizeHtml = require('sanitize-html');
// Using express-session to allow for session management during login https://expressjs.com/en/resources/middleware/session.html 
const session = require('express-session');
// Using helmet to implement security headers https://www.npmjs.com/package/helmet 
const helmet = require('helmet');

// Creates an express.js app
const app = express();
// Implements helmet for security headers
app.use(helmet());
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
// Express session - handles session management for users
app.use(session({
    secret: 'secret_key', 
    resave: false,
    saveUninitialized: false
}));

// Creates a user table in the database if one doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    password TEXT
)`);

// Creates a table for a customers details if one doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    name TEXT,
    address TEXT,
    age INTEGER,
    col TEXT
)`);

// Routing for registration
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    // Regex to check if the username contains only letters and numbers
    const usernameRegex = /^[a-zA-Z0-9]+$/;

    // Check if a username only contains letters and numbers
    if (!usernameRegex.test(username)) {
        res.status(400).send('Username can only contain letters and numbers.');
        return;
    }

    // Regex to check if a password is at least 6 characters long and contains at least one lowercase and uppercase letter, and one number
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

    // Check if the password meets the strong password criteria
    if (!strongPasswordRegex.test(password)) {
        res.status(400).send('Password must be at least 6 characters long and contain at least one lowercase and uppercase letter, and one number.');
        return;
    }

    // Checks if a username already exists in the database
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        // If an error is thrown, inform the user
        if (err) {
            res.status(500).send('Internal Server Error');
            return;
        }
        if (row) {
            res.send('Username already exists. Please choose a different username.');
            return;
        }
        // Otherwise, insert a new user into the database - query is parameterized to prevent SQL injection attacks
        db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], (err) => {
            if (err) {
                res.status(500).send('Internal Server Error');
                return;
            }
            // Sanitizes the username before including it in the HTML response
            const sanitizedUsername = escapeHtml(username);
            res.send(`Successfully Registered! You can now proceed to <a href="/">login</a>. Welcome, ${sanitizedUsername}`);
        });
    });
});


// Routing for login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // Query is parameterised to separate the sql query from the user input, mitigating sql injection attacks
    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
        if (err) {
            res.status(500).send('Internal Server Error');
            return;
        }
        // If a user is found, store their user ID in the express session, then redirect them to the welcome page
        if (row) {
            req.session.userId = row.id;
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
        // Displays a list of all registered users with input sanitization using sanitize-html
        let userList = '';
        rows.forEach(row => {
            userList += sanitizeHtml(row.username) + '<br>';
        });
        res.send(`Welcome! New Users:<br>${userList}`);
    });
});

// Routing to serve the details page
app.get('/info', (req, res) => {
    res.render('info'); 
});

// CheckS if the user is authenticated, if not, they will receive a warning message
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        res.status(401).send('Unauthorized'); 
        return;
    }
    next();
};

// Route for saving user details
app.post('/saveInfo', requireAuth, (req, res) => {
    const { name, address, age, col } = req.body;
    const loggedInUserId = req.session.userId;

    // Inserting user's information along with their userId into the database
    db.run(`INSERT INTO info (userId, name, address, age, col) VALUES (?, ?, ?, ?, ?)`, [loggedInUserId, name, address, age, col], (err) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.redirect('/userInfo');
    });
});

// Route to display user information page
app.get('/userInfo', requireAuth, (req, res) => {
    const loggedInUserId = req.session.userId;

    // Fetches the latest user information associated with the logged in user from the database
    db.get(`SELECT * FROM info WHERE userId = ? ORDER BY id DESC LIMIT 1`, [loggedInUserId], (err, row) => {
        if (err) {
            console.error('Database error:', err);
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


// Logs that server is running
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
