// Wait until face-detection.js is fully loaded and available
async function waitForFaceAPIReady() {
  if (typeof startCamera !== 'function' || typeof startDetection !== 'function') {
    console.log('[WAIT] face-detection.js not ready...');
    return setTimeout(waitForFaceAPIReady, 300);
  }

  // Patch fallback UI if not already present
  setupFallbackUI();

  try {
    await startCamera(); // from face-detection.js
    startDetection();    // from face-detection.js
    console.log('[INFO] Face detection started.');

    // Inject a debug listener to tap into the faceCount
    hookFaceCountUpdates();

  } catch (err) {
    console.error('[ERROR] Failed to start face detection:', err);
  }
}

// Hook into DOM updates on #faceCount to capture live count changes
function hookFaceCountUpdates() {
  const faceCountEl = document.getElementById('faceCount');
  if (!faceCountEl) return console.warn('[WARN] #faceCount not found.');

  // Observer to detect changes to faceCount span
  const observer = new MutationObserver(() => {
    const count = parseInt(faceCountEl.innerText || '0');
    updateStatusDisplay(count);
  });

  observer.observe(faceCountEl, { childList: true });
  console.log('[DEBUG] MutationObserver attached to #faceCount');
}

// Update the on-screen status label based on detected face count
function updateStatusDisplay(count) {
  const faceStatusEl = document.getElementById('face-status');
  if (!faceStatusEl) return;

  if (count === 0) {
    faceStatusEl.innerText = 'No Face';
    faceStatusEl.className = 'text-red-600';
  } else if (count === 1) {
    faceStatusEl.innerText = '1 Person';
    faceStatusEl.className = 'text-green-600';
  } else {
    faceStatusEl.innerText = `${count} People`;
    faceStatusEl.className = 'text-yellow-500';
  }

  console.log('[DETECTED]', count, 'face(s)');
}

// Create fallback hidden elements if not already present
function setupFallbackUI() {
  const ids = ['showBox', 'showLandmarks', 'status', 'faceCount'];
  const types = ['checkbox', 'checkbox', 'div', 'span'];
  const defaults = [true, true, '', '0'];

  ids.forEach((id, i) => {
    if (!document.getElementById(id)) {
      const el = document.createElement(types[i] === 'checkbox' ? 'input' : types[i]);
      el.id = id;
      if (types[i] === 'checkbox') {
        el.type = 'checkbox';
        el.checked = defaults[i];
        el.style.display = 'none';
      } else {
        el.innerText = defaults[i];
        el.style.display = 'none';
      }
      document.body.appendChild(el);
      console.log(`[SETUP] Added fallback element: #${id}`);
    }
  });
}

// Start process
waitForFaceAPIReady();


// Inject missing elements needed by face-detection.js
function injectMissingDOMElements() {
  const elements = {
    'status': 'div',
    'loading': 'div',
    'startBtn': 'button',
    'stopBtn': 'button',
    'faceCount': 'span',
    'showBox': 'input',
    'showLandmarks': 'input',
  };

  Object.entries(elements).forEach(([id, tag]) => {
    if (!document.getElementById(id)) {
      const el = document.createElement(tag);
      el.id = id;

      if (tag === 'input') {
        el.type = 'checkbox';
        el.checked = true;
        el.style.display = 'none';
      }

      if (tag === 'button') {
        el.innerText = id;
        el.disabled = false;
        el.style.display = 'none';
      }

      if (tag === 'div' || tag === 'span') {
        el.textContent = '';
        el.style.display = 'none';
      }

      document.body.appendChild(el);
      console.log(`[AUTOFIX] Injected #${id}`);
    }
  });
}

injectMissingDOMElements();