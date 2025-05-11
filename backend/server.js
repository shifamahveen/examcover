const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const logger = require('./routes/logger');

const app = express();
const PORT = 3000;
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'aaed79b33794695ffbc2f8cb62d47ce23f21939b0f7b2dbaf22274ff79d8f161e089dbb033bd60651204f21f3fafb4654e5523887bf58e4e6e0562104e4c2565',
  resave: false,
  saveUninitialized: false
}));

// Serve static files
app.use(express.static(path.join(__dirname, '../src')));

/// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Home Page");
});

app.get("/register", (req, res) => {
  res.render("register");
});

// Directories
const snapshotDir = path.join(__dirname, 'snapshots');
const videoDir = path.join(__dirname, 'videos');
if (!fs.existsSync(snapshotDir)) fs.mkdirSync(snapshotDir);
if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir);

// Logging endpoints
app.post('/log-event', (req, res) => {
  const { log } = req.body;
  if (log) {
    logger.logEvent(log);
    res.status(200).json({ message: 'Log saved' });
  } else {
    res.status(400).json({ error: 'Log message is required' });
  }
});

// Save snapshot
app.post('/save-snapshot', (req, res) => {
  const { image } = req.body;
  const base64Data = image.replace(/^data:image\/jpeg;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  const filename = `snapshot-${Date.now()}.jpg`;
  const filepath = path.join(snapshotDir, filename);

  fs.writeFile(filepath, buffer, (err) => {
    if (err) return res.status(500).send('Error saving image');
    res.send('Image saved');
  });
});

// Save video
app.post('/save-video', (req, res) => {
  const { video } = req.body;
  const base64Data = video.replace(/^data:video\/webm;base64,/, '');
  const filename = `video-${Date.now()}.webm`;
  const filepath = path.join(videoDir, filename);

  fs.writeFile(filepath, base64Data, 'base64', (err) => {
    if (err) return res.status(500).send('Error saving video');
    res.json({ success: true, filename });
  });
});

// Trust log
const logFilePath = path.join(__dirname, 'trustScore.json');
app.post('/api/logViolation', (req, res) => {
  const logData = req.body;

  fs.readFile(logFilePath, 'utf8', (err, data) => {
    let log = { trustScore: 0, trustLabel: '', violations: [] };

    if (data) {
      try {
        log = JSON.parse(data);
      } catch {
        return res.status(500).send('Error parsing log file');
      }
    }

    log.trustScore = logData.trustScore;
    log.trustLabel = logData.trustLabel;
    log.violations = logData.violations;

    fs.writeFile(logFilePath, JSON.stringify(log, null, 2), 'utf8', (writeErr) => {
      if (writeErr) return res.status(500).send('Error writing log file');
      res.status(200).send('Log updated');
    });
  });
});

// Start
app.listen(PORT, () => {
  console.log(`Backend server is running at http://localhost:${PORT}`);
});
