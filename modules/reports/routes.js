const express = require('express');
const service = require('./service');

const router = express.Router();

router.get('/', (req, res) => {
  const data = service.getDashboardData();

  return res.render('reports/index', {
    title: 'Reports Dashboard',
    ...data,
  });
});

module.exports = router;
