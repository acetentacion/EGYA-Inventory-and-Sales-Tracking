const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all returns
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT r.*, p.name AS product_name, s.platform
      FROM returns r
      JOIN products p ON r.product_id = p.id
      JOIN sales s ON r.sale_id = s.id
      ORDER BY r.return_date DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching returns:", err);
    res.status(500).json({ error: "Failed to fetch returns" });
  }
});

// Create return
router.post('/', async (req, res) => {
  const { sale_id, product_id, quantity, reason } = req.body;
  try {
    await db.execute(`
      INSERT INTO returns (sale_id, product_id, quantity, reason)
      VALUES (?, ?, ?, ?)
    `, [sale_id, product_id, quantity, reason]);
    res.json({ message: "Return request submitted" });
  } catch (err) {
    console.error("Error creating return:", err);
    res.status(500).json({ error: "Failed to create return" });
  }
});

// Approve return & restock
router.post('/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    const [[ret]] = await db.execute(`SELECT * FROM returns WHERE id = ?`, [id]);
    if (!ret) return res.status(404).json({ error: "Return not found" });

    await db.execute(`UPDATE products SET current_stock = current_stock + ? WHERE id = ?`, [ret.quantity, ret.product_id]);
    await db.execute(`UPDATE returns SET status = 'Approved' WHERE id = ?`, [id]);

    res.json({ message: "Return approved & stock updated" });
  } catch (err) {
    console.error("Error approving return:", err);
    res.status(500).json({ error: "Failed to approve return" });
  }
});

module.exports = router;
