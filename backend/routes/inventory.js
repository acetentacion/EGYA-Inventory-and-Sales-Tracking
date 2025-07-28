const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/inventory/logs
router.get('/logs', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        il.id,
        il.type,
        il.quantity,
        il.note,
        il.created_at,
        p.name AS product_name
      FROM inventory_logs il
      JOIN products p ON il.product_id = p.id
      ORDER BY il.created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error('Inventory Log Fetch Error:', err.message);
    res.status(500).json({ error: 'Failed to load inventory logs' });
  }
});

module.exports = router;
