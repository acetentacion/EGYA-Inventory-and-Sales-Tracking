const express = require('express');
const router = express.Router();
const db = require('../db'); // adjust path if needed

// Record a sale (you already have this)
router.post('/', async (req, res) => {
  const { product_id, quantity, platform } = req.body;
  if (!product_id || !quantity || !platform) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    await db.execute(
      'INSERT INTO sales (product_id, quantity, platform, date) VALUES (?, ?, ?, NOW())',
      [product_id, quantity, platform]
    );

    await db.execute(
      'UPDATE products SET current_stock = current_stock - ? WHERE id = ?',
      [quantity, product_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Sale error:', err);
    res.status(500).json({ error: 'Failed to record sale' });
  }
});

// 🆕 Fetch sales list
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT s.id, s.quantity, s.platform, s.date, p.name AS product_name
      FROM sales s
      JOIN products p ON s.product_id = p.id
      ORDER BY s.date DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error('Get sales error:', err);
    res.status(500).json({ error: 'Failed to load sales' });
  }
});

// GET /api/sales/export
router.get('/export', async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT 
          s.id,
          p.name AS product_name,
          s.quantity,
          s.platform,
          s.total_price,
          s.created_at
        FROM sales s
        JOIN products p ON s.product_id = p.id
        ORDER BY s.created_at DESC
      `);
  
      const csvRows = [
        ['Sale ID', 'Product', 'Quantity', 'Platform', 'Total Price', 'Date'],
        ...rows.map(r => [
          r.id,
          r.product_name,
          r.quantity,
          r.platform,
          r.total_price,
          new Date(r.created_at).toLocaleString()
        ])
      ];
  
      const csv = csvRows.map(row => row.join(',')).join('\n');
  
      res.header('Content-Type', 'text/csv');
      res.attachment('sales-report.csv');
      res.send(csv);
  
    } catch (err) {
      console.error('Export Error:', err.message);
      res.status(500).json({ error: 'Failed to export sales report' });
    }
  });
  

module.exports = router;
