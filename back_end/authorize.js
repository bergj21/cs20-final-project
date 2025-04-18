async function loginUser(req, res) {
    const { email, password } = req.body;
    const usersCollection = req.app.locals.users;

    try {
        const user = await usersCollection.findOne({ email });

        if (!user || user.password !== password) {
            return res.status(401).send('Invalid email or password');
        }

        // Respond with user ID so the client can store it
        res.json({ userId: user._id });
    } catch (err) {
        console.error("Error logging in:", err);
        res.status(500).send('Server error');
    }
}

module.exports = { loginUser };
