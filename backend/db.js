const mysql = require('mysql2');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'youruser',
  password: 'yourpass',
  database: 'egya_inventory'
});

module.exports = pool.promise();
