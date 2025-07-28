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
  


  