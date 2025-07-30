const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const db = require('./db'); // path may vary if inside `routes/`


app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('EGYA Inventory Backend is running');
});

// ROUTES
const productRoutes = require('./routes/products');
app.use('/api/products', productRoutes);

const salesRoutes = require('./routes/sales');
app.use('/api/sales', salesRoutes);

app.use('/api/analytics', require('./routes/analytics'));

// 📊 Dashboard Summary Endpoint
app.get('/api/analytics/summary', async (req, res) => {
    try {
      // Total products
      const [totalProducts] = await db.execute(`SELECT COUNT(*) as count FROM products`);
      
      // Total sales (sum of sales table amounts or computed from quantities * price)
      const [totalSales] = await db.execute(`SELECT SUM(quantity * sell_price) as total FROM sales 
        JOIN products ON sales.product_id = products.id`);
      
      // Total profit (sell price - cost price)
      const [totalProfit] = await db.execute(`SELECT SUM((sell_price - cost_price) * quantity) as profit FROM sales 
        JOIN products ON sales.product_id = products.id`);
      
      // Low stock (threshold <= 5)
      const [lowStock] = await db.execute(`SELECT COUNT(*) as count FROM products WHERE current_stock <= 5`);
      
      res.json({
        totalProducts: totalProducts[0]?.count || 0,
        totalSales: totalSales[0]?.total || 0,
        totalProfit: totalProfit[0]?.profit || 0,
        lowStock: lowStock[0]?.count || 0
      });
    } catch (err) {
      console.error("Error fetching summary:", err);
      res.status(500).json({ error: "Failed to fetch summary" });
    }
  });
  

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const inventoryRoutes = require('./routes/inventory');
app.use('/api/inventory', inventoryRoutes);

app.get('/api/sales/history/:productId', async (req, res) => {
    const { productId } = req.params;
  
    try {
      const [rows] = await db.execute(`
        SELECT quantity, platform, date AS date_sold
        FROM sales
        WHERE product_id = ?
        ORDER BY date DESC
      `, [productId]);
  
      res.json(rows);
    } catch (err) {
      console.error('Error fetching sales history:', err);
      res.status(500).json({ error: 'Failed to fetch sales history' });
    }
  });
  

  const returnsRoutes = require('./routes/returns');
  app.use('/api/returns', returnsRoutes);
  
  const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

  