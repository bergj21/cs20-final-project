const { MongoClient, ServerApiVersion } = require('mongodb');

const db_username = "meal_prep_buddy";
const db_password = "Xbl6ZVWIwePsELZY";
const uri = `mongodb+srv://${db_username}:${db_password}@alexshriver.xg4npfv.mongodb.net/?appName=AlexShriver`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let usersCollection;

async function connectToUsersCollection() {
    try {
        await client.connect();
        const db = client.db("meal_prep_buddy");
        usersCollection = db.collection("users");
        console.log("Connected to MongoDB and users collection.");
        return usersCollection;
    } catch (err) {
        console.error("MongoDB connection error:", err);
        throw err;
    }
}

async function disconnectDB() {
    try {
        await client.close();
        console.log("Disconnected from MongoDB.");
    } catch (err) {
        console.error("Error disconnecting:", err);
    }
}

module.exports = {
    connectToUsersCollection,
    disconnectDB
};