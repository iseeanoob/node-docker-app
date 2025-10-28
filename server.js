const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey";

// DB config
const DB_CONFIG = {
  host: process.env.DB_HOST || "db",
  user: process.env.DB_USER || "iseeanoob",
  password: process.env.DB_PASSWORD || "pass",
  database: process.env.DB_NAME || "mydb",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// 🔁 Retry MySQL connection until successful
async function connectWithRetry(retries = 10, delay = 5000) {
  for (let i = 1; i <= retries; i++) {
    try {
      const pool = mysql.createPool(DB_CONFIG);
      const conn = await pool.getConnection();
      console.log("✅ Connected to MySQL!");

      // USERS table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL
        )
      `);

      // POSTS table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS posts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          text VARCHAR(255) NOT NULL,
          emojis TEXT NOT NULL,
          createdAt BIGINT NOT NULL,
          edited BOOLEAN DEFAULT FALSE
        )
      `);

      // REQUESTS table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS requests (
          id INT AUTO_INCREMENT PRIMARY KEY,
          feeling VARCHAR(255) NOT NULL,
          createdAt BIGINT NOT NULL,
          reviewed BOOLEAN DEFAULT FALSE
        )
      `);

      conn.release();
      console.log("✅ Tables ready");
      return pool;
    } catch (err) {
      console.log(`❌ MySQL not ready (attempt ${i}/${retries}): ${err.code}`);
      if (i === retries) {
        console.error("❌ Failed to connect to MySQL after multiple attempts");
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

let pool;

// Initialize
(async () => {
  pool = await connectWithRetry();

  // ---------- ROOT ----------
  app.get("/", (req, res) => {
    res.send("🚀 Node + MySQL App Running");
  });

  // ---------- USERS ----------
  app.post("/register", async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: "All fields required" });

    try {
      const hashed = await bcrypt.hash(password, 10);
      const [result] = await pool.query(
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
        [username, email, hashed]
      );
      res.json({ id: result.insertId, username, email });
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        res.status(400).json({ error: "Email already exists" });
      } else {
        res.status(500).json({ error: err.message });
      }
    }
  });

  app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email & password required" });

    try {
      const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
      if (rows.length === 0)
        return res.status(404).json({ error: "User not found" });

      const user = rows[0];
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: "Invalid password" });

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });
      res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/users", async (req, res) => {
    try {
      const [rows] = await pool.query("SELECT id, username, email FROM users");
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/users/:id", async (req, res) => {
    try {
      const [rows] = await pool.query("SELECT id, username, email FROM users WHERE id = ?", [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ error: "User not found" });
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/users/:id", async (req, res) => {
    try {
      const [result] = await pool.query("DELETE FROM users WHERE id = ?", [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "User not found" });
      res.json({ message: "User deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ---------- POSTS ----------
  app.get("/posts", async (req, res) => {
    try {
      const [rows] = await pool.query("SELECT * FROM posts ORDER BY createdAt DESC");
      const posts = rows.map(r => ({ ...r, emojis: JSON.parse(r.emojis) }));
      res.json(posts);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/posts", async (req, res) => {
    const { text, emojis } = req.body;
    if (!text || !emojis) return res.status(400).json({ error: "Missing fields" });

    try {
      const [result] = await pool.query(
        "INSERT INTO posts (text, emojis, createdAt) VALUES (?, ?, ?)",
        [text, JSON.stringify(emojis), Date.now()]
      );
      res.json({ id: result.insertId, text, emojis, createdAt: Date.now(), edited: false });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/posts/:id", async (req, res) => {
    try {
      const [result] = await pool.query("DELETE FROM posts WHERE id = ?", [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "Post not found" });
      res.json({ message: "Post deleted" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ---------- REQUESTS ----------
  app.get("/requests", async (req, res) => {
    try {
      const [rows] = await pool.query("SELECT * FROM requests ORDER BY createdAt DESC");
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/requests", async (req, res) => {
    const { feeling } = req.body;
    if (!feeling) return res.status(400).json({ error: "Feeling required" });

    try {
      const [result] = await pool.query(
        "INSERT INTO requests (feeling, createdAt) VALUES (?, ?)",
        [feeling, Date.now()]
      );
      res.json({ id: result.insertId, feeling, createdAt: Date.now(), reviewed: false });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/requests/:id/review", async (req, res) => {
    try {
      const [result] = await pool.query("UPDATE requests SET reviewed = TRUE WHERE id = ?", [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "Request not found" });
      res.json({ message: "Request marked as reviewed" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/requests/:id", async (req, res) => {
    try {
      const [result] = await pool.query("DELETE FROM requests WHERE id = ?", [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "Request not found" });
      res.json({ message: "Request deleted" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ---------- START SERVER ----------
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
})();

// Graceful shutdown
process.on("SIGTERM", async () => {
  if (pool) await pool.end();
  process.exit(0);
});
