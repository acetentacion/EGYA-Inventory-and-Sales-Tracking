const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

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
