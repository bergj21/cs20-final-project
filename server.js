// server.js
const express = require('express');
const session = require('express-session');
const { connectToUsersCollection, disconnectDB } = require('./db_connect');

const app = express();
const PORT = 3000;

// Set up session middleware
app.use(session({
    secret: 'yourSecretKey',  // Change to something secure
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }  // Set to true if you're using HTTPS
}));

// Gets static files in the public older
app.use(express.static('public'));
  
// Middleware to parse request bodies (for form data)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let usersCollection;

async function startServer() {
    try {
        usersCollection = await connectToUsersCollection();
        app.locals.users = usersCollection;

        app.get('/', (req, res) => {
            res.send('Server is running and connected to MongoDB.');
        });

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start server:", err);
    }
}

// Gracefully handle shutdown
process.on('SIGINT', async () => {
    console.log("\nShutting down server...");
    await disconnectDB();
    process.exit(0);
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if email exists in the collection
        const user = await usersCollection.findOne({ email: email });

        if (!user) {
            return res.status(401).send('Invalid email or password');
        }

        if (password === user.password) 
        {
            // If login is successful, store user in the session
            req.session.user_id = user._id; // Save the user info in the session
            // res.redirect('/profile'); // Redirect to profile page
        }
        else 
        {
            return res.status(401).send('Invalid email or password');
        }

    } 
    catch (err) 
    {
        console.error("Error logging in:", err);
        res.status(500).send('Server error');
    }
});

startServer();
