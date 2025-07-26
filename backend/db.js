const mysql = require('mysql2');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'wildflowers',
  database: 'egya_inventory'
});

module.exports = pool.promise();
