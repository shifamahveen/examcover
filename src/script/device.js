// DOM elements
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const log = document.getElementById('log');
const phoneCount = document.getElementById('phone-count');
const headphoneCount = document.getElementById('headphone-count');
const earphoneCount = document.getElementById('earphone-count');

// Detection settings
const targetClasses = [
  'cell phone',
  'mobile phone',
  'smartphone',
  'headphones',
  'earphone',
  'earbud',
];
let model;
let isDetecting = false;
let detectionInterval;
const detectionFrequency = 1000; // Check every 1 second

// Statistics
let currentStats = {
  phones: 0,
  headphones: 0,
  earphones: 0,
};

// Initialize the application
async function init() {
  try {
    // Load the COCO-SSD model
    addToLog('Loading object detection model...');
    // Check if cocoSsd is available
    if (typeof cocoSsd === 'undefined') {
      throw new Error(
        'COCO-SSD model not loaded. Please make sure you have downloaded the model files correctly.'
      );
    }
    model = await cocoSsd.load();
    addToLog('Model loaded successfully');
    startBtn.disabled = false;
  } catch (error) {
    addToLog(`Error loading model: ${error.message}`);
    console.error('Error loading model:', error);
    // Display more helpful error message
    const errorMsg = document.createElement('div');
    errorMsg.innerHTML = `
               <div style="color: red; margin-top: 20px; padding: 10px; border: 1px solid red; background-color: #ffeeee;">
                   <h3>Error Loading Model</h3>
                   <p>${error.message}</p>
                   <p>To fix this issue:</p>
                   <ol>
                       <li>Download the required files:
                           <ul>
                               <li><a href="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest" download="tf.min.js">TensorFlow.js</a></li>
                               <li><a href="https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd" download="coco-ssd.min.js">COCO-SSD</a></li>
                           </ul>
                       </li>
                       <li>Place these files in the same directory as this HTML file</li>
                       <li>Refresh this page</li>
                   </ol>
               </div>
           `;
    document.querySelector('.container').appendChild(errorMsg);
  }

  // Set up event listeners
  startBtn.addEventListener('click', startDetection);
  stopBtn.addEventListener('click', stopDetection);
}

// Start the webcam and detection process
async function startDetection() {
  if (isDetecting) return;

  try {
    // Access webcam
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 },
      audio: false,
    });

    video.srcObject = stream;

    // Wait for video to be ready
    video.onloadedmetadata = () => {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Start detection loop
      isDetecting = true;
      startBtn.disabled = true;
      stopBtn.disabled = false;

      addToLog('Detection started');

      // Run detection at specified interval
      runDetection();
      detectionInterval = setInterval(runDetection, detectionFrequency);
    };
  } catch (error) {
    addToLog(`Error accessing camera: ${error.message}`);
    console.error('Error accessing camera:', error);
  }
}

// Stop the detection process
function stopDetection() {
  if (!isDetecting) return;

  // Clear the detection interval
  clearInterval(detectionInterval);

  // Stop all tracks of the stream
  if (video.srcObject) {
    const tracks = video.srcObject.getTracks();
    tracks.forEach((track) => track.stop());
    video.srcObject = null;
  }

  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Reset UI state
  isDetecting = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;

  addToLog('Detection stopped');
}

// Run object detection on the current video frame
async function runDetection() {
  if (!isDetecting || !model) return;

  try {
    // Detect objects in the current frame
    const predictions = await model.detect(video);

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Reset current counts
    currentStats.phones = 0;
    currentStats.headphones = 0;
    currentStats.earphones = 0;

    // Process each prediction
    predictions.forEach((prediction) => {
      const [x, y, width, height] = prediction.bbox;
      const className = prediction.class.toLowerCase();
      const score = prediction.score;

      // Only process if confidence is above threshold
      if (score > 0.5) {
        // Check if the detected object is one we're looking for
        if (targetClasses.some((target) => className.includes(target))) {
          // Categorize the detection
          if (className.includes('phone')) {
            currentStats.phones++;
            drawBoundingBox(
              x,
              y,
              width,
              height,
              'red',
              `Phone: ${Math.round(score * 100)}%`
            );
          } else if (className.includes('headphone')) {
            currentStats.headphones++;
            drawBoundingBox(
              x,
              y,
              width,
              height,
              'blue',
              `Headphones: ${Math.round(score * 100)}%`
            );
          } else if (
            className.includes('earphone') ||
            className.includes('earbud')
          ) {
            currentStats.earphones++;
            drawBoundingBox(
              x,
              y,
              width,
              height,
              'green',
              `Earphones: ${Math.round(score * 100)}%`
            );
          }
        }
      }
    });

    // Update stats display
    updateStats();

    // Log significant changes
    if (predictions.length > 0) {
      const deviceTypes = [];
      if (currentStats.phones > 0)
        deviceTypes.push(`${currentStats.phones} phone(s)`);
      if (currentStats.headphones > 0)
        deviceTypes.push(`${currentStats.headphones} headphone(s)`);
      if (currentStats.earphones > 0)
        deviceTypes.push(`${currentStats.earphones} earphone(s)`);

      if (deviceTypes.length > 0) {
        addToLog(`Detected: ${deviceTypes.join(', ')}`);
      }
    }
  } catch (error) {
    console.error('Error during detection:', error);
    addToLog(`Detection error: ${error.message}`);
  }
}

// Draw bounding box with label on the canvas
function drawBoundingBox(x, y, width, height, color, text) {
  // Draw rectangle
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);

  // Draw label background
  ctx.fillStyle = color;
  const textWidth = ctx.measureText(text).width;
  ctx.fillRect(x, y - 20, textWidth + 10, 20);

  // Draw label text
  ctx.fillStyle = 'white';
  ctx.font = '16px Arial';
  ctx.fillText(text, x + 5, y - 5);
}

// Update statistics display
function updateStats() {
  phoneCount.textContent = `${currentStats.phones} detected`;
  headphoneCount.textContent = `${currentStats.headphones} detected`;
  earphoneCount.textContent = `${currentStats.earphones} detected`;
}

// Add message to the log
function addToLog(message) {
  const timestamp = new Date().toLocaleTimeString();
  const entry = document.createElement('div');
  entry.textContent = `[${timestamp}] ${message}`;
  log.prepend(entry);

  // Keep log at a reasonable size
  while (log.children.length > 50) {
    log.removeChild(log.lastChild);
  }
}

// Additional utility: extend detection capabilities
async function customDetectionFilter(predictions) {
  // This function can be expanded to include more sophisticated detection logic
  // For example, combining multiple detections or using other heuristics
  return predictions.filter((pred) => {
    const className = pred.class.toLowerCase();
    const score = pred.score;

    // Enhanced filtering logic can be added here
    return (
      score > 0.5 && targetClasses.some((target) => className.includes(target))
    );
  });
}

// Initialize the application when the page loads
window.addEventListener('load', () => {
  // Check if libraries are loaded
  if (typeof tf === 'undefined' || typeof cocoSsd === 'undefined') {
    console.log('Libraries not yet loaded, waiting...');
    // Wait for scripts to load
    setTimeout(() => {
      if (typeof tf !== 'undefined' && typeof cocoSsd !== 'undefined') {
        console.log('Libraries loaded successfully');
        init();
      } else {
        addToLog('Error: Required libraries could not be loaded');
        const errorMsg = document.createElement('div');
        errorMsg.innerHTML = `
                       <div style="color: red; margin-top: 20px; padding: 10px; border: 1px solid red; background-color: #ffeeee;">
                           <h3>Library Loading Error</h3>
                           <p>TensorFlow.js or COCO-SSD libraries could not be loaded.</p>
                           <p>Please check the console for more details and follow the setup instructions.</p>
                       </div>
                   `;
        document.querySelector('.container').appendChild(errorMsg);
      }
    }, 2000); // Wait 2 seconds for scripts to load
  } else {
    init();
  }
});
