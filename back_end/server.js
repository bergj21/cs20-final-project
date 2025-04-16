const express = require('express');
const session = require('express-session');
const { connectToUsersCollection, disconnectDB } = require('./db_connect.js');
const routes = require('./routes.js');

const app = express();
const PORT = 3000;

// Session middleware
app.use(session({
    secret: 'yourSecretKey',  // Replace in .env for production
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Static files and body parsing
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

async function startServer() {
    try {
        let usersCollection = await connectToUsersCollection();
        app.locals.users = usersCollection;
        
        // Route registration
        app.use('/', routes);

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start server:", err);
    }
}

process.on('SIGINT', async () => {
    console.log("\nShutting down server...");
    await disconnectDB();
    process.exit(0);
});

startServer();
