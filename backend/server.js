const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/authRoutes');
const courtRoutes = require('./routes/courtRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'login.html'));
});

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/courts', courtRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api', analyticsRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
