const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
app.use(express.json());

// Connect to SQLite (creates database.db if it doesn’t exist)
const dbPath = path.resolve(__dirname, "database.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Could not connect to database", err);
  } else {
    console.log("✅ Connected to SQLite database");
  }
});

// Create a table if it doesn’t exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL
  )`);
});

// Routes

// Home
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Home - Node + SQLite App</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #72EDF2, #5151E5);
          color: #fff;
          text-align: center;
          padding: 50px;
        }
        h1 {
          font-size: 3rem;
          margin-bottom: 30px;
          text-shadow: 2px 2px #00000033;
        }
        a.button {
          display: inline-block;
          background: #fff;
          color: #5151E5;
          padding: 15px 30px;
          margin: 20px;
          text-decoration: none;
          font-weight: bold;
          border-radius: 10px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        a.button:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.3);
        }
      </style>
    </head>
    <body>
      <h1>🚀 Node + SQLite App</h1>
      <a class="button" href="/users">Go to Users Page</a>
    </body>
    </html>
  `);
});



// Add a user
app.post("/users", (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }
  db.run("INSERT INTO users (name, email) VALUES (?, ?)", [name, email], function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ id: this.lastID, name, email });
  });
});

// Get all users
app.get("/users", (req, res) => {
  db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    let usersList = rows.map(user => `
      <li>
        <strong>${user.name}</strong> (<em>${user.email}</em>)
      </li>
    `).join("");

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Users - Node + SQLite App</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #FFDEE9, #B5FFFC);
            color: #333;
            text-align: center;
            padding: 50px;
          }
          h1 {
            font-size: 2.5rem;
            margin-bottom: 30px;
          }
          ul {
            list-style: none;
            padding: 0;
            margin-bottom: 30px;
          }
          li {
            background: #fff;
            margin: 10px auto;
            padding: 15px 25px;
            max-width: 400px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            font-size: 1.2rem;
          }
          a.button {
            display: inline-block;
            background: #5151E5;
            color: #fff;
            padding: 12px 25px;
            text-decoration: none;
            font-weight: bold;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            transition: transform 0.2s, box-shadow 0.2s;
          }
          a.button:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.3);
          }
        </style>
      </head>
      <body>
        <h1>📋 Users List</h1>
        <ul>
          ${usersList || "<li>No users found</li>"}
        </ul>
        <a class="button" href="/">Back to Home</a>
      </body>
      </html>
    `);
  });
});



// Get user by ID
app.get("/users/:id", (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(row);
  });
});

// Delete user
app.delete("/users/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
