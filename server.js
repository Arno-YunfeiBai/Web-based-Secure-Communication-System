// server.js 增强版：添加密钥存储与查询功能
const express = require('express');
const fs = require('fs');
const https = require('https');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

const saltRounds = 12;

mongoose.connect('mongodb://localhost:27017/securetalk', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  key: String,   // base64-encoded JWK
  iv: String     // base64-encoded IV
});

const messageSchema = new mongoose.Schema({
  from: String,
  to: String,
  encrypted: String,
  timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);

// Clear all messages when server starts
async function clearAllMessages() {
  try {
    await Message.deleteMany({});
  } catch (err) {
    console.error('Error clearing messages:', err);
  }
}

// Call the cleanup function when server starts
clearAllMessages();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).send('Username already exists');
    const hashed = await bcrypt.hash(password, saltRounds);
    const newUser = new User({ username, password: hashed });
    await newUser.save();
    res.send('Registered successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).send('User not found');
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(403).send('Wrong password');
    res.send('Login successful');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.post('/storekey', async (req, res) => {
  const { username, key, iv } = req.body;
  if (!username || !key || !iv) return res.status(400).send('Missing key or iv');

  try {
    await User.updateOne({ username }, { key, iv });
    res.send('Key stored');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to store key');
  }
});

app.post('/getkey', async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).send('Missing username');

  try {
    const user = await User.findOne({ username });
    if (!user || !user.key || !user.iv) return res.status(404).send('Key not found');
    res.json({ key: user.key, iv: user.iv });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to retrieve key');
  }
});

app.post('/send', async (req, res) => {
  const { from, to, encrypted } = req.body;
  if (!from || !to || !encrypted) return res.status(400).send('Missing fields');
  try {
    const msg = new Message({ from, to, encrypted });
    await msg.save();
    res.send('Message stored');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to store message');
  }
});

app.post('/receive', async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).send('Missing username');
  try {
    const messages = await Message.find({ to: username }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to retrieve messages');
  }
});

const httpsOptions = {
  key: fs.readFileSync('./localhost+2-key.pem'),
  cert: fs.readFileSync('./localhost+2.pem'),
};

https.createServer(httpsOptions, app).listen(443, () => {
  console.log('Server running on https://localhost');
});
