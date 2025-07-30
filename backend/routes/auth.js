const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

// 🔑 Auto-create default admin if not exists
(async () => {
  try {
    const [rows] = await db.execute(`SELECT * FROM users WHERE username = 'admin'`);
    if (rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.execute(`INSERT INTO users (username, password) VALUES (?, ?)`, [
        'admin',
        hashedPassword
      ]);
      console.log('✅ Default admin created: username=admin, password=admin123');
    }
  } catch (err) {
    console.error('Error checking/creating default admin:', err);
  }
})();

// 🛠 Login Route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.execute(`SELECT * FROM users WHERE username = ?`, [username]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.json({ token: 'fake-jwt-token', username: user.username });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
