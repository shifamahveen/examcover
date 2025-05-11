const fs = require('fs');
const path = require('path');
const logFilePath = path.join(__dirname, '../../logs/activity.log');
const trustScoreFilePath = path.join(__dirname, '../../logs/trustScore.json');

let lastLogTimestamp = null;
const debounceInterval = 1000; // 1 second debounce window

function logEvent(message) {
  const currentTimestamp = new Date().toISOString();

  if (lastLogTimestamp === null || (new Date() - new Date(lastLogTimestamp)) > debounceInterval) {
    const logMessage = `[${currentTimestamp}] ${message}\n`;

    fs.mkdir(path.dirname(logFilePath), { recursive: true }, (err) => {
      if (err) {
        console.error('Error creating log directory:', err);
        return;
      }

      fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) {
          console.error('Error writing to log file:', err);
        }
      });
    });

    lastLogTimestamp = currentTimestamp;
  }
}

async function saveSnapshot(imageData) {
  const fetch = (await import('node-fetch')).default;

  fetch('http://localhost:3000/save-snapshot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageData })
  })
    .then(response => response.text())
    .then(data => {
      console.log(data);
      logEvent('Snapshot captured');
    })
    .catch(error => console.error('Error saving snapshot:', error));
}

async function saveVideo(videoData) {
  const fetch = (await import('node-fetch')).default;

  fetch('http://localhost:3000/save-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ video: videoData })
  })
    .then(response => response.json())
    .then(data => {
      console.log(data);
      logEvent('Video captured');
    })
    .catch(error => console.error('Error saving video:', error));
}

async function logViolation(trustScore, trustLabel, violations) {
    const fetch = (await import('node-fetch')).default;
  
    const logData = { trustScore, trustLabel, violations };
  
    console.log('Attempting to write to trustScore.json at path:', trustScoreFilePath);
  
    // Write a static test log to ensure fs.writeFile works
    fs.writeFile(trustScoreFilePath, 'Test log entry to verify file writing functionality.', 'utf8', (writeErr) => {
      if (writeErr) {
        console.error('Error writing test entry to trust score file:', writeErr);
      } else {
        console.log('Test log entry written successfully');
      }
    });
  
    // Now proceed to write actual log data
    fs.mkdir(path.dirname(trustScoreFilePath), { recursive: true }, (dirErr) => {
      if (dirErr) {
        console.error('Error creating directory for trust score file:', dirErr);
        return;
      }
  
      // Log the actual data to the trustScore.json file
      console.log('Writing actual log data:', logData);
      
      fs.writeFile(trustScoreFilePath, JSON.stringify(logData, null, 2), 'utf8', (writeErr) => {
        if (writeErr) {
          console.error('Error writing to trust score file:', writeErr);
        } else {
          console.log('Trust score updated successfully');
        }
      });
    });
  
    // Now handle the fetch request and verify the response
    try {
      const response = await fetch('http://localhost:3000/api/logViolation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      });
  
      console.log('HTTP Response Status:', response.status);  // Log status code
      const textResponse = await response.text();  // Get the raw response as text
      console.log('Raw server response:', textResponse);
  
      if (response.ok) {
        console.log('Violation logged on server:', textResponse);
      } else {
        console.error('Server responded with an error:', textResponse);
      }
    } catch (error) {
      console.error('Error logging violation:', error);
    }
  }
  

module.exports = {
  logEvent,
  saveSnapshot,
  saveVideo,
  logViolation
};
