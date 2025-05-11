// DOM Elements
const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const statusDiv = document.getElementById('status');
const faceCountSpan = document.getElementById('faceCount');
const loadingDiv = document.getElementById('loading');
const showBoxCheckbox = document.getElementById('showBox') || { checked: true };
const showLandmarksCheckbox = document.getElementById('showLandmarks') || { checked: true };

// Variables
let stream = null;
let isRunning = false;
let detectInterval = null;

// Configuration
const detectionOptions = {
  // How frequently to run detection in ms
  frequency: 100,
  // Options for face detection
  faceDetectionOptions: new faceapi.TinyFaceDetectorOptions({
    inputSize: 224,
    scoreThreshold: 0.5,
  }),
};

// Colors for UI elements
const colors = {
  box: '#43d047',
  landmarks: {
    jawOutline: '#ff9900',
    nose: '#ffff00',
    mouth: '#ff0000',
    leftEye: '#00ccff',
    rightEye: '#00ccff',
    leftEyeBrow: '#9900ff',
    rightEyeBrow: '#9900ff',
  },
};

// Initialize the application
async function initApp() {
  try {
    // Load models either from local "models" folder or fallback to CDN
    let modelPath = '../models/face-detection'; // Try local models first

    // Check if local models are available
    try {
      const response = await fetch(
        'models/tiny_face_detector_model-weights_manifest.json'
      );
      if (!response.ok) throw new Error('Local models not found');
    } catch (error) {
      console.log('Local models not found, using CDN fallback.');
      modelPath = 'https://justadudewhohacks.github.io/face-api.js/models';
    }

    // Load all required models
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
      faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
      faceapi.nets.faceExpressionNet.loadFromUri(modelPath),
    ]);

    console.log('Face-API models loaded successfully');
    hideLoading();
    updateStatus('Models loaded. Ready to start detection.');

    // Add event listeners
    startCamera();
    // startButton.addEventListener('click', startCamera);
    // stopButton.addEventListener('click', stopCamera);
  } catch (error) {
    console.error('Error initializing the app:', error);
    updateStatus('Error loading models: ' + error.message, true);
    hideLoading();
  }
}

// Start the camera stream
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 },
    });

    video.srcObject = stream;

    // Wait for video to start playing
    await new Promise((resolve) => {
      video.onloadedmetadata = () => {
        // Set canvas dimensions to match video
        overlay.width = video.videoWidth;
        overlay.height = video.videoHeight;
        resolve();
      };
    });

    startButton.disabled = true;
    stopButton.disabled = false;
    isRunning = true;

    // Start face detection
    startDetection();
    updateStatus('Camera started. Detecting faces...');
  } catch (error) {
    console.error('Error starting camera:', error);
    updateStatus('Failed to access camera: ' + error.message, true);
  }
}

// Stop the camera stream
function stopCamera() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
  }

  stopDetection();
  clearCanvas();
  updateFaceCount(0);

  startButton.disabled = false;
  stopButton.disabled = true;
  isRunning = false;

  updateStatus('Detection stopped. Click "Start Camera" to begin again.');
}

// Start face detection loop
function startDetection() {
  if (detectInterval) clearInterval(detectInterval);

  detectInterval = setInterval(async () => {
    if (isRunning && video.readyState === 4) {
      await detectFaces();
    }
  }, detectionOptions.frequency);
}

// Stop face detection loop
function stopDetection() {
  if (detectInterval) {
    clearInterval(detectInterval);
    detectInterval = null;
  }
}

// Detect faces in the current video frame
async function detectFaces() {
  const showBoxCheckbox = document.getElementById('showBox') || { checked: true };
  const showLandmarksCheckbox = document.getElementById('showLandmarks') || { checked: true };

  try {
    const detections = await faceapi
      .detectAllFaces(video, detectionOptions.faceDetectionOptions)
      .withFaceLandmarks()
      .withFaceExpressions();

    clearCanvas();

    if (detections.length > 0) {
      detections.forEach((detection) => {
        if (showBoxCheckbox.checked) {
          drawFaceBox(detection);
        }

        if (showLandmarksCheckbox.checked) {
          drawFaceLandmarks(detection);
        }

        drawFaceExpression(detection);
      });

      updateFaceCount(detections.length);
      updateStatus(`Detected ${detections.length} face(s)`);
    } else {
      updateFaceCount(0);
      updateStatus('No faces detected. Make sure your face is visible to the camera.');
    }
  } catch (error) {
    console.error('Detection error:', error);
    updateStatus('Error during detection: ' + error.message, true);
  }
}

// Draw face bounding box
function drawFaceBox(detection) {
  const box = detection.detection.box;

  // Draw rectangle
  ctx.strokeStyle = colors.box;
  ctx.lineWidth = 2;
  ctx.strokeRect(box.x, box.y, box.width, box.height);
}

// Draw face landmarks
function drawFaceLandmarks(detection) {
  const landmarks = detection.landmarks;
  const positions = landmarks.positions;

  // Draw all landmarks as dots
  ctx.fillStyle = colors.landmarks.jawOutline;

  // Draw jaw outline
  drawPolyline(landmarks.getJawOutline(), colors.landmarks.jawOutline);

  // Draw nose
  drawPolyline(landmarks.getNose(), colors.landmarks.nose);

  // Draw mouth
  drawPolyline(landmarks.getMouth(), colors.landmarks.mouth, true);

  // Draw left eye
  drawPolyline(landmarks.getLeftEye(), colors.landmarks.leftEye, true);

  // Draw right eye
  drawPolyline(landmarks.getRightEye(), colors.landmarks.rightEye, true);

  // Draw left eyebrow
  drawPolyline(landmarks.getLeftEyeBrow(), colors.landmarks.leftEyeBrow);

  // Draw right eyebrow
  drawPolyline(landmarks.getRightEyeBrow(), colors.landmarks.rightEyeBrow);
}

// Draw face expression
function drawFaceExpression(detection) {
  if (!detection.expressions) return;

  // Get dominant expression
  const expressions = detection.expressions;
  let dominantExpression = Object.keys(expressions).reduce((a, b) =>
    expressions[a] > expressions[b] ? a : b
  );

  // Format expression text
  dominantExpression =
    dominantExpression.charAt(0).toUpperCase() + dominantExpression.slice(1);

  // Draw expression text
  const box = detection.detection.box;
  ctx.font = '16px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  const text = `${dominantExpression}`;
  const textWidth = ctx.measureText(text).width;

  // Position text above the face box
  const x = box.x + box.width / 2 - textWidth / 2;
  const y = box.y - 10;

  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
}

// Draw a line connecting points
function drawPolyline(points, color, closed = false) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  ctx.beginPath();

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    if (i === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  }

  if (closed) {
    ctx.closePath();
  }

  ctx.stroke();
}

// Clear the canvas
function clearCanvas() {
  ctx.clearRect(0, 0, overlay.width, overlay.height);
}

// Update the status message
function updateStatus(message, isError = false) {
  statusDiv.textContent = message;
  statusDiv.style.backgroundColor = isError ? '#ffdddd' : '#ecf0f1';
  statusDiv.style.color = isError ? '#ff0000' : '#2c3e50';
}

// Update face count display
function updateFaceCount(count) {
  faceCountSpan.textContent = count;
}

// Hide loading screen
function hideLoading() {
  loadingDiv.style.display = 'none';
}

// Initialize the app when the DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
