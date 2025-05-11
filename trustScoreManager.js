import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'trustScore.json');

const defaultViolations = [
  { type: "Speech", number: 0, negativeScore: 1 },
  { type: "Mouse Off-Screen", number: 0, negativeScore: 0.75 },
  { type: "Fullscreen Exit", number: 0, negativeScore: 0.5 },
  { type: "Face Missing", number: 0, negativeScore: 2 },
  { type: "Copy Action", number: 0, negativeScore: 2 },
  { type: "Multiple Faces", number: 0, negativeScore: 3 }
];

function calculateTrustScore(violations) {
  return violations.reduce((sum, v) => sum + v.number * v.negativeScore, 0);
}

function getTrustLabel(score) {
  if (score < 2) return "High Trust";
  if (score < 4) return "Medium Trust";
  return "Low Trust";
}

export function updateViolation(type) {
  let data = {
    trustScore: 0,
    trustLabel: "High Trust",
    violations: JSON.parse(JSON.stringify(defaultViolations))
  };

  if (fs.existsSync(filePath)) {
    const fileData = fs.readFileSync(filePath);
    data = JSON.parse(fileData);
  }

  const violation = data.violations.find(v => v.type === type);
  if (violation) violation.number += 1;

  data.trustScore = calculateTrustScore(data.violations);
  data.trustLabel = getTrustLabel(data.trustScore);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}
