export function logEvent(message) {
  fetch('http://localhost:3000/log-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ log: message })
  });
}

// Attach event listeners
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    logEvent('User switched tab or minimized window');
  }
});

document.addEventListener('copy', () => {
  logEvent('Copy action detected');
});

document.addEventListener('mouseout', (e) => {
  if (!e.relatedTarget && !e.toElement) {
    logEvent('Mouse left the screen');
  }
});