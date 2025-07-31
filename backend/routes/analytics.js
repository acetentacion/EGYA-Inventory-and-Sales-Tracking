// backend/routes/analytics.js
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/sales-overview', async (req, res) => {
  try {
    const type = req.query.type || 'platform';

    if (type === 'product') {
      // Sales grouped by product with returns
      const [rows] = await db.query(`
        SELECT 
          p.name AS product_name, 
          SUM(s.quantity) AS total_sold,
          IFNULL(SUM(r.quantity), 0) AS total_returned
        FROM products p
        LEFT JOIN sales s ON s.product_id = p.id
        LEFT JOIN returns r ON r.product_id = p.id
        GROUP BY p.id
      `);
      return res.json(rows);
    } else {
      // Sales grouped by platform with returns
      const [rows] = await db.query(`
        SELECT 
          s.platform, 
          SUM(s.quantity) AS total_sold,
          IFNULL(SUM(r.quantity), 0) AS total_returned
        FROM sales s
        LEFT JOIN returns r ON r.product_id = s.product_id
        GROUP BY s.platform
      `);
      return res.json(rows);
    }
  } catch (err) {
    console.error(err);
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
    const [[{ total_profit }]] = await db.execute(`
      SELECT 
        SUM(s.quantity * (p.sell_price - p.cost_price))
        - COALESCE(SUM(r.quantity * (p.sell_price - p.cost_price)),0) AS total_profit
      FROM sales s
      JOIN products p ON s.product_id = p.id
      LEFT JOIN returns r ON s.product_id = r.product_id
    `);
    res.json({ total_profit: total_profit || 0 });
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
    // Total products
    const [[{ total_products }]] = await db.execute(`
      SELECT COUNT(*) AS total_products FROM products
    `);

    // ✅ Total sales minus returns
    const [[{ total_sales }]] = await db.execute(`
      SELECT 
        SUM(s.quantity * p.sell_price) 
        - IFNULL(SUM(r.quantity * p.sell_price), 0) AS total_sales
      FROM products p
      LEFT JOIN sales s ON s.product_id = p.id
      LEFT JOIN returns r ON r.product_id = p.id
    `);

    // ✅ Total profit minus returns
    const [[{ total_profit }]] = await db.execute(`
      SELECT 
        SUM((p.sell_price - p.cost_price) * s.quantity)
        - IFNULL(SUM((p.sell_price - p.cost_price) * r.quantity), 0) AS total_profit
      FROM products p
      LEFT JOIN sales s ON s.product_id = p.id
      LEFT JOIN returns r ON r.product_id = p.id
    `);

    // ✅ Total returns (quantity * sell price)
    const [[{ total_returns }]] = await db.execute(`
      SELECT 
        IFNULL(SUM(r.quantity * p.sell_price), 0) AS total_returns
      FROM returns r
      JOIN products p ON r.product_id = p.id
    `);

    // Low stock count
    const [[{ low_stock_count }]] = await db.execute(`
      SELECT COUNT(*) AS low_stock_count 
      FROM products 
      WHERE current_stock <= 3
    `);

    // Low stock product list
    const [low_stock_products] = await db.execute(`
      SELECT id, name, current_stock 
      FROM products 
      WHERE current_stock <= 3
      ORDER BY current_stock ASC
    `);

    // Send response
    res.json({
      total_products: total_products || 0,
      total_sales: total_sales || 0,
      total_profit: total_profit || 0,
      total_returns: total_returns || 0, // ✅ Add returns value
      low_stock_count: low_stock_count || 0,
      low_stock_products
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
  

  router.get('/recent-activity', async (req, res) => {
    try {
      const [rows] = await db.execute(`
        SELECT type, product_name, quantity, note, date FROM (
          SELECT 'Restock' AS type, p.name AS product_name, il.quantity, il.note, il.created_at AS date
          FROM inventory_logs il
          JOIN products p ON il.product_id = p.id
  
          UNION ALL
          
          SELECT 'Sale' AS type, p.name AS product_name, s.quantity, s.platform AS note, s.created_at AS date
          FROM sales s
          JOIN products p ON s.product_id = p.id
          
          UNION ALL
          
          SELECT 'New Product' AS type, name AS product_name, 0 AS quantity, 'Added to inventory' AS note, created_at AS date
          FROM products
  
          UNION ALL
          
          SELECT 'Return' AS type, p.name AS product_name, r.quantity, r.reason AS note, r.created_at AS date
          FROM returns r
          JOIN products p ON r.product_id = p.id
        ) AS combined
        ORDER BY date DESC
        LIMIT 10
      `);
  
      res.json(rows);
    } catch (err) {
      console.error('Error fetching recent activity:', err);
      res.status(500).json({ error: 'Failed to load recent activity' });
    }
  });
  

  // 📈 Best Selling Product
// 📈 Top 3 Best Selling Products
router.get('/best-selling', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT p.id, p.name, SUM(s.quantity) AS total_sold
      FROM sales s
      JOIN products p ON s.product_id = p.id
      GROUP BY p.id
      ORDER BY total_sold DESC
      LIMIT 3
    `);

    res.json(rows);
  } catch (err) {
    console.error('Error fetching best selling products:', err);
    res.status(500).json({ error: 'Failed to fetch best selling products' });
  }
});


// 📦 Fast vs Slow Moving Products
router.get('/movement-status', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT p.id, p.name, SUM(s.quantity) AS total_sold_last_30_days
      FROM products p
      LEFT JOIN sales s ON p.id = s.product_id 
        AND s.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY p.id
    `);

    const fastMoving = [];
    const slowMoving = [];

    rows.forEach(product => {
      if ((product.total_sold_last_30_days || 0) >= 5) {
        fastMoving.push(product);
      } else {
        slowMoving.push(product);
      }
    });

    res.json({ fastMoving, slowMoving });
  } catch (err) {
    console.error('Error fetching movement status:', err);
    res.status(500).json({ error: 'Failed to fetch product movement status' });
  }
});

// 📦 Total Stock per Category
router.get('/stock-by-category', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT category, SUM(current_stock) AS total_stock
      FROM products
      GROUP BY category
      ORDER BY total_stock DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching stock by category:', err);
    res.status(500).json({ error: 'Failed to fetch stock by category' });
  }
});



  


module.exports = router;
