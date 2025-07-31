const express = require('express');
const router = express.Router();
const db = require('../db');

// backend/routes/products.js
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT * FROM products 
      ORDER BY current_stock DESC  -- ✅ Highest stock first
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

module.exports = router;

router.post('/', async (req, res) => {
  const { name, category, cost_price, sell_price, current_stock } = req.body;

  if (!name || !category || !cost_price || !sell_price || current_stock == null) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    // Insert product without SKU
    const [result] = await db.execute(
      'INSERT INTO products (name, category, cost_price, sell_price, current_stock) VALUES (?, ?, ?, ?, ?)',
      [name, category, cost_price, sell_price, current_stock]
    );

    const productId = result.insertId;

    // Generate SKU: First 3 letters of category + ID
    const sku = `${category.slice(0, 3).toUpperCase()}-${productId.toString().padStart(4, '0')}`;

    await db.execute('UPDATE products SET sku = ? WHERE id = ?', [sku, productId]);

    res.json({ success: true, id: productId, sku });
  } catch (err) {
    console.error('Error adding product:', err);
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

  // Update product by ID
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, sku, category, cost_price, sell_price, current_stock } = req.body;
  
    try {
      await db.execute(
        `UPDATE products SET name = ?, sku = ?, category = ?, cost_price = ?, sell_price = ?, current_stock = ? WHERE id = ?`,
        [name, sku, category, cost_price, sell_price, current_stock, id]
      );
      res.json({ message: 'Product updated' });
    } catch (error) {
      console.error('Update error:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  });
  
  // Delete product by ID
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      await db.execute(`DELETE FROM products WHERE id = ?`, [id]);
      res.json({ message: 'Product deleted' });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

// Get unique categories
router.get('/categories', async (req, res) => {
    try {
      const [rows] = await db.query(
        `SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != '' ORDER BY category`
      );
      const categories = rows.map(r => r.category);
      res.json(categories);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

// POST /api/products/:id/restock
router.post('/:id/restock', async (req, res) => {
    const { id } = req.params;
    const { quantity, note } = req.body;
  
    if (!quantity || isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }
  
    try {
      // Update product stock
      await db.query(
        'UPDATE products SET current_stock = current_stock + ? WHERE id = ?',
        [quantity, id]
      );
  
      // Log the restock in inventory_logs
      await db.query(
        'INSERT INTO inventory_logs (product_id, type, quantity, note) VALUES (?, ?, ?, ?)',
        [id, 'restock', quantity, note || 'Manual restock']
      );
  
      res.json({ message: 'Stock added successfully' });
    } catch (err) {
      console.error('Restock error:', err.message);
      res.status(500).json({ error: 'Failed to add stock' });
    }
  });
  
  // 📦 Generate SKU Helper
function generateSKU(name, category, id) {
  const catCode = category ? category.slice(0, 3).toUpperCase() : "GEN";
  const nameCode = name ? name.split(' ')[0].slice(0, 3).toUpperCase() : "PRO";
  return `${catCode}-${nameCode}-${String(id).padStart(3, '0')}`;
}

// 🆕 Add Product with Auto SKU
router.post('/', async (req, res) => {
  const { name, category, cost_price, sell_price, current_stock } = req.body;

  try {
    // Insert product first without SKU
    const [result] = await db.execute(
      `INSERT INTO products (name, category, cost_price, sell_price, current_stock) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, category, cost_price, sell_price, current_stock]
    );

    const sku = `${category.slice(0,3).toUpperCase()}-${id.toString().padStart(4, '0')}`;


    // Update SKU after ID is known
    await db.execute('UPDATE products SET sku = ? WHERE id = ?', [sku, result.insertId]);

    res.json({ success: true, sku });
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

