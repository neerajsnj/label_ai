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

// Additional Test: Meriba Packaged Drinking Water Multi-Surface Scan (Rule 6 Proviso)
console.log('Testing Multi-Surface Bottle Scan (Rule 6 Proviso: Refer to stamp on bottle)...');

const singleSurfaceBottleText = `
PACKAGED DRINKING WATER
INGREDIENTS: TREATED WATER, MINERALS (CALCIUM AND MAGNESIUM)
MERIBA
BEST BEFORE SIX MONTHS FROM MANUFACTURE
BATCH NO       |
MFD DATE       | REFER TO STAMP
USE BY DATE    | ON BOTTLE
M.R.P. INCL. OF ALL TAXES |
USP: ₹0.02/ml
NET QTY: 1 L
MANUFACTURED BY: Meriba Aqua Tech Pvt Ltd, Plot 14, Industrial Estate, Bangalore, Karnataka - 560058
FOR COMPLAINTS CONTACT: Customer Care Cell, Tel: 1800-425-9988, Email: care@meribawater.in
FSSAI Lic. No. 10020043000892
`;

const resSingle = engine.evaluateCompliance(singleSurfaceBottleText, 'food');
console.log(`  Single Surface (Main label with "REFER TO STAMP ON BOTTLE"):`);
console.log(`  Score: ${resSingle.score}%, Status: ${resSingle.overallStatus}`);
const mrpSingle = resSingle.results.find(r => r.id === 'rule_mrp');
console.log(`  MRP Status: ${mrpSingle.status} (${mrpSingle.extractedText})`);
if (mrpSingle.status === 'manual_verification' && resSingle.overallStatus !== 'red') {
  console.log('  -> Single surface proviso warning: PASS\n');
  passed++;
} else {
  console.log('  -> Single surface proviso warning: FAILED\n');
}

const combinedMultiSurfaceBottleText = `
--- SURFACE 1: BOTTLE MAIN LABEL ---
PACKAGED DRINKING WATER
INGREDIENTS: TREATED WATER, MINERALS (CALCIUM AND MAGNESIUM)
MERIBA
BEST BEFORE SIX MONTHS FROM MANUFACTURE
BATCH NO       |
MFD DATE       | REFER TO STAMP
USE BY DATE    | ON BOTTLE
M.R.P. INCL. OF ALL TAXES |
USP: ₹0.02/ml
NET QTY: 1 L
MANUFACTURED BY: Meriba Aqua Tech Pvt Ltd, Plot 14, Industrial Estate, Bangalore, Karnataka, India - 560058
FOR COMPLAINTS CONTACT: Customer Care Cell, Tel: 1800-425-9988, Email: care@meribawater.in
FSSAI Lic. No. 10020043000892

--- SURFACE 2: BOTTLE CAP / NECK STAMP ---
B.NO: MRB-842
MFD: 08/2026
USE BY: 02/2027
MRP: Rs. 20.00 (INCL. OF ALL TAXES)
`;

const resCombined = engine.evaluateCompliance(combinedMultiSurfaceBottleText, 'food');
console.log(`  Combined Multi-Surface (Main Label + Cap Stamp):`);
console.log(`  Score: ${resCombined.score}%, Status: ${resCombined.overallStatus}`);
const mrpCombined = resCombined.results.find(r => r.id === 'rule_mrp');
const mfgCombined = resCombined.results.find(r => r.id === 'rule_mfg_date');
const batchCombined = resCombined.results.find(r => r.id === 'rule_batch_lot');
console.log(`  MRP: ${mrpCombined.status} | Mfg Date: ${mfgCombined.status} | Batch: ${batchCombined.status}`);

if (resCombined.overallStatus === 'green' && mrpCombined.status === 'found' && mfgCombined.status === 'found' && batchCombined.status === 'found') {
  console.log('  -> Multi-surface combined scan: PASS\n');
  passed++;
} else {
  console.log('  -> Multi-surface combined scan: FAILED\n');
}

const totalExpected = SamplePackagedCommodities.length + 2;
console.log(`========================================`);
console.log(`Summary: ${passed} / ${totalExpected} Total Checks Passed.`);
console.log(`========================================`);

if (passed === totalExpected) {
  process.exit(0);
} else {
  process.exit(1);
}
