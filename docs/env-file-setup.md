## Environment Setup (.env) Guide

This section explains how to safely handle environment variables so the project works for everyone without exposing sensitive data.

---

### Why `.env` is NOT pushed

* The `.env` file contains **private credentials** such as database password and JWT secret.
* Pushing it to GitHub can expose your database and authentication system.

---

### Step 1: Use `.env.example`

A template file called `.env.example` is included in the project.

---

### Step 2: Create Your Own `.env`

After cloning the project, create your own `.env` file:

```bash
cp .env.example .env
```

---

### Step 3: Update Values

Edit `.env` based on your local setup:

* Set your database password (XAMPP default is usually empty). 
* Set your own JWT secret (any random secure string)

Example:

```env
DB_PASSWORD=
JWT_SECRET=mysecret123
```

---

### Step 4: Ensure `.env` is Ignored

Make sure `.gitignore` contains:

```
.env
```

This prevents accidental uploads of sensitive data.

---

### Every developer must create their own `.env`
