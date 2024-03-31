Secure Application Programming Security Demonstration Application

This is a simple application built with Express.js and SQLite3. It allows users to register, login, and save their personal information securely.

Features:

    User registration with password validation.
    User login with session management.
    Secure routing with authentication.
    Securely saving user information in a SQLite3 database.

Technologies Used:

    Express.js: Handles server-side logic and routing.
    SQLite: SQL database engine used for data storage.
    Express Session: Manages session data during user authentication to protect sensitive data.
    Helmet: Secures application using various HTTP headers.
    Escape-HTML: Escapes HTML special characters to prevent XSS attacks.
    Sanitize-HTML: Sanitizes HTML to prevent XSS attacks.

To use the application, first - clone repository:

    git clone https://github.com/MarcasNC98/SecureApp.git

    cd SecureApp

Install required dependencies:

    npm install express sqlite3 express-session escape-html sanitize-html helmet

Run the application:

    node server.js

Access the application:

     http://localhost:3000

Usage:

    Navigate to /register to register a new user account.
    Navigate to / to login with your registered account.
    Upon successful login, you will be redirected to the welcome page.
    Navigate to /info to save your personal information securely.
    Your information can be viewed on the /userInfo page after saving.
