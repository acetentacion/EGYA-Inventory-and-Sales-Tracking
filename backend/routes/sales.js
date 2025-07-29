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
      SELECT 
        s.id, 
        s.product_id,   -- ✅ Added this line
        s.quantity, 
        s.platform, 
        s.date, 
        p.name AS product_name
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
  
// GET Monthly Sales & Profit Summary
router.get('/summary/:month', async (req, res) => {
  try {
    const month = req.params.month; // format: YYYY-MM
    const [rows] = await db.execute(`
      SELECT 
        COALESCE(SUM(s.quantity * p.sell_price), 0) AS total_sales,
        COALESCE(SUM(s.quantity * (p.sell_price - p.cost_price)), 0) AS total_profit
      FROM sales s
      JOIN products p ON s.product_id = p.id
      WHERE DATE_FORMAT(s.date, '%Y-%m') = ?
    `, [month]);

    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching monthly summary:', err);
    res.status(500).json({ error: 'Failed to fetch monthly summary' });
  }
});

router.get('/monthly-trend/:month', async (req, res) => {
  const { month } = req.params;
  try {
    const [rows] = await db.execute(`
      SELECT 
        DATE(s.date) AS date,
        SUM(s.quantity * p.sell_price) AS total_sales,
        SUM(s.quantity * (p.sell_price - p.cost_price)) AS total_profit
      FROM sales s
      JOIN products p ON s.product_id = p.id
      WHERE DATE_FORMAT(s.date, '%Y-%m') = ?
      GROUP BY DATE(s.date)
      ORDER BY DATE(s.date)
    `, [month]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching monthly trend:', err);
    res.status(500).json({ error: 'Failed to fetch monthly trend' });
  }
});

// router.get('/sales', async (req, res) => {
//   try {
//     const [rows] = await db.query(`
//       SELECT 
//         s.id, 
//         s.product_id,         -- ✅ Needed for history
//         p.name AS product_name, 
//         s.quantity, 
//         s.platform, 
//         s.date
//       FROM sales s
//       JOIN products p ON s.product_id = p.id
//       ORDER BY s.date DESC
//     `);
//     res.json(rows);
//   } catch (err) {
//     console.error("Error fetching sales:", err);
//     res.status(500).json({ error: "Failed to fetch sales" });
//   }
// });

// // ===== Get sales history for a specific product =====
// router.get('/history/:id', async (req, res) => {
//   const productId = req.params.id;
//   try {
//     const [rows] = await db.query(`
//       SELECT 
//         s.quantity, 
//         s.platform, 
//         s.date
//       FROM sales s
//       WHERE s.product_id = ?
//       ORDER BY s.date DESC
//     `, [productId]);

//     res.json(rows);
//   } catch (err) {
//     console.error("Error fetching sales history:", err);
//     res.status(500).json({ error: "Failed to fetch sales history" });
//   }
// });








module.exports = router;
