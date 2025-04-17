const express = require('express');
const router = express.Router();
const { loginUser } = require('./authorize.js');

// POST /login
router.post('/login', loginUser);

module.exports = router;
