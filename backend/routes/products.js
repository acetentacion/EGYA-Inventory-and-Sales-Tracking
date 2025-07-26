const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

module.exports = router;

router.post('/', async (req, res) => {
    const { name, sku, category, cost_price, sell_price, current_stock } = req.body;
  
    if (!name || !sku || !category) {
      return res.status(400).json({ error: 'Missing fields' });
    }
  
    try {
      const [result] = await db.query(
        'INSERT INTO products (name, sku, category, cost_price, sell_price, current_stock) VALUES (?, ?, ?, ?, ?, ?)',
        [name, sku, category, cost_price, sell_price, current_stock]
      );
      res.json({ message: 'Product added', product_id: result.insertId });
    } catch (err) {
      console.error('Insert Error:', err.message);
      res.status(500).json({ error: 'Failed to add product' });
    }
  });

  router.post('/sale', async (req, res) => {
    const { product_id, quantity, platform } = req.body;
  
    if (!product_id || !quantity || !platform) {
      return res.status(400).json({ error: 'Missing sale data' });
    }
  
    try {
      const [[product]] = await db.query('SELECT * FROM products WHERE id = ?', [product_id]);
  
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
  
      if (product.current_stock < quantity) {
        return res.status(400).json({ error: 'Not enough stock' });
      }
  
      const total_price = product.sell_price * quantity;
  
      await db.query('INSERT INTO sales (product_id, quantity, platform, total_price) VALUES (?, ?, ?, ?)', 
        [product_id, quantity, platform, total_price]);
  
      await db.query('UPDATE products SET current_stock = current_stock - ? WHERE id = ?', 
        [quantity, product_id]);
  
      await db.query('INSERT INTO inventory_logs (product_id, type, quantity, note) VALUES (?, "sale", ?, ?)', 
        [product_id, quantity, `Sale via ${platform}`]);
  
      res.json({ message: 'Sale recorded successfully' });
  
    } catch (err) {
      console.error('Sale Error:', err.message);
      res.status(500).json({ error: 'Failed to record sale' });
    }
  });
  