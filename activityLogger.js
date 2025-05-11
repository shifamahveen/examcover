import fs from 'fs';
import path from 'path';
import { updateViolation } from './trustScoreManager.js';

const logFilePath = path.join(process.cwd(), 'activity.log');

export function logActivity(message) {
  const timestamp = new Date().toISOString();
  const fullMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFilePath, fullMessage);

  if (message.includes('Copy action')) {
    updateViolation('Copy Action');
  } else if (message.includes('Speech detected')) {
    updateViolation('Speech');
  } else if (message.includes('Mouse moved out')) {
    updateViolation('Mouse Off-Screen');
  } else if (message.includes('Fullscreen exit')) {
    updateViolation('Fullscreen Exit');
  } else if (message.includes('Face missing')) {
    updateViolation('Face Missing');
  } else if (message.includes('Multiple faces')) {
    updateViolation('Multiple Faces');
  }
}
