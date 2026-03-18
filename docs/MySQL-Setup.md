# QuickBite Backend Setup with XAMPP

This document explains how to set up the **QuickBite backend** and connect it to **XAMPP MySQL**, step by step.

---

## Step 1: Install & Start XAMPP

1. Download and install [XAMPP](https://www.apachefriends.org/index.html) for your operating system.
2. Open **XAMPP Control Panel**.
3. Start the **MySQL** module.
4. Optionally, start **Apache** if you want to run any PHP tools or test web pages.

---

## Step 2: Create the QuickBite Database

1. Open **phpMyAdmin**: `http://localhost/phpmyadmin`
2. Click on **Databases** → **Create database**
3. Name it: `quickbite_db`
4. Click **Create**.
5. Optional: Create a MySQL user with a password, or use the default `root` user (empty password in XAMPP).

---

## Step 3: Create the `.env` File

1. In the **root of your project** (`QuickBite/`), create a file named `.env`.
2. Add the following content:

```env
# ========================
# NEVER COMMIT REAL SECRETS TO VERSION CONTROL
# ========================

# ========================
# SERVER CONFIG
# ========================
PORT=5000
NODE_ENV=development

# ========================
# DATABASE CONFIG
# ========================
DB_HOST=localhost
DB_PORT=3307
DB_NAME=quickbite_db
DB_USER=root
DB_PASSWORD=

# ========================
# JWT / AUTH CONFIG
# ========================
JWT_SECRET=supersecretkey123
JWT_EXPIRES_IN=7d

# ========================
# SIMULATED PAYMENT (optional)
# ========================
SIMULATED_PAYMENT_API_KEY=test_payment_key
```

**Notes:**

* `DB_PORT=3306` → Default for XAMPP MySQL
* `DB_USER=root` → Default XAMPP user
* `DB_PASSWORD=` → Empty for XAMPP root user

---

## Step 4: Install Node.js Dependencies

1. Open terminal/command prompt.
2. Navigate to the backend folder:

```bash
cd QuickBite/server
```

3. Install dependencies:

```bash
npm install express mysql2 dotenv
```

4. Optional: Install **nodemon** for development auto-restart:

```bash
npm install -D nodemon
```

5. Update `server/package.json` scripts:

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

---

## Step 5: Create Database Connection File

1. Create a file: `server/src/config/db.js`
2. Add the following code:

```javascript
const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Connected to MySQL database!');
    }
});

module.exports = db;
```

---

## Step 6: Start the Backend

1. In terminal, inside `server/` folder:

```bash
npm run dev
```

2. You should see:

```
Connected to MySQL database!
```

3. Backend is now running at `http://localhost:5000` (or the port you specified in `.env`).

---

## Notes & Tips

* **JWT:** Needed later for login and route protection. Use `JWT_SECRET` from `.env`.
* **Ports:**

  * `PORT` → Your Node.js backend port, can be any free port.
  * `DB_PORT` → MySQL default for XAMPP is 3306.
* Keep `.env` **out of Git** for security.
* Use **nodemon** in development to auto-restart the backend on file changes.
