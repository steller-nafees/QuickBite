require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const crypto = require('crypto');

const app = express();

const PORT = Number(process.env.PORT) || 5000;
const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'client', 'public');
const CLIENT_SRC_DIR = path.resolve(__dirname, '..', '..', 'client', 'src');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    next();
});

app.use(express.static(PUBLIC_DIR));
/* HTML under / uses ../src which browsers resolve to /src/... — must serve client/src */
app.use('/src', express.static(CLIENT_SRC_DIR));

function isValidEmail(email) {
    return /.+@.+\..+/.test(String(email || '').trim());
}

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function sanitizeRole(role) {
    if (role === 'vendor') return 'vendor';
    if (role === 'admin') return 'admin';
    return 'customer';
}

function getRedirectForRole(role) {
    if (role === 'vendor') return '/vendor-dashboard.html';
    if (role === 'admin') return '/admin-dashboard.html';
    return '/customer-dashboard.html';
}

async function ensureUsersFile() {
    await fsp.mkdir(DATA_DIR, { recursive: true });

    try {
        await fsp.access(USERS_FILE);
    } catch (error) {
        await fsp.writeFile(USERS_FILE, '[]', 'utf8');
    }
}

async function readUsers() {
    await ensureUsersFile();
    const raw = await fsp.readFile(USERS_FILE, 'utf8');

    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

async function writeUsers(users) {
    await fsp.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

function scryptHash(password) {
    const salt = crypto.randomBytes(16);
    const keyLen = 64;
    const N = 16384;
    const r = 8;
    const p = 1;

    return new Promise((resolve, reject) => {
        crypto.scrypt(password, salt, keyLen, { N, r, p }, (err, derivedKey) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(`scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${derivedKey.toString('base64')}`);
        });
    });
}

function verifyScryptHash(password, storedHash) {
    try {
        const parts = String(storedHash || '').split('$');
        if (parts.length !== 6 || parts[0] !== 'scrypt') {
            return Promise.resolve(false);
        }

        const N = Number(parts[1]);
        const r = Number(parts[2]);
        const p = Number(parts[3]);
        const salt = Buffer.from(parts[4], 'base64');
        const expected = Buffer.from(parts[5], 'base64');

        return new Promise((resolve) => {
            crypto.scrypt(password, salt, expected.length, { N, r, p }, (err, derivedKey) => {
                if (err) {
                    resolve(false);
                    return;
                }

                if (derivedKey.length !== expected.length) {
                    resolve(false);
                    return;
                }

                resolve(crypto.timingSafeEqual(derivedKey, expected));
            });
        });
    } catch (error) {
        return Promise.resolve(false);
    }
}

app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'quickbite-auth' });
});

app.post('/api/auth/check-email', async (req, res) => {
    const email = normalizeEmail(req.body.email);

    if (!isValidEmail(email)) {
        return res.status(400).json({ ok: false, message: 'Invalid email format.' });
    }

    const users = await readUsers();
    const exists = users.some((user) => user.email === email);

    return res.json({ ok: true, available: !exists });
});

app.post('/api/auth/register', async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const fullName = String(req.body.fullName || '').trim();
    const password = String(req.body.password || '');
    const phone = String(req.body.phone || '').trim();
    const role = sanitizeRole(req.body.role);

    if (!isValidEmail(email)) {
        return res.status(400).json({ ok: false, message: 'Please provide a valid email.' });
    }

    if (!fullName || !phone || !password) {
        return res.status(400).json({ ok: false, message: 'All required fields must be filled.' });
    }

    if (password.length < 8) {
        return res.status(400).json({ ok: false, message: 'Password must be at least 8 characters.' });
    }

    const users = await readUsers();
    const existing = users.find((user) => user.email === email);

    if (existing) {
        return res.status(409).json({ ok: false, message: 'Email already exists.' });
    }

    const passwordHash = await scryptHash(password);
    const newUser = {
        id: Date.now(),
        fullName,
        email,
        phone,
        role,
        passwordHash,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await writeUsers(users);

    return res.status(201).json({
        ok: true,
        message: 'Account created successfully.',
        user: {
            id: newUser.id,
            fullName: newUser.fullName,
            email: newUser.email,
            role: newUser.role
        },
        redirectTo: getRedirectForRole(newUser.role)
    });
});

app.post('/api/auth/login', async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!isValidEmail(email) || !password) {
        return res.status(400).json({ ok: false, message: 'Email and password are required.' });
    }

    const users = await readUsers();
    const user = users.find((entry) => entry.email === email);

    if (!user) {
        return res.status(401).json({ ok: false, message: 'Invalid email or password.' });
    }

    const valid = await verifyScryptHash(password, user.passwordHash);
    if (!valid) {
        return res.status(401).json({ ok: false, message: 'Invalid email or password.' });
    }

    return res.json({
        ok: true,
        message: 'Login successful.',
        user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role
        },
        redirectTo: getRedirectForRole(user.role)
    });
});

app.get('/customer-dashboard.html', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'customer-dashboard.html'));
});

app.get('/vendor-dashboard.html', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'vendor-dashboard.html'));
});

app.get('/admin-dashboard.html', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'admin-dashboard.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
    const vendorDash = path.join(PUBLIC_DIR, 'vendor-dashboard.html');
    if (!fs.existsSync(vendorDash)) {
        console.warn('QuickBite: vendor-dashboard.html not found at', vendorDash);
    }
    console.log(`QuickBite server running on port ${PORT}`);
    console.log(`Serving static files from ${PUBLIC_DIR}`);
    console.log(`Serving /src from ${CLIENT_SRC_DIR}`);
});

