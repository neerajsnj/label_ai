const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const expectedIds = [
  'user-persona-select', 'tab-btn-scanner', 'tab-btn-dashboard', 'tab-btn-history',
  'tab-btn-admin', 'tab-btn-analytics', 'tab-btn-rules-guide', 'nav-score-badge',
  'header-compliance-pill', 'header-compliance-text', 'persona-banner', 'persona-title',
  'persona-desc', 'hero-compliance-score', 'hero-violations-count', 'hero-scanned-count',
  'samples-container', 'commodity-category', 'btn-open-camera', 'file-input',
  'drop-zone', 'upload-prompt', 'canvas-container', 'preview-canvas', 'scanner-beam',
  'canvas-info', 'camera-stream-container', 'camera-video', 'btn-capture-photo',
  'btn-close-camera', 'input-product-name', 'input-inspector-name', 'btn-run-audit',
  'ocr-status-pill', 'ocr-progress-container', 'ocr-progress-bar', 'ocr-progress-label',
  'ocr-progress-percent', 'ocr-raw-text', 'scanner-compliance-card', 'scanner-result-score-title',
  'scanner-result-status-text', 'scanner-result-badge', 'scanner-stat-passed',
  'scanner-stat-warnings', 'scanner-stat-critical', 'scanner-stat-missing', 'scanner-issues-list',
  'verdict-card', 'score-circle-bar', 'verdict-score-num', 'verdict-badge',
  'verdict-commodity-pill', 'verdict-title', 'verdict-desc', 'btn-download-pdf',
  'btn-add-notes-modal', 'metric-total-rules', 'metric-found-count', 'metric-unclear-count',
  'metric-missing-count', 'checklist-results-container', 'corrective-action-panel',
  'corrective-actions-list', 'inspector-modal', 'add-rule-modal', 'toast'
];

let missing = 0;
expectedIds.forEach(id => {
  if (!html.includes(`id="${id}"`)) {
    console.error(`MISSING ID: ${id}`);
    missing++;
  }
});

if (missing === 0) {
  console.log(`PASS: All ${expectedIds.length} expected DOM IDs exist in index.html!`);
} else {
  console.error(`FAIL: ${missing} IDs missing.`);
  process.exit(1);
}
