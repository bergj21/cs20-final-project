const express = require('express');
const router = express.Router();
const { loginUser } = require('./authorize.js');
const { get_user_session_status } = require('./back_end_api.js');

// POST /login
router.post('/login', loginUser);

// GET get user session status 
router.get('/api/user', get_user_session_status);

// user api call
module.exports = router;
