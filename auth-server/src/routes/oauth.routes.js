const express = require('express');
const router = express.Router();
const { googleAuth, googleCallback } = require('../controllers/oauth.controller');

router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

module.exports = router;