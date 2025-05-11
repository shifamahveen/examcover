// Audio context and analyzer
let audioContext;
let analyser;
let microphone;
let javascriptNode;
let isListening = false;
let isTalking = false;
let volumeInterval;
let silenceCounter = 0;
let talkingCounter = 0;
let lastTalkTime = null;

// DOM elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const status = document.getElementById('status');
const volumeMeter = document.getElementById('volumeMeter');
const logs = document.getElementById('logs');
const thresholdInput = document.getElementById('threshold');
const intervalInput = document.getElementById('interval');

// Event listeners
startBtn.addEventListener('click', startListening);
stopBtn.addEventListener('click', stopListening);

// Helper function to add log entry
function addLog(message) {
  const now = new Date();
  const timestamp = now.toLocaleTimeString();
  const logEntry = document.createElement('div');
  logEntry.className = 'log-entry';
  logEntry.textContent = `[${timestamp}] ${message}`;
  logs.appendChild(logEntry);
  logs.scrollTop = logs.scrollHeight;

  // Save log to file (if using Tauri API)
  if (window.__TAURI__) {
    // Log to a file using Tauri's API
    window.__TAURI__.invoke('log_to_file', {
      timestamp: now.toISOString(),
      message: message,
    });
  }
}

// Start listening for audio
async function startListening() {
  try {
    // Get user's microphone permission
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    // Create audio nodes
    microphone = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;

    // Connect nodes
    microphone.connect(analyser);

    // Update UI
    startBtn.disabled = true;
    stopBtn.disabled = false;
    status.className = 'status listening';
    status.textContent = 'Status: Listening (No speech detected)';
    isListening = true;

    addLog('Started audio monitoring');

    // Start volume monitoring loop
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Clear previous interval if exists
    if (volumeInterval) clearInterval(volumeInterval);

    // Check volume at regular intervals
    volumeInterval = setInterval(() => {
      if (!isListening) return;

      analyser.getByteFrequencyData(dataArray);

      // Calculate volume level (average of frequency data)
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      const volume = average / 256; // Normalize to 0-1

      // Update volume meter
      volumeMeter.style.width = `${volume * 100}%`;

      // Get threshold from input
      const threshold = parseFloat(thresholdInput.value);

      // Check if speaking
      if (volume > threshold) {
        silenceCounter = 0;
        talkingCounter++;

        // If talking for more than 3 consecutive checks, consider it speech
        if (talkingCounter > 3 && !isTalking) {
          isTalking = true;
          status.className = 'status talking';
          status.textContent = 'Status: Speech Detected!';
          lastTalkTime = new Date();
          addLog('Speech detected');

          // Fire system notification if Tauri is available
          if (window.__TAURI__) {
            window.__TAURI__.invoke('notify', {
              title: 'Speech Detected',
              body: 'Someone is talking in the background',
            });
          }
        }
      } else {
        talkingCounter = 0;
        silenceCounter++;

        // If silence for more than 10 consecutive checks, consider it silence
        if (silenceCounter > 10 && isTalking) {
          isTalking = false;
          status.className = 'status listening';
          status.textContent = 'Status: Listening (No speech detected)';

          if (lastTalkTime) {
            const duration = Math.round((new Date() - lastTalkTime) / 1000);
            addLog(`Speech ended (lasted ~${duration} seconds)`);
          }
        }
      }
    }, parseInt(intervalInput.value));
  } catch (error) {
    console.error('Error accessing microphone', error);
    addLog(`Error: ${error.message}`);
    stopListening();
  }
}

// Stop listening for audio
function stopListening() {
  if (!isListening) return;

  // Clean up audio context
  if (microphone) {
    microphone.disconnect();
  }

  if (volumeInterval) {
    clearInterval(volumeInterval);
  }

  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close();
  }

  // Update UI
  startBtn.disabled = false;
  stopBtn.disabled = true;
  status.className = 'status idle';
  status.textContent = 'Status: Idle';
  volumeMeter.style.width = '0%';
  isListening = false;
  isTalking = false;

  addLog('Stopped audio monitoring');
}

// Log when app starts
window.addEventListener('DOMContentLoaded', () => {
  addLog('Application loaded and ready');
});
