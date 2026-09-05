/**
 * Automated Verification Script for LabelCheck AI
 * Tests rules engine against all 5 sample packages
 */

const { ComplianceEngine, LegalMetrologyRules } = require('./js/rules-engine.js');
const { SamplePackagedCommodities } = require('./js/sample-data.js');

console.log('Running automated verification on Legal Metrology Compliance Engine...\n');

const engine = new ComplianceEngine(LegalMetrologyRules);
let passed = 0;

SamplePackagedCommodities.forEach(sample => {
  const result = engine.evaluateCompliance(sample.rawText, sample.category);
  const statusMatches = result.overallStatus === sample.expectedStatus;

  console.log(`Testing Sample: "${sample.name}" [${sample.category}]`);
  console.log(`  Calculated Score: ${result.score}% (Expected ~${sample.expectedScore}%)`);
  console.log(`  Overall Status:   ${result.overallStatus} (Expected: ${sample.expectedStatus})`);
  console.log(`  Status Label:     ${result.statusLabel}`);
  console.log(`  Total Rules:      ${result.counts.total}`);
  console.log(`  Found: ${result.counts.found} | Unclear: ${result.counts.unclear} | Missing: ${result.counts.missing}`);

  if (statusMatches) {
    console.log('  -> Status Check: PASS\n');
    passed++;
  } else {
    console.log('  -> Status Check: FAILED\n');
  }
});

console.log(`========================================`);
console.log(`Summary: ${passed} / ${SamplePackagedCommodities.length} Sample Checks Passed.`);
console.log(`========================================`);

if (passed === SamplePackagedCommodities.length) {
  process.exit(0);
} else {
  process.exit(1);
}
