const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');
const faceCount = document.getElementById('faceCount');
const audioStatus = document.getElementById('audioStatus');
const recordingCanvas = document.getElementById('recordingCanvas');
const recordingCtx = recordingCanvas.getContext('2d');

let stream = null;
let detectInterval = null;
let mediaRecorder;
let recordedChunks = [];
let lastLogTimestamp = null;
const debounceInterval = 1000;

const detectionOptions = new faceapi.TinyFaceDetectorOptions({
  inputSize: 224,
  scoreThreshold: 0.5,
});

const violationCounts = {
  speech: 0,
  faceMissing: 0,
  multipleFaces: 0,
  mouseOutsideWindow: 0,
  fullscreenExit: 0,
  copyAction: 0,
};

const violationDetails = {
  speech: { type: 'Speech', negativeScore: 1 },
  faceMissing: { type: 'Face Missing', negativeScore: 2 },
  multipleFaces: { type: 'Multiple Faces', negativeScore: 3 },
  mouseOutsideWindow: { type: 'Mouse Off-Screen', negativeScore: 1.5 },
  fullscreenExit: { type: 'Fullscreen Exit', negativeScore: 1 },
  copyAction: { type: 'Copy Action', negativeScore: 2 },
};

function updateTrustDisplay() {
  const baseScore = 10.0;
  const totalDeduction =
    (violationCounts.speech * violationDetails.speech.negativeScore) +
    (violationCounts.faceMissing * violationDetails.faceMissing.negativeScore) +
    (violationCounts.multipleFaces * violationDetails.multipleFaces.negativeScore) +
    (violationCounts.fullscreenExit * violationDetails.fullscreenExit.negativeScore) +
    (violationCounts.copyAction * violationDetails.copyAction.negativeScore) +
    (violationCounts.mouseOutsideWindow * violationDetails.mouseOutsideWindow.negativeScore);

  let score = baseScore - totalDeduction;
  if (score < 0) score = 0;
  if (score > 10) score = 10;

  let trustLabel = "";
  if (score >= 8.0) trustLabel = "High Trust";
  else if (score >= 5.0) trustLabel = "Moderate Trust";
  else if (score >= 2.0) trustLabel = "Low Trust";
  else trustLabel = "Very Low Trust";

  const trustElement = document.getElementById("trustScore");
  if (trustElement) {
    trustElement.innerHTML = `
      <p class="text-sm">Speech Violations: ${violationCounts.speech}</p>
      <p class="text-sm">No Face Detected: ${violationCounts.faceMissing}</p>
      <p class="text-sm">Multiple Faces: ${violationCounts.multipleFaces}</p>
      <p class="text-sm">Full Screen Exit: ${violationCounts.fullscreenExit}</p>
      <p class="text-sm">Copy Action: ${violationCounts.copyAction}</p>
      <p class="text-sm">Mouse Outside Window: ${violationCounts.mouseOutsideWindow}</p>
      <p class="mt-1 font-semibold text-red-700">Trust Score: ${score.toFixed(1)} (${trustLabel})</p>
    `;
  }

  updateLogFile(score, trustLabel);  
}


function logEvent(message) {
  const currentTimestamp = new Date().toISOString();

  if (lastLogTimestamp === null || (new Date() - new Date(lastLogTimestamp)) > debounceInterval) {
    fetch('http://localhost:3000/log-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ log: `[${currentTimestamp}] ${message}` })
    }).then(response => response.json())
      .then(data => console.log('Log saved:', data))
      .catch(error => console.error('Log error:', error));

    lastLogTimestamp = currentTimestamp;
  }
}

function logViolation(type, message) {
  if (type === "speech") violationCounts.speech++;
  else if (type === "faceMissing") violationCounts.faceMissing++;
  else if (type === "multipleFaces") violationCounts.multipleFaces++;
  else if (type === "mouseOutsideWindow") violationCounts.mouseOutsideWindow++;
  else if (type === "fullscreenExit") violationCounts.fullscreenExit++;
  else if (type === "copyAction") violationCounts.copyAction++;

  logEvent(message);
  updateTrustDisplay();
}

function updateLogFile(score, trustLabel) {
  const logData = {
    trustScore: score,
    trustLabel: trustLabel,
    violations: [
      { type: violationDetails.speech.type, number: violationCounts.speech, negativeScore: violationDetails.speech.negativeScore },
      { type: violationDetails.mouseOutsideWindow.type, number: violationCounts.mouseOutsideWindow, negativeScore: violationDetails.mouseOutsideWindow.negativeScore },
      { type: violationDetails.fullscreenExit.type, number: violationCounts.fullscreenExit, negativeScore: violationDetails.fullscreenExit.negativeScore },
      { type: violationDetails.faceMissing.type, number: violationCounts.faceMissing, negativeScore: violationDetails.faceMissing.negativeScore },
      { type: violationDetails.copyAction.type, number: violationCounts.copyAction, negativeScore: violationDetails.copyAction.negativeScore },
      { type: violationDetails.multipleFaces.type, number: violationCounts.multipleFaces, negativeScore: violationDetails.multipleFaces.negativeScore },
    ]
  };

  // Send log data to the backend server
  fetch('/api/logViolation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(logData),  // Send the log data in the request body
  })
    .then(response => response.json())
    .then(data => console.log('Log file updated successfully', data))
    .catch(error => console.error('Error updating log file:', error));
}

window.addEventListener('blur', () => {
  logViolation('mouseOutsideWindow', 'Mouse Outside Window detected');
});

document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) {
    logViolation('fullscreenExit', 'Fullscreen Exit detected');
  }
});

document.addEventListener('copy', () => {
  logViolation('copyAction', 'Copy Action detected');
});

document.addEventListener('contextmenu', (e) => {
  logViolation('copyAction', 'Context menu opened (possible copy intent)');
});

document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) {
    logViolation('fullscreenExit', "Exited fullscreen mode");
  }
});

document.addEventListener("webkitfullscreenchange", () => {
  if (!document.webkitFullscreenElement) {
    logViolation('fullscreenExit', "Exited fullscreen mode");
  }
});

document.addEventListener("msfullscreenchange", () => {
  if (!document.msFullscreenElement) {
    logViolation('fullscreenExit', "Exited fullscreen mode");
  }
});

async function loadModels() {
  let modelPath = '../models/face-detection';
  try {
    const res = await fetch('models/tiny_face_detector_model-weights_manifest.json');
    if (!res.ok) throw new Error();
  } catch {
    modelPath = 'https://justadudewhohacks.github.io/face-api.js/models';
  }

  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
  ]);
}

async function startCamera() {
  stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 640, height: 480 },
    audio: true
  });

  video.srcObject = stream;

  return new Promise(resolve => {
    video.onloadedmetadata = () => {
      overlay.width = video.videoWidth;
      overlay.height = video.videoHeight;
      recordingCanvas.width = video.videoWidth;
      recordingCanvas.height = video.videoHeight;
      logEvent('Test started, camera started');
      resolve();
    };
  });
}

function startDetection() {
  let lastFaceDetectedTime = Date.now();
  let noFaceLogged = false;
  let lastMultipleFacesLogged = null;
  let lastNoFaceLogged = null;

  detectInterval = setInterval(async () => {
    if (video.readyState === 4) {
      const detections = await faceapi.detectAllFaces(video, detectionOptions);
      faceCount.textContent = detections.length;

      if (detections.length > 0) {
        lastFaceDetectedTime = Date.now();
        noFaceLogged = false;
      }

      if (detections.length > 1) {
        const timeSinceLastMultipleFacesLog = Date.now() - lastMultipleFacesLogged;
        // Debounce multiple faces log to prevent repeated logs within a short interval
        if (!lastMultipleFacesLogged || timeSinceLastMultipleFacesLog > 5000) {
          logViolation('multipleFaces', `Multiple face detected, Count: ${detections.length}`);
          lastMultipleFacesLogged = Date.now();
        }
      }

      const timeSinceLastFace = Date.now() - lastFaceDetectedTime;
      if (timeSinceLastFace > 3000 && !noFaceLogged) {
        const timeSinceLastNoFaceLog = Date.now() - lastNoFaceLogged;
        // Debounce no face log to prevent repeated logs within a short interval
        if (!lastNoFaceLogged || timeSinceLastNoFaceLog > 5000) {
          logViolation('faceMissing', 'No face detected');
          noFaceLogged = true;
          lastNoFaceLogged = Date.now();
        }
      }

      drawBoxes(detections);
    }
  }, 2000);
}

function startSpeechDetection() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = audioContext.createAnalyser();
  const microphone = audioContext.createMediaStreamSource(stream);
  const dataArray = new Uint8Array(analyser.fftSize);
  microphone.connect(analyser);

  function checkVolume() {
    analyser.getByteTimeDomainData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const val = dataArray[i] - 128;
      sum += val * val;
    }
    const volume = Math.sqrt(sum / dataArray.length);

    if (volume > 10) {
      if (audioStatus.textContent !== 'Speech Detected') {
        logViolation('speech', 'Speech detected');
      }
      audioStatus.textContent = 'Speech Detected';
      audioStatus.className = 'text-red-600';
    } else {
      audioStatus.textContent = 'Listening...';
      audioStatus.className = 'text-green-600';
    }

    requestAnimationFrame(checkVolume);
  }

  checkVolume();
}

function startSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert('SpeechRecognition not supported in this browser.');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  const audioStatus = document.getElementById('audioStatus');
  const transcriptDiv = document.getElementById('transcript');

  // Log when speech recognition starts
  recognition.onstart = () => {
    audioStatus.textContent = 'Listening...';
    audioStatus.className = 'text-green-600';
    logEvent('Speech recognition started');
  };

  recognition.onresult = (event) => {
    let interim = '';
    let final = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final += event.results[i][0].transcript;
      } else {
        interim += event.results[i][0].transcript;
      }
    }

    transcriptDiv.textContent = final + interim;
    
    if ((final + interim).trim() !== '') {
      if (audioStatus.textContent !== 'Speech Detected') {
        logViolation('speech', 'Speech detected');
        logEvent('Speech detected'); // Log speech detection
      }
      audioStatus.textContent = 'Speech Detected';
      audioStatus.className = 'text-red-600';
    }
  };

  // Log if there's an error in recognition
  recognition.onerror = (e) => {
    console.error('Recognition error:', e.error);
    audioStatus.textContent = 'Error';
    audioStatus.className = 'text-yellow-600';
    logEvent(`Speech recognition error: ${e.error}`);
  };

  // Log when the recognition ends and restarts
  recognition.onend = () => {
    audioStatus.textContent = 'Restarting...';
    audioStatus.className = 'text-blue-600';
    logEvent('Speech recognition ended, restarting...');
    recognition.start(); 
  };

  // Start the recognition
  recognition.start();
}


function startSnapshotCapture() {
  setInterval(async () => {
    if (video.readyState === 4) {
      recordingCtx.drawImage(video, 0, 0, recordingCanvas.width, recordingCanvas.height);

      const detections = await faceapi.detectAllFaces(video, detectionOptions);

      const downscaleWidth = 568;
      const downscaleHeight = 320;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = downscaleWidth;
      tempCanvas.height = downscaleHeight;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(recordingCanvas, 0, 0, downscaleWidth, downscaleHeight);

      const compressedImage = tempCanvas.toDataURL('image/jpeg', 0.6); 

      // Log the image before sending
      console.log('Captured image data:', compressedImage);

      // Update the fetch URL to match your backend
      fetch('http://localhost:3000/save-snapshot', {  // Make sure this URL matches your backend API
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: compressedImage })
      })
      .then(response => response.text())
      .then(data => console.log(data))
      .catch(error => console.error('Error saving snapshot:', error));

      logEvent('Snapshot captured');
    }
  }, 5000);
}

function startRecordingWithAudio() {
  const canvasStream = recordingCanvas.captureStream(30);
  const audioTrack = stream.getAudioTracks()[0];
  const combinedStream = new MediaStream([...canvasStream.getVideoTracks(), audioTrack]);

  mediaRecorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });

  mediaRecorder.ondataavailable = e => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    recordedChunks = [];

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Video = reader.result;

      // Log the video data before sending
      console.log('Captured video data:', base64Video);

      // Update the fetch URL to match your backend
      fetch('http://localhost:3000/save-video', {  // Make sure this URL matches your backend API
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ video: base64Video })
      })
      .then(response => response.json())
      .then(data => console.log(data))
      .catch(error => console.error('Error saving video:', error));

      logEvent('Video captured');
    };
    reader.readAsDataURL(blob);
  };

  mediaRecorder.start();

  setInterval(() => {
    if (mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.start();
    }
  }, 20000);
}

function drawBoxes(detections) {
  ctx.clearRect(0, 0, overlay.width, overlay.height);
  ctx.strokeStyle = '#43d047';
  ctx.lineWidth = 5;

  detections.forEach(det => {
    let { x, y, width, height } = det.box;

    const paddingX = width * 0.15;  
    const paddingTop = height * 0.40; 
    const paddingBottom = height * 0.15; 

    x -= paddingX;
    y -= paddingTop;
    width += paddingX * 2;
    height += paddingTop + paddingBottom;

    const radius = Math.min(20, width * 0.1); 
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.stroke();
  });
}

function drawToRecordingCanvas() {
  recordingCtx.drawImage(video, 0, 0);
  recordingCtx.drawImage(overlay, 0, 0);
  requestAnimationFrame(drawToRecordingCanvas);
}

function updateTimestamp() {
  const timestampElement = document.getElementById('timestamp');
  setInterval(() => {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    timestampElement.textContent = timeString;
  }, 1000);
}

async function init() {
  await loadModels();
  await startCamera();
  startDetection();
  drawToRecordingCanvas();
  startRecordingWithAudio();
  startSpeechRecognition();
  startSnapshotCapture();
  updateTimestamp();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}