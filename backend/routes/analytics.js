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

// Sales by Product
router.get('/sales-by-product', async (req, res) => {
    try {
      const [rows] = await db.execute(`
        SELECT p.name AS product, SUM(s.quantity) AS total_sold
        FROM sales s
        JOIN products p ON s.product_id = p.id
        GROUP BY p.id
        ORDER BY total_sold DESC
      `);
      res.json(rows);
    } catch (err) {
      console.error('Error fetching sales by product:', err);
      res.status(500).json({ error: 'Failed to fetch sales by product' });
    }
  });
  

// GET /api/analytics/total-profit
router.get('/total-profit', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        SUM((p.sell_price - p.cost_price) * s.quantity) AS total_profit
      FROM sales s
      JOIN products p ON s.product_id = p.id
    `);

    res.json({ total_profit: rows[0].total_profit || 0 });
  } catch (err) {
    console.error('Error calculating total profit:', err);
    res.status(500).json({ error: 'Failed to calculate total profit' });
  }
});

// 🔢 Profit by Platform
router.get('/profit-by-platform', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT platform, 
             SUM((p.sell_price - p.cost_price) * s.quantity) AS profit
      FROM sales s
      JOIN products p ON s.product_id = p.id
      GROUP BY platform
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error calculating profit by platform:', err);
    res.status(500).json({ error: 'Failed to calculate platform profit' });
  }
});

// 📦 Profit by Product
router.get('/profit-by-product', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT p.name AS product, 
             SUM((p.sell_price - p.cost_price) * s.quantity) AS profit
      FROM sales s
      JOIN products p ON s.product_id = p.id
      GROUP BY product
      ORDER BY profit DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error calculating profit by product:', err);
    res.status(500).json({ error: 'Failed to calculate product profit' });
  }
});

router.get('/summary', async (req, res) => {
    try {
      const [[{ total_products }]] = await db.execute(`SELECT COUNT(*) AS total_products FROM products`);
      const [[{ total_sales }]] = await db.execute(`SELECT SUM(quantity * sell_price) AS total_sales FROM sales JOIN products ON sales.product_id = products.id`);
      const [[{ total_profit }]] = await db.execute(`SELECT SUM((sell_price - cost_price) * quantity) AS total_profit FROM sales JOIN products ON sales.product_id = products.id`);
      const [[{ low_stock_count }]] = await db.execute(`SELECT COUNT(*) AS low_stock_count FROM products WHERE current_stock <= 3`);
  
      res.json({
        total_products: total_products || 0,
        total_sales: total_sales || 0,
        total_profit: total_profit || 0,
        low_stock_count: low_stock_count || 0
      });
    } catch (err) {
      console.error('Error getting summary:', err);
      res.status(500).json({ error: 'Failed to load summary' });
    }
  });
  
  router.get('/profit-overview', async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT 
          p.name AS product_name,
          COALESCE(SUM(s.quantity), 0) AS total_sold,
          COALESCE(SUM(s.quantity * p.sell_price), 0) AS total_sales,
          COALESCE(SUM(s.quantity * (p.sell_price - p.cost_price)), 0) AS total_profit
        FROM products p
        LEFT JOIN sales s ON p.id = s.product_id
        GROUP BY p.id
        ORDER BY total_profit DESC
      `);
  
      res.json(rows);
    } catch (err) {
      console.error('Error fetching profit overview:', err);
      res.status(500).json({ error: 'Failed to fetch profit overview' });
    }
  });
  

module.exports = router;
