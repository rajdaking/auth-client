const express = require('express');
const router = express.Router();

// Placeholder for testing only, change this later
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes working!' });
});

module.exports = router;
