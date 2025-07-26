// backend/routes/analytics.js
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/sales-overview', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT platform, SUM(quantity) as total_sold 
      FROM sales 
      GROUP BY platform
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sales data' });
  }
});

module.exports = router;
