const express = require('express');
const router = express.Router();
const { login } = require('./auth.controller');
const { loginLimiter } = require('../../middleware/rateLimit');

router.post('/login', loginLimiter, login);

module.exports = router;
