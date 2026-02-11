const express = require('express');

const router = express.Router();

router.all('*', (req, res) => {
  res.status(501).send('Not implemented yet');
});

module.exports = router;
