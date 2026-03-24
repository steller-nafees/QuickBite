// Load environment variables
require('dotenv').config();

// Import Express
const express = require('express');
const app = express();

// Import database connection
// const db = require('./config/db');

// Test route
app.get('/', (req, res) => {
    res.send('QuickBite Backend Running!');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Derver running on port ${PORT}`);
});