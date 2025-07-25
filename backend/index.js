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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
