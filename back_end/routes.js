const express = require('express');
const router = express.Router();
const { loginUser } = require('./authorize.js');
const { getUserPreferences } = require('./database.js');

// POST /login
router.post('/login', loginUser);

// retrieves the user preferences
router.get('/get-user-preferences', getUserPreferences);

module.exports = router;
