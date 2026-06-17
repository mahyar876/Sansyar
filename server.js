const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();

// ── MIDDLEWARE ──
app.use(cors({
  origin: '*',
  credentials: true,
}));

app.use(express.json());

// ── RATE LIMIT ──
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
});
// app.use('/api/auth/', authLimiter);  

const path = require('path');

app.use(express.static(path.join(__dirname)));

// ── ROUTES ──
app.use('/api/auth', require('./auth'));
app.use('/api/pitches', require('./pitches'));
app.use('/api/reservations', require('./reservations'));

// ── HEALTH ──
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    db: mongoose.connection.readyState === 1,
  });
});

// ── DB ──
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

// ── START ──
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
