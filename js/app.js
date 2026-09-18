/**
 * LabelCheck AI — Main Application Orchestrator
 * Connects UI tabs, camera/file inputs, OCR pipeline, Legal Metrology rules engine,
 * interactive bounding box inspector, PDF reporting, and admin configurations.
 */

// Application State
const state = {
  currentTab: 'scanner',
  activePersona: 'inspector',
  currentCategory: 'all',
  currentImageSource: null,
  currentImageDataUrl: null,
  currentSample: null,
  lastScanData: null,
  checklistFilter: 'all',
  cameraStream: null,
  scannedImages: [],
  activeImageIndex: 0,
  auditPhase: 'empty'
};

// Sub-modules instances
let adminStore;
let complianceEngine;
let ocrProcessor;
let pdfGenerator;
let analyticsDashboard;

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Core Services
  adminStore = new AdminStore();
  complianceEngine = new ComplianceEngine(adminStore.rules);
  ocrProcessor = new OCRProcessor();
  pdfGenerator = new PDFReportGenerator();
  analyticsDashboard = new AnalyticsDashboard(adminStore);

  // Initialize UI Components
  renderSamplePills();
  initEventListeners();
  renderAdminRulesList();
  renderHistoryTable();
  if (window.lucide) window.lucide.createIcons();

  // Load default compliant sample to start with immediate rich visualization
  loadSampleCommodity('sample_food_compliant');
});

/**
 * Tab Navigation Router
 */
function switchTab(tabId) {
  state.currentTab = tabId;

  const tabs = ['scanner', 'dashboard', 'history', 'admin', 'analytics', 'rules-guide'];
  tabs.forEach(t => {
    const view = document.getElementById(`view-${t}`);
    const btn = document.getElementById(`tab-btn-${t}`);
    if (view) view.classList.toggle('hidden', t !== tabId);
    if (btn) btn.classList.toggle('active', t === tabId);
  });

  // Re-render context-sensitive views
  if (tabId === 'analytics') {
    analyticsDashboard.render();
  } else if (tabId === 'history') {
    renderHistoryTable();
  } else if (tabId === 'admin') {
    renderAdminRulesList();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (window.lucide) window.lucide.createIcons();
}

/**
 * Render Quick Test Sample Buttons in Horizontally Scrollable Layout
 */
function renderSamplePills() {
  const container = document.getElementById('samples-container');
  if (!container) return;

  container.innerHTML = SamplePackagedCommodities.map(sample => {
    let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    let dotColor = 'bg-emerald-500';
    let statusText = 'Compliant';

    if (sample.expectedStatus === 'yellow') {
      badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
      dotColor = 'bg-amber-500';
      statusText = 'Needs Verification';
    } else if (sample.expectedStatus === 'red') {
      badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
      dotColor = 'bg-rose-500';
      statusText = 'Non-Compliant';
    }

    return `
      <div onclick="loadSampleCommodity('${sample.id}')" class="quick-test-card group">
        <div>
          <div class="flex items-center justify-between gap-1 mb-2">
            <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeClass}">
              <span class="inline-block w-1.5 h-1.5 rounded-full ${dotColor} mr-1"></span>${sample.expectedScore}%
            </span>
            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wide bg-white px-2 py-0.5 rounded border border-slate-200">${sample.category}</span>
          </div>
          <h4 class="text-xs font-bold text-slate-900 group-hover:text-teal-700 leading-snug transition-colors line-clamp-1">${sample.name}</h4>
          <p class="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-tight">${sample.subtitle}</p>
        </div>
        <div class="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px]">
          <span class="font-semibold text-slate-600">${statusText}</span>
          <span class="font-bold text-teal-700 group-hover:translate-x-0.5 transition-transform flex items-center">
            Test <i data-lucide="arrow-right" class="w-3 h-3 ml-0.5 inline"></i>
          </span>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

/**
 * Scroll Quick Test Container Horizontally
 */
function scrollQuickTest(amount) {
  const container = document.getElementById('samples-container');
  if (container) {
    container.scrollBy({ left: amount, behavior: 'smooth' });
  }
}

/**
 * Toggle Mobile Navigation Dropdown
 */
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-nav');
  if (menu) {
    menu.classList.toggle('hidden');
  }
}

/**
 * Load a Curated Sample Commodity and Render Graphic (supports multi-surface items like bottles + cap stamps)
 */
function loadSampleCommodity(sampleId) {
  const sample = SamplePackagedCommodities.find(s => s.id === sampleId);
  if (!sample) return;

  state.currentSample = sample;
  state.currentCategory = sample.category;

  // Set category selector
  const catSelect = document.getElementById('commodity-category');
  if (catSelect) catSelect.value = sample.category;

  // Set product name input
  const prodNameInput = document.getElementById('input-product-name');
  if (prodNameInput) prodNameInput.value = sample.name;

  // Multi-surface bottle with cap stamp
  if (sample.surfaces && sample.surfaces.length > 1) {
    const dataUrl1 = generateSampleLabelGraphic(sample);

    // Generate authentic visual graphic for the bottle cap / top stamp
    const capCanvas = document.createElement('canvas');
    capCanvas.width = 600;
    capCanvas.height = 450;
    const cctx = capCanvas.getContext('2d');

    cctx.fillStyle = '#0f172a';
    cctx.fillRect(0, 0, 600, 450);

    // Bottle cap circular ridge
    cctx.strokeStyle = '#0284c7';
    cctx.lineWidth = 6;
    cctx.beginPath();
    cctx.arc(300, 225, 170, 0, Math.PI * 2);
    cctx.stroke();

    cctx.fillStyle = '#1e293b';
    cctx.beginPath();
    cctx.arc(300, 225, 166, 0, Math.PI * 2);
    cctx.fill();

    // Cap ribbing lines
    cctx.strokeStyle = '#334155';
    cctx.lineWidth = 2;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 16) {
      cctx.beginPath();
      cctx.moveTo(300 + Math.cos(a) * 155, 225 + Math.sin(a) * 155);
      cctx.lineTo(300 + Math.cos(a) * 168, 225 + Math.sin(a) * 168);
      cctx.stroke();
    }

    cctx.fillStyle = '#94a3b8';
    cctx.font = 'bold 13px "Inter", monospace';
    cctx.textAlign = 'center';
    cctx.fillText('LEGAL METROLOGY CROWN STAMP (RULE 6 PROVISO)', 300, 140);

    cctx.fillStyle = '#38bdf8';
    cctx.font = 'bold 22px "JetBrains Mono", monospace';
    cctx.fillText('B.NO: MRB-842', 300, 185);

    cctx.fillStyle = '#f8fafc';
    cctx.font = 'bold 18px "JetBrains Mono", monospace';
    cctx.fillText('MFD: 08/2026', 300, 225);
    cctx.fillText('USE BY: 02/2027', 300, 260);

    cctx.fillStyle = '#4ade80';
    cctx.font = 'bold 20px "JetBrains Mono", monospace';
    cctx.fillText('MRP: Rs. 20.00 (INCL. TAX)', 300, 305);

    const dataUrl2 = capCanvas.toDataURL('image/png');

    const img1 = new Image();
    const img2 = new Image();
    img1.onload = () => {
      img2.onload = () => {
        state.scannedImages = [
          {
            id: 'sample_s1',
            name: sample.surfaces[0].name,
            dataUrl: dataUrl1,
            imgElement: img1,
            ocrText: sample.surfaces[0].text,
            words: [],
            regions: sample.regions || []
          },
          {
            id: 'sample_s2',
            name: sample.surfaces[1].name,
            dataUrl: dataUrl2,
            imgElement: img2,
            ocrText: sample.surfaces[1].text,
            words: [],
            regions: [{ box: [15, 20, 70, 60], label: 'Stamped MRP, Date & Batch (Rule 6 Proviso)', color: '#10b981' }]
          }
        ];
        state.activeImageIndex = 0;
        state.currentImageSource = img1;
        state.currentImageDataUrl = dataUrl1;

        displayImageOnCanvas(img1, sample.regions);
        renderMultiSurfaceStrip();
        combineAndSetOcrText();
        presentPostScanDecisionStep();
      };
      img2.src = dataUrl2;
    };
    img1.src = dataUrl1;

    showToast(`Loaded 2-surface sample: ${sample.name} (Rule 6 Proviso)`);
    return;
  }

  // Single-surface sample
  const dataUrl = generateSampleLabelGraphic(sample);
  state.currentImageDataUrl = dataUrl;

  const img = new Image();
  img.onload = () => {
    state.currentImageSource = img;
    state.scannedImages = [
      {
        id: 'sample_' + sample.id,
        name: 'Primary Label',
        dataUrl: dataUrl,
        imgElement: img,
        ocrText: sample.rawText,
        words: [],
        regions: sample.regions || []
      }
    ];
    state.activeImageIndex = 0;
    renderMultiSurfaceStrip();
    displayImageOnCanvas(img, sample.regions);
    runOcrPipeline(sample);
  };
  img.src = dataUrl;

  showToast(`Loaded sample: ${sample.name} (${sample.expectedScore}% expected)`);
}

/**
 * Display Image onto the preview canvas and draw bounding boxes
 */
function displayImageOnCanvas(img, regions = []) {
  const promptEl = document.getElementById('upload-prompt');
  const canvasCont = document.getElementById('canvas-container');
  const canvas = document.getElementById('preview-canvas');

  if (promptEl) promptEl.classList.add('hidden');
  if (canvasCont) canvasCont.classList.remove('hidden');

  canvas.width = img.naturalWidth || img.width || 600;
  canvas.height = img.naturalHeight || img.height || 800;

  ocrProcessor.renderBoundingBoxes(canvas, img, regions);
}

/**
 * Render thumbnail gallery for all scanned package surfaces
 */
function renderMultiSurfaceStrip() {
  const strip = document.getElementById('multi-surface-strip');
  const container = document.getElementById('multi-surface-thumbnails');
  const badge = document.getElementById('surface-count-badge');
  if (!strip || !container) return;

  if (!state.scannedImages || state.scannedImages.length === 0) {
    strip.classList.add('hidden');
    return;
  }

  strip.classList.remove('hidden');
  if (badge) {
    badge.textContent = `${state.scannedImages.length} Surface${state.scannedImages.length > 1 ? 's' : ''}`;
  }

  container.innerHTML = state.scannedImages.map((imgItem, idx) => {
    const isActive = idx === state.activeImageIndex;
    return `
      <div class="surface-thumb-item ${isActive ? 'active' : ''}" onclick="selectScannedImage(${idx})" title="${imgItem.name}">
        <img src="${imgItem.dataUrl}" alt="${imgItem.name}" class="surface-thumb-img">
        <span class="surface-thumb-label">${imgItem.name}</span>
        ${state.scannedImages.length > 1 ? `
          <button type="button" class="surface-thumb-del" onclick="removeScannedImage(${idx}, event)" title="Remove this angle">×</button>
        ` : ''}
      </div>
    `;
  }).join('');
}

/**
 * Switch active preview canvas to a specific scanned surface
 */
function selectScannedImage(index) {
  if (!state.scannedImages || index < 0 || index >= state.scannedImages.length) return;
  state.activeImageIndex = index;
  const active = state.scannedImages[index];
  state.currentImageSource = active.imgElement;
  state.currentImageDataUrl = active.dataUrl;

  displayImageOnCanvas(active.imgElement, active.regions || []);
  renderMultiSurfaceStrip();
  showToast(`Viewing: ${active.name}`);
}

/**
 * Remove an angle from current scan
 */
function removeScannedImage(index, event) {
  if (event) event.stopPropagation();
  if (state.scannedImages.length <= 1) {
    showToast('Cannot remove the only surface. Add another angle first.');
    return;
  }

  state.scannedImages.splice(index, 1);
  if (state.activeImageIndex >= state.scannedImages.length) {
    state.activeImageIndex = state.scannedImages.length - 1;
  }

  const active = state.scannedImages[state.activeImageIndex];
  state.currentImageSource = active.imgElement;
  state.currentImageDataUrl = active.dataUrl;

  displayImageOnCanvas(active.imgElement, active.regions || []);
  renderMultiSurfaceStrip();
  combineAndSetOcrText();
  evaluateCompliance(false);
  showToast('Removed angle from inspection.');
}

/**
 * Combine extracted texts from all scanned surfaces and update textarea
 */
function combineAndSetOcrText() {
  const textarea = document.getElementById('ocr-raw-text');
  if (!textarea) return;

  if (state.scannedImages.length === 1) {
    textarea.value = (state.scannedImages[0].ocrText || '').trim();
  } else {
    textarea.value = state.scannedImages.map((img, i) => {
      const header = `--- SURFACE ${i + 1}: ${img.name.toUpperCase()} ---`;
      return `${header}\n${(img.ocrText || '').trim()}`;
    }).join('\n\n');
  }

  checkStampProvisoGuidance();
}

/**
 * Check if the packaging label states "REFER TO STAMP ON BOTTLE"
 * and prompt user to upload the cap/top stamp if only 1 angle is scanned
 */
function checkStampProvisoGuidance() {
  const banner = document.getElementById('stamp-guidance-banner');
  if (!banner) return;

  const rawText = (document.getElementById('ocr-raw-text')?.value || '');
  const hasStampRef = /(?:refer\s*to\s*stamp(?:\s*on\s*(?:bottle|cap|neck|crown))?|stamp\s*on\s*(?:bottle|cap|neck|crown)|see\s*(?:cap|neck|crown|bottle|stamp))/i.test(rawText);

  // Show banner if label refers to stamp on bottle, but only 1 surface was provided
  const hasMultipleSurfaces = state.scannedImages && state.scannedImages.length > 1;

  if (hasStampRef && !hasMultipleSurfaces) {
    banner.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
  }
}

/**
 * Run OCR extraction across all scanned packaging surfaces
 */
async function runMultiImageOcrPipeline() {
  const beam = document.getElementById('scanner-beam');
  const progressCont = document.getElementById('ocr-progress-container');
  const progressBar = document.getElementById('ocr-progress-bar');
  const progressLabel = document.getElementById('ocr-progress-label');
  const progressPercent = document.getElementById('ocr-progress-percent');
  const ocrStatusPill = document.getElementById('ocr-status-pill');

  if (beam) beam.classList.remove('hidden');
  if (progressCont) progressCont.classList.remove('hidden');

  const total = state.scannedImages.length;
  if (ocrStatusPill) {
    ocrStatusPill.className = 'text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800';
    ocrStatusPill.textContent = `Scanning ${total} Surface${total > 1 ? 's' : ''}...`;
  }

  for (let i = 0; i < total; i++) {
    const item = state.scannedImages[i];
    // Skip if already extracted
    if (item.ocrText && item.ocrText.trim().length > 15) continue;

    if (progressLabel) progressLabel.textContent = `Scanning Surface ${i + 1} of ${total}: ${item.name}...`;
    const pctBase = Math.round((i / total) * 100);

    try {
      const ocrResult = await ocrProcessor.extractText(
        item.imgElement || item.dataUrl,
        p => {
          const stepPct = Math.min(100, Math.round(pctBase + ((p.progress || 0) / total)));
          if (progressBar) progressBar.style.width = `${stepPct}%`;
          if (progressPercent) progressPercent.textContent = `${stepPct}%`;
        },
        state.currentSample
      );
      item.ocrText = ocrResult.text;
      item.words = ocrResult.words || [];
    } catch (e) {
      console.warn('OCR extraction error on surface', i, e);
    }
  }

  combineAndSetOcrText();

  if (ocrStatusPill) {
    ocrStatusPill.className = 'text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800';
    ocrStatusPill.textContent = `Scanned ${total} Angle${total > 1 ? 's' : ''} (Decision Needed)`;
  }

  if (beam) beam.classList.add('hidden');
  setTimeout(() => {
    if (progressCont) progressCont.classList.add('hidden');
  }, 600);

  // Present the post-scan decision step: asking user whether to finalize or scan another surface
  presentPostScanDecisionStep();
}

/**
 * Display the Staged Permission Card asking user permission to start the scan
 */
function showScanPermissionCard() {
  const permCard = document.getElementById('scan-permission-card');
  const decisionCard = document.getElementById('post-scan-decision-card');
  const countBadge = document.getElementById('permission-photos-count');
  const btnLabel = document.getElementById('btn-confirm-start-scan-label');
  const descText = document.getElementById('permission-desc-text');

  if (decisionCard) decisionCard.classList.add('hidden');
  if (!permCard) return;

  const count = state.scannedImages ? state.scannedImages.length : 0;
  if (count === 0) {
    permCard.classList.add('hidden');
    return;
  }

  const active = state.scannedImages[state.activeImageIndex] || state.scannedImages[0];
  const hasExistingScannedText = state.scannedImages.some(img => img.ocrText && img.ocrText.trim().length > 0);

  permCard.classList.remove('hidden');
  permCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  if (countBadge) {
    countBadge.textContent = `${count} Photo${count > 1 ? 's' : ''} Staged`;
  }

  if (btnLabel) {
    if (hasExistingScannedText) {
      btnLabel.textContent = `Scan Added Surface (${active ? active.name : 'New Photo'})`;
    } else {
      btnLabel.textContent = `Start Compliance Scan (${count} Photo${count > 1 ? 's' : ''})`;
    }
  }

  if (descText) {
    if (hasExistingScannedText) {
      descText.innerHTML = `<strong>Additional packaging surface staged: ${escapeHtml(active ? active.name : 'New Surface')}</strong> (${count} total surfaces). Click below to grant permission and scan this surface to incorporate into the compliance analysis.`;
    } else if (count === 1) {
      descText.innerHTML = `<strong>1 packaging photo staged</strong>. You can give permission to scan this photo now, or add more photos first (e.g. bottle top stamp, back panel) before evaluating.`;
    } else {
      descText.innerHTML = `<strong>${count} packaging photos staged</strong> (e.g. Main Label, Bottle Top/Cap Stamp). Click below to give permission and run the compliance scan across all surfaces.`;
    }
  }

  const ocrStatusPill = document.getElementById('ocr-status-pill');
  if (ocrStatusPill) {
    ocrStatusPill.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200';
    ocrStatusPill.textContent = 'Waiting for Scan Permission';
  }

  state.auditPhase = 'staged';
}

/**
 * User confirmed: Run OCR scan on staged images
 */
function startUserConfirmedScan() {
  const permCard = document.getElementById('scan-permission-card');
  if (permCard) permCard.classList.add('hidden');

  state.auditPhase = 'scanning';
  runMultiImageOcrPipeline();
}

/**
 * Clear staged photos and reset scanner view
 */
function clearStagedPhotos() {
  state.scannedImages = [];
  state.activeImageIndex = 0;
  state.currentImageSource = null;
  state.currentImageDataUrl = null;
  state.currentSample = null;
  state.lastScanData = null;
  state.auditPhase = 'empty';

  const permCard = document.getElementById('scan-permission-card');
  const decisionCard = document.getElementById('post-scan-decision-card');
  const strip = document.getElementById('multi-surface-strip');
  const banner = document.getElementById('stamp-guidance-banner');
  const canvasCont = document.getElementById('canvas-container');
  const uploadPrompt = document.getElementById('upload-prompt');
  const textarea = document.getElementById('ocr-raw-text');
  const ocrStatusPill = document.getElementById('ocr-status-pill');

  if (permCard) permCard.classList.add('hidden');
  if (decisionCard) decisionCard.classList.add('hidden');
  if (strip) strip.classList.add('hidden');
  if (banner) banner.classList.add('hidden');
  if (canvasCont) canvasCont.classList.add('hidden');
  if (uploadPrompt) uploadPrompt.classList.remove('hidden');
  if (textarea) textarea.value = '';

  if (ocrStatusPill) {
    ocrStatusPill.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200';
    ocrStatusPill.textContent = 'Ready for Extraction';
  }

  showToast('Cleared staged photos.');
}

/**
 * Post-Scan Decision Step
 * Asks user whether to finalize compliance results or scan/add another packaging angle first
 */
function presentPostScanDecisionStep() {
  const permCard = document.getElementById('scan-permission-card');
  if (permCard) permCard.classList.add('hidden');

  const decisionCard = document.getElementById('post-scan-decision-card');
  const stampNote = document.getElementById('post-scan-stamp-note');
  const titleEl = document.getElementById('post-scan-decision-title');
  const descEl = document.getElementById('post-scan-decision-desc');
  const rawText = (document.getElementById('ocr-raw-text')?.value || '');
  const hasStampRef = /(?:refer\s*to\s*stamp(?:\s*on\s*(?:bottle|cap|neck|crown))?|stamp\s*on\s*(?:bottle|cap|neck|crown)|see\s*(?:cap|neck|crown|bottle|stamp))/i.test(rawText);
  const count = state.scannedImages ? state.scannedImages.length : 1;

  if (titleEl) {
    titleEl.textContent = count === 1 ?
      'Surface 1 Scanned Successfully — Next Action' :
      `${count} Packaging Surfaces Scanned — Next Action`;
  }

  if (descEl) {
    if (count === 1) {
      descEl.innerHTML = `Extracted text from the initial surface. Do you want to <strong class="text-blue-950">generate the final compliance result now</strong>, or <strong class="text-blue-950">scan other images first</strong> (e.g. bottle cap stamp, back panel, ingredients) to combine all declarations?`;
    } else {
      descEl.innerHTML = `Extracted text from all <strong>${count} packaging surfaces</strong>. Do you want to <strong class="text-blue-950">generate the final compliance result now</strong>, or <strong class="text-blue-950">scan another image first</strong> before producing the final product result?`;
    }
  }

  // Run a preliminary evaluation to update the scanner preview without saving to audit history yet
  complianceEngine.setRules(adminStore.rules);
  const category = document.getElementById('commodity-category')?.value || 'all';
  const preliminaryResult = complianceEngine.evaluateCompliance(rawText, category);
  preliminaryResult.productName = document.getElementById('input-product-name')?.value || 'Packaged Commodity';
  preliminaryResult.category = category;
  preliminaryResult.thumbnail = state.currentImageDataUrl;

  updateDashboardUI(preliminaryResult, true); // true = preliminary preview mode

  if (decisionCard) {
    decisionCard.classList.remove('hidden');
    decisionCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  if (stampNote) {
    // Show notice if bottle stamp was referenced and only 1 surface has been scanned
    stampNote.classList.toggle('hidden', !hasStampRef || count > 1);
  }

  state.auditPhase = 'awaiting_decision';
}

/**
 * User confirmed: Finalize compliance evaluation and save audit
 */
function finalizeComplianceAudit(autoSwitch = false) {
  const decisionCard = document.getElementById('post-scan-decision-card');
  const permCard = document.getElementById('scan-permission-card');
  if (decisionCard) decisionCard.classList.add('hidden');
  if (permCard) permCard.classList.add('hidden');

  state.auditPhase = 'finalized';
  evaluateCompliance(autoSwitch);
}

/**
 * Run OCR Extraction Pipeline with visual scanner beam (Single sample fallback wrapper)
 */
async function runOcrPipeline(sampleFallback = null) {
  if (state.scannedImages && state.scannedImages.length > 0) {
    return runMultiImageOcrPipeline();
  }
}

/**
 * Evaluate Compliance under Legal Metrology Rules, 2011
 */
function evaluateCompliance(autoSwitch = false) {
  const rawText = document.getElementById('ocr-raw-text').value;
  if (!rawText.trim()) {
    alert('Please upload an image or enter packaging text before running the compliance audit.');
    return;
  }

  const category = document.getElementById('commodity-category').value || 'all';
  const productName = document.getElementById('input-product-name').value || 'Packaged Commodity';
  const inspectorName = document.getElementById('input-inspector-name').value || 'Inspector LMO-14 (Field Auditor)';

  // Run Rules Engine
  complianceEngine.setRules(adminStore.rules);
  const auditResult = complianceEngine.evaluateCompliance(rawText, category);

  // Augment with metadata
  auditResult.productName = productName;
  auditResult.category = category;
  auditResult.inspectorName = inspectorName;
  auditResult.thumbnail = state.currentImageDataUrl;
  auditResult.ocrText = rawText;

  state.lastScanData = auditResult;

  // Save to audit history
  adminStore.addScanRecord(auditResult);

  // Update UI Elements in Dashboard and Scanner Views
  updateDashboardUI(auditResult, false);

  // Switch to Dashboard Tab if explicitly requested
  if (autoSwitch) {
    switchTab('dashboard');
  }

  showToast(`Compliance Audit Complete: ${auditResult.score}% (${auditResult.statusLabel})`);
}

/**
 * Update the Compliance Dashboard & Scanner Views with audit findings
 */
function updateDashboardUI(data, isPreliminary = false) {
  // Score gauge circle
  const scoreBar = document.getElementById('score-circle-bar');
  const scoreNum = document.getElementById('verdict-score-num');
  const verdictBadge = document.getElementById('verdict-badge');
  const verdictCard = document.getElementById('verdict-card');
  const verdictTitle = document.getElementById('verdict-title');
  const verdictDesc = document.getElementById('verdict-desc');
  const commPill = document.getElementById('verdict-commodity-pill');
  const navBadge = document.getElementById('nav-score-badge');
  const headerPill = document.getElementById('header-compliance-pill');
  const headerText = document.getElementById('header-compliance-text');

  const radius = (scoreBar && scoreBar.r && scoreBar.r.baseVal && scoreBar.r.baseVal.value) || 51;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (data.score / 100) * circumference;

  if (scoreBar) {
    scoreBar.style.strokeDasharray = circumference;
    scoreBar.style.strokeDashoffset = offset;
    scoreBar.style.stroke = data.overallStatus === 'green' ? '#10b981' :
      (data.overallStatus === 'yellow' ? '#f59e0b' : '#ef4444');
  }

  if (scoreNum) scoreNum.textContent = `${data.score}%`;

  if (navBadge) {
    navBadge.classList.remove('hidden');
    navBadge.textContent = isPreliminary ? `${data.score}% (Step)` : `${data.score}%`;
    navBadge.className = data.overallStatus === 'green' ? 'ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200' :
      (data.overallStatus === 'yellow' ? 'ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200' : 'ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200');
  }

  if (headerText) {
    const statusWord = data.overallStatus === 'green' ? 'COMPLIANT' : (data.overallStatus === 'yellow' ? 'VERIFY' : 'NON-COMPLIANT');
    headerText.textContent = isPreliminary ? `${data.score}% (PREVIEW)` : `${data.score}% ${statusWord}`;
  }
  if (headerPill) {
    if (data.overallStatus === 'green') {
      headerPill.className = 'header-score-badge cursor-pointer bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 transition';
    } else if (data.overallStatus === 'yellow') {
      headerPill.className = 'header-score-badge cursor-pointer bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 transition';
    } else {
      headerPill.className = 'header-score-badge cursor-pointer bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 transition';
    }
  }

  // Update Hero / Dashboard Status Section Cards
  const heroScore = document.getElementById('hero-compliance-score');
  if (heroScore) {
    heroScore.textContent = `${data.score}%`;
    heroScore.className = `hero-metric-value mt-0.5 ${data.overallStatus === 'green' ? 'text-emerald-600' : (data.overallStatus === 'yellow' ? 'text-amber-600' : 'text-rose-600')}`;
  }

  const heroViolations = document.getElementById('hero-violations-count');
  if (heroViolations) {
    const vCount = data.counts.missing + data.counts.unclear;
    heroViolations.textContent = vCount;
    heroViolations.className = `hero-metric-value mt-0.5 ${vCount === 0 ? 'text-emerald-600' : (data.counts.missing > 0 ? 'text-rose-600' : 'text-amber-600')}`;
  }

  const heroScanned = document.getElementById('hero-scanned-count');
  if (heroScanned) {
    heroScanned.textContent = adminStore.history.length;
  }

  // Update Scanner View Live Compliance Card
  const scCard = document.getElementById('scanner-compliance-card');
  if (scCard) {
    scCard.className = `scanner-panel border-2 bg-white transition-all ${data.overallStatus === 'green' ? 'border-emerald-500 status-glow-green' : (data.overallStatus === 'yellow' ? 'border-amber-500 status-glow-yellow' : 'border-rose-500 status-glow-red')}`;
  }

  const scScoreTitle = document.getElementById('scanner-result-score-title');
  if (scScoreTitle) {
    if (isPreliminary) {
      scScoreTitle.textContent = `${data.score}% (Surface Scanned)`;
      scScoreTitle.className = `text-2xl font-black mt-0.5 tracking-tight text-blue-700`;
    } else {
      const statusWord = data.overallStatus === 'green' ? 'COMPLIANT' : (data.overallStatus === 'yellow' ? 'NEEDS VERIFICATION' : 'NON-COMPLIANT');
      scScoreTitle.textContent = `${data.score}% ${statusWord}`;
      scScoreTitle.className = `text-2xl font-black mt-0.5 tracking-tight ${data.overallStatus === 'green' ? 'text-emerald-600' : (data.overallStatus === 'yellow' ? 'text-amber-600' : 'text-rose-600')}`;
    }
  }

  const scStatusText = document.getElementById('scanner-result-status-text');
  if (scStatusText) {
    if (isPreliminary) {
      scStatusText.textContent = 'Preliminary scan complete. Choose whether to finalize or scan another surface below.';
    } else {
      scStatusText.textContent = data.statusLabel;
    }
  }

  const scBadge = document.getElementById('scanner-result-badge');
  if (scBadge) {
    if (isPreliminary) {
      scBadge.className = 'px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-300';
      scBadge.textContent = 'STEP COMPLETE';
    } else if (data.overallStatus === 'green') {
      scBadge.className = 'px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300';
      scBadge.textContent = 'PASS';
    } else if (data.overallStatus === 'yellow') {
      scBadge.className = 'px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300';
      scBadge.textContent = 'VERIFY';
    } else {
      scBadge.className = 'px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300';
      scBadge.textContent = 'FAIL';
    }
  }

  const statPassed = document.getElementById('scanner-stat-passed');
  if (statPassed) statPassed.textContent = data.counts.found;

  const statWarnings = document.getElementById('scanner-stat-warnings');
  if (statWarnings) statWarnings.textContent = data.counts.unclear + data.counts.manualVerify;

  const statCritical = document.getElementById('scanner-stat-critical');
  if (statCritical) statCritical.textContent = data.counts.missing;

  const statMissing = document.getElementById('scanner-stat-missing');
  if (statMissing) statMissing.textContent = data.counts.missing;

  // Scanner Issues list
  const issuesContainer = document.getElementById('scanner-issues-list');
  if (issuesContainer) {
    const issues = data.results.filter(r => r.status !== 'found');
    if (issues.length === 0) {
      issuesContainer.innerHTML = `
        <div class="flex items-center space-x-2 text-emerald-700 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200">
          <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600 flex-shrink-0"></i>
          <span class="text-[11px] font-medium">All mandatory statutory declarations verified under Rule 6.</span>
        </div>
      `;
    } else {
      issuesContainer.innerHTML = issues.slice(0, 3).map(iss => {
        const isCrit = iss.severity === 'critical' || iss.status === 'missing';
        return `
          <div class="flex items-start space-x-2 ${isCrit ? 'text-rose-700 bg-rose-50/70 border-rose-200' : 'text-amber-700 bg-amber-50/70 border-amber-200'} p-2.5 rounded-lg border">
            <i data-lucide="${isCrit ? 'alert-octagon' : 'alert-triangle'}" class="w-4 h-4 mt-0.5 flex-shrink-0"></i>
            <div class="min-w-0">
              <span class="font-bold text-[11px]">${escapeHtml(iss.name)} (${escapeHtml(iss.legalRef)})</span>
              <p class="text-[10px] text-slate-600 line-clamp-1">${escapeHtml(iss.description || iss.notes)}</p>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Color Verdict Badge & Glow
  if (verdictCard) {
    verdictCard.className = 'bg-white rounded-2xl border-2 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 transition-all ' +
      (data.overallStatus === 'green' ? 'status-glow-green' : (data.overallStatus === 'yellow' ? 'status-glow-yellow' : 'status-glow-red'));
  }

  if (verdictBadge) {
    if (data.overallStatus === 'green') {
      verdictBadge.className = 'px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300';
      verdictBadge.textContent = '🟢 Compliant (Green)';
      verdictTitle.textContent = 'Mandatory Packaging Declarations Compliant';
    } else if (data.overallStatus === 'yellow') {
      verdictBadge.className = 'px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300';
      verdictBadge.textContent = '🟡 Needs Verification / Partial (Yellow)';
      verdictTitle.textContent = 'Declarations Unclear or Incomplete';
    } else {
      verdictBadge.className = 'px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300';
      verdictBadge.textContent = '🔴 Non-Compliant / Actionable (Red)';
      verdictTitle.textContent = 'Critical Statutory Declarations Missing';
    }
  }

  if (verdictDesc) verdictDesc.textContent = data.statusDescription;
  if (commPill) commPill.textContent = `${data.productName} • ${data.category.toUpperCase()}`;

  // Counter metrics
  document.getElementById('metric-total-rules').textContent = data.counts.total;
  document.getElementById('metric-found-count').textContent = data.counts.found;
  document.getElementById('metric-unclear-count').textContent = data.counts.unclear + data.counts.manualVerify;
  document.getElementById('metric-missing-count').textContent = data.counts.missing;

  // Render Checklist Table
  renderChecklistRows(data.results);

  // Render Corrective Actions
  renderCorrectiveActions(data.results);

  if (window.lucide) window.lucide.createIcons();
}

/**
 * Render Statutory Checklist Rows
 */
function renderChecklistRows(results) {
  const container = document.getElementById('checklist-results-container');
  if (!container) return;

  const filter = state.checklistFilter;
  const filtered = results.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'missing') return r.status === 'missing';
    if (filter === 'unclear') return r.status === 'unclear' || r.status === 'manual_verification';
    if (filter === 'found') return r.status === 'found';
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center text-slate-400 text-xs">
        No declarations match the filter "${filter}".
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(r => {
    let badgeClass = 'badge-missing';
    let statusText = 'Missing';
    let iconName = 'x-circle';

    if (r.status === 'found') {
      badgeClass = 'badge-found';
      statusText = 'Found / Compliant';
      iconName = 'check-circle-2';
    } else if (r.status === 'unclear') {
      badgeClass = 'badge-unclear';
      statusText = 'Unclear / Deficient';
      iconName = 'alert-triangle';
    } else if (r.status === 'manual_verification') {
      badgeClass = 'badge-verify';
      statusText = 'Manual Verification';
      iconName = 'help-circle';
    }

    return `
      <div class="p-4 hover:bg-slate-50 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div class="flex-1 space-y-1">
          <div class="flex items-center space-x-2">
            <span class="text-xs font-bold text-slate-900">${r.name}</span>
            <span class="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">${r.legalRef}</span>
            <span class="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded ${r.severity === 'critical' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}">${r.severity}</span>
          </div>

          <div class="text-xs text-slate-600">
            ${r.extractedText ? `
              <span class="font-semibold text-slate-700">Detected on Label:</span>
              <code class="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[11px] font-mono border border-slate-200">${escapeHtml(r.extractedText)}</code>
            ` : '<span class="text-rose-500 italic font-medium">[Mandatory statement missing from package]</span>'}
          </div>

          <p class="text-[11px] text-slate-500">${r.notes || r.description}</p>
        </div>

        <div class="flex items-center space-x-3 self-end md:self-center">
          <span class="text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1.5 ${badgeClass}">
            <i data-lucide="${iconName}" class="w-3.5 h-3.5"></i>
            <span>${statusText}</span>
          </span>

          <button onclick="highlightLabelRegion('${r.name}')" title="Inspect on Label Canvas" class="text-xs p-1.5 rounded-lg bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 border border-slate-200 transition">
            <i data-lucide="eye" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

/**
 * Filter Checklist Rows by Status
 */
function filterChecklist(status) {
  state.checklistFilter = status;
  const btns = ['all', 'missing', 'unclear', 'found'];
  btns.forEach(b => {
    const el = document.getElementById(`filter-btn-${b}`);
    if (el) {
      if (b === status) {
        el.className = 'px-2.5 py-1 rounded-md font-semibold bg-teal-700 text-white';
      } else {
        el.className = 'px-2.5 py-1 rounded-md font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200';
      }
    }
  });

  if (state.lastScanData) {
    renderChecklistRows(state.lastScanData.results);
  }
}

/**
 * Highlight a specific bounding box region on the preview canvas
 */
function highlightLabelRegion(ruleName) {
  switchTab('scanner');
  const canvas = document.getElementById('preview-canvas');
  if (!canvas || !state.currentImageSource) return;

  const sample = state.currentSample;
  const regions = sample ? sample.regions : [];
  ocrProcessor.renderBoundingBoxes(canvas, state.currentImageSource, regions, ruleName);
  showToast(`Focusing inspection on: ${ruleName}`);
}

/**
 * Render Corrective Actions list in compliance dashboard
 */
function renderCorrectiveActions(results) {
  const container = document.getElementById('corrective-actions-list');
  if (!container) return;

  const defects = results.filter(r => r.status !== 'found');
  if (defects.length === 0) {
    container.innerHTML = `
      <div class="p-3 bg-emerald-50 rounded-lg text-emerald-800 font-medium flex items-center space-x-2">
        <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600"></i>
        <span>No non-compliance violations detected. All packaging declarations meet Legal Metrology norms.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = defects.map(d => `
    <div class="p-2.5 bg-white rounded-lg border border-amber-200/80 space-y-1">
      <div class="flex items-center justify-between">
        <strong class="text-slate-900">${d.name} (${d.legalRef})</strong>
        <span class="text-[10px] uppercase font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">${d.status}</span>
      </div>
      <p class="text-slate-700 leading-snug">${d.correctiveAction}</p>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

/**
 * History Table Management
 */
function renderHistoryTable() {
  const tbody = document.getElementById('history-table-body');
  if (!tbody) return;

  const history = adminStore.loadHistory();
  const search = (document.getElementById('history-search')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('history-status-filter')?.value || 'all';
  const catFilter = document.getElementById('history-category-filter')?.value || 'all';

  const filtered = history.filter(item => {
    const matchesSearch = !search ||
      item.productName.toLowerCase().includes(search) ||
      (item.inspectorName && item.inspectorName.toLowerCase().includes(search)) ||
      item.id.toLowerCase().includes(search);
    const matchesStatus = statusFilter === 'all' || item.overallStatus === statusFilter;
    const matchesCat = catFilter === 'all' || item.category === catFilter;
    return matchesSearch && matchesStatus && matchesCat;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="p-6 text-center text-slate-400">
          No inspection records found matching criteria.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(item => {
    const dateFormatted = new Date(item.timestamp).toLocaleString('en-IN', {
      dateStyle: 'short',
      timeStyle: 'short'
    });

    let badgeClass = 'bg-rose-100 text-rose-800 border-rose-300';
    if (item.overallStatus === 'green') badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    else if (item.overallStatus === 'yellow') badgeClass = 'bg-amber-100 text-amber-800 border-amber-300';

    return `
      <tr class="hover:bg-slate-50 transition">
        <td class="p-3 font-mono text-[11px] text-slate-500">
          <div>${item.id.slice(0, 16)}</div>
          <div class="text-[10px] text-slate-400">${dateFormatted}</div>
        </td>
        <td class="p-3 font-bold text-slate-800">
          ${escapeHtml(item.productName)}
        </td>
        <td class="p-3 uppercase text-[11px] text-slate-600 font-semibold">
          ${item.category}
        </td>
        <td class="p-3 text-center font-black text-sm ${item.score >= 85 ? 'text-emerald-600' : (item.score >= 60 ? 'text-amber-600' : 'text-rose-600')}">
          ${item.score}%
        </td>
        <td class="p-3">
          <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${badgeClass}">
            ${item.overallStatus}
          </span>
        </td>
        <td class="p-3 text-slate-600 text-[11px]">
          ${escapeHtml(item.inspectorName || 'Officer LMO')}
        </td>
        <td class="p-3 text-right space-x-1.5 whitespace-nowrap">
          <button onclick="viewPastScan('${item.id}')" class="text-xs bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold px-2 py-1 rounded border border-teal-200 transition">
            View
          </button>
          <button onclick="downloadPastScanPDF('${item.id}')" class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2 py-1 rounded border border-slate-300 transition">
            PDF
          </button>
          <button onclick="deleteScan('${item.id}')" class="text-xs text-rose-600 hover:text-rose-800 p-1">
            <i data-lucide="trash" class="w-3.5 h-3.5 inline"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function viewPastScan(id) {
  const scan = adminStore.getScanById(id);
  if (!scan) return;
  state.lastScanData = scan;
  updateDashboardUI(scan);
  switchTab('dashboard');
}

function downloadPastScanPDF(id) {
  const scan = adminStore.getScanById(id);
  if (scan) pdfGenerator.generateReport(scan);
}

function deleteScan(id) {
  if (confirm('Delete this inspection record from history?')) {
    adminStore.deleteScanRecord(id);
    renderHistoryTable();
    showToast('Record deleted.');
  }
}

function clearAllHistory() {
  if (confirm('Are you sure you want to clear all inspection history?')) {
    adminStore.clearHistory();
    renderHistoryTable();
    showToast('History cleared.');
  }
}

/**
 * Admin Rule Configurator UI
 */
function renderAdminRulesList() {
  const tbody = document.getElementById('admin-rules-table-body');
  if (!tbody) return;

  const rules = adminStore.rules;
  tbody.innerHTML = rules.map((r, i) => `
    <tr class="hover:bg-slate-50 transition">
      <td class="p-3 text-center">
        <input type="checkbox" ${r.enabled !== false ? 'checked' : ''} onchange="toggleRuleActive('${r.id}', this.checked)" class="w-4 h-4 text-teal-600 rounded focus:ring-teal-500">
      </td>
      <td class="p-3 font-semibold text-slate-800">
        ${r.name}
        <div class="text-[10px] text-slate-400 font-normal mt-0.5 line-clamp-1">${r.description}</div>
      </td>
      <td class="p-3 font-mono text-slate-600 font-medium">${r.legalRef}</td>
      <td class="p-3">
        <select onchange="updateRuleSeverity('${r.id}', this.value)" class="text-xs bg-slate-50 border border-slate-300 rounded px-2 py-1 font-semibold ${r.severity === 'critical' ? 'text-rose-600' : 'text-slate-700'}">
          <option value="critical" ${r.severity === 'critical' ? 'selected' : ''}>Critical</option>
          <option value="major" ${r.severity === 'major' ? 'selected' : ''}>Major</option>
          <option value="minor" ${r.severity === 'minor' ? 'selected' : ''}>Minor</option>
        </select>
      </td>
      <td class="p-3">
        <input type="number" min="1" max="40" value="${r.weight}" onchange="updateRuleWeight('${r.id}', this.value)" class="w-16 text-xs bg-slate-50 border border-slate-300 rounded px-2 py-1 text-center font-bold text-slate-800">
      </td>
      <td class="p-3 text-[11px] text-slate-500 uppercase">
        ${r.applicableCategories.join(', ')}
      </td>
      <td class="p-3 text-right">
        ${r.id.startsWith('rule_custom_') ? `
          <button onclick="deleteCustomRule('${r.id}')" class="text-xs text-rose-600 hover:text-rose-800 font-semibold">Delete</button>
        ` : '<span class="text-[11px] text-slate-400">Statutory</span>'}
      </td>
    </tr>
  `).join('');
}

function toggleRuleActive(ruleId, active) {
  adminStore.updateRule(ruleId, { enabled: active });
  complianceEngine.setRules(adminStore.rules);
  showToast(`Rule updated: ${active ? 'Enabled' : 'Disabled'}`);
}

function updateRuleSeverity(ruleId, severity) {
  adminStore.updateRule(ruleId, { severity });
  complianceEngine.setRules(adminStore.rules);
  showToast('Severity updated.');
}

function updateRuleWeight(ruleId, weight) {
  adminStore.updateRule(ruleId, { weight: parseInt(weight, 10) || 10 });
  complianceEngine.setRules(adminStore.rules);
  showToast('Weight updated.');
}

function resetRulesDefault() {
  if (confirm('Reset all rules and score weights to default Legal Metrology (Packaged Commodities) Rules, 2011?')) {
    adminStore.resetRulesToDefault();
    complianceEngine.setRules(adminStore.rules);
    renderAdminRulesList();
    showToast('Reset to 2011 Standard.');
  }
}

function openAddRuleModal() {
  document.getElementById('add-rule-modal').classList.remove('hidden');
}

function closeAddRuleModal() {
  document.getElementById('add-rule-modal').classList.add('hidden');
}

function saveCustomRule() {
  const name = document.getElementById('new-rule-name').value.trim();
  const legalRef = document.getElementById('new-rule-ref').value.trim();
  const severity = document.getElementById('new-rule-severity').value;
  const weight = document.getElementById('new-rule-weight').value;
  const customKeyword = document.getElementById('new-rule-keyword').value.trim();

  if (!name) {
    alert('Please enter a rule name.');
    return;
  }

  adminStore.addCustomRule({
    name,
    legalRef,
    severity,
    weight,
    customKeyword,
    applicableCategories: ['all']
  });

  complianceEngine.setRules(adminStore.rules);
  renderAdminRulesList();
  closeAddRuleModal();
  showToast('New statutory rule added!');
}

function deleteCustomRule(ruleId) {
  if (confirm('Delete this custom rule?')) {
    adminStore.deleteRule(ruleId);
    complianceEngine.setRules(adminStore.rules);
    renderAdminRulesList();
    showToast('Custom rule removed.');
  }
}

/**
 * Inspector Endorsement Modal
 */
function openInspectorModal() {
  if (!state.lastScanData) {
    alert('No active scan available to endorse. Run a scan first.');
    return;
  }
  document.getElementById('modal-inspector-notes').value = state.lastScanData.inspectorNotes || '';
  document.getElementById('inspector-modal').classList.remove('hidden');
}

function closeInspectorModal() {
  document.getElementById('inspector-modal').classList.add('hidden');
}

function saveInspectorEndorsement() {
  const notes = document.getElementById('modal-inspector-notes').value;
  const name = document.getElementById('modal-inspector-name').value;

  if (state.lastScanData) {
    state.lastScanData.inspectorNotes = notes;
    state.lastScanData.inspectorName = name;
    adminStore.addScanRecord(state.lastScanData);
  }

  closeInspectorModal();
  showToast('Inspector endorsement recorded successfully.');
}

/**
 * Persona Selection Handler
 */
function initPersonaSwitcher() {
  const select = document.getElementById('user-persona-select');
  if (!select) return;

  select.addEventListener('change', e => {
    state.activePersona = e.target.value;
    const title = document.getElementById('persona-title');
    const desc = document.getElementById('persona-desc');

    if (state.activePersona === 'inspector') {
      title.textContent = 'Legal Metrology Officer (Inspector) Audit Mode';
      desc.textContent = 'Enforce statutory compliance under Rule 6 and issue non-compliance notices under Section 36 of Legal Metrology Act, 2009.';
    } else if (state.activePersona === 'retailer') {
      title.textContent = 'Retailer / Store Inventory Ingestion Mode';
      desc.textContent = 'Screen vendor shipments before retail display to prevent vicarious liability for non-compliant packaged commodities.';
    } else if (state.activePersona === 'manufacturer') {
      title.textContent = 'Manufacturer / Brand Pre-Print Proof Verification';
      desc.textContent = 'Pre-screen packaging proofs and pouch artwork prior to cylinder gravure printing to avoid costly product recalls.';
    } else {
      title.textContent = 'Consumer / Citizen Vigilance Mode';
      desc.textContent = 'Verify that the product you purchased has proper MRP, Unit Sale Price, genuine net weight, and customer grievance contacts.';
    }

    showToast(`Switched persona to: ${select.options[select.selectedIndex].text.split(' ')[1]}`);
  });
}

/**
 * File Dropzone & Camera Initialization
 */
function initEventListeners() {
  initPersonaSwitcher();

  // Drag & drop
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const addAngleInput = document.getElementById('add-angle-input');

  if (dropZone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, e => {
        e.preventDefault();
        dropZone.classList.add('dropzone-active');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, e => {
        e.preventDefault();
        dropZone.classList.remove('dropzone-active');
      });
    });

    dropZone.addEventListener('drop', e => {
      const files = e.dataTransfer.files;
      if (files.length > 0) handleUploadedFiles(files, state.scannedImages && state.scannedImages.length > 0);
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', e => {
      if (e.target.files.length > 0) handleUploadedFiles(e.target.files, false);
    });
  }

  if (addAngleInput) {
    addAngleInput.addEventListener('change', e => {
      if (e.target.files.length > 0) handleUploadedFiles(e.target.files, true);
    });
  }

  // Camera buttons
  const btnCamera = document.getElementById('btn-open-camera');
  const btnCapture = document.getElementById('btn-capture-photo');
  const btnCaptureAddAngle = document.getElementById('btn-capture-add-angle');
  const btnCloseCam = document.getElementById('btn-close-camera');

  if (btnCamera) btnCamera.addEventListener('click', startCameraStream);
  if (btnCapture) btnCapture.addEventListener('click', () => captureCameraSnapshot(false));
  if (btnCaptureAddAngle) btnCaptureAddAngle.addEventListener('click', () => captureCameraSnapshot(true));
  if (btnCloseCam) btnCloseCam.addEventListener('click', stopCameraStream);

  // Live monitoring on textarea to check stamp guidance
  const ocrTextarea = document.getElementById('ocr-raw-text');
  if (ocrTextarea) {
    ocrTextarea.addEventListener('input', () => {
      checkStampProvisoGuidance();
    });
  }

  // Staged scan permission card buttons
  const btnConfirmScan = document.getElementById('btn-confirm-start-scan');
  if (btnConfirmScan) btnConfirmScan.addEventListener('click', startUserConfirmedScan);

  const btnCancelStaged = document.getElementById('btn-cancel-staged-photos');
  if (btnCancelStaged) btnCancelStaged.addEventListener('click', clearStagedPhotos);

  // Post-scan decision card buttons
  const btnDecisionFinalize = document.getElementById('btn-decision-finalize');
  if (btnDecisionFinalize) btnDecisionFinalize.addEventListener('click', () => finalizeComplianceAudit(false));

  // Run audit CTA
  const btnRun = document.getElementById('btn-run-audit');
  if (btnRun) {
    btnRun.addEventListener('click', () => {
      if (state.auditPhase === 'staged') {
        startUserConfirmedScan();
      } else {
        finalizeComplianceAudit(true);
      }
    });
  }

  // PDF report CTA
  const btnPdf = document.getElementById('btn-download-pdf');
  if (btnPdf) {
    btnPdf.addEventListener('click', () => {
      if (state.lastScanData) {
        pdfGenerator.generateReport(state.lastScanData);
      } else {
        alert('Please run a compliance scan first before generating a report.');
      }
    });
  }

  // Endorsement modal trigger
  const btnNotes = document.getElementById('btn-add-notes-modal');
  if (btnNotes) btnNotes.addEventListener('click', openInspectorModal);

  // History filters
  ['history-search', 'history-status-filter', 'history-category-filter'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', renderHistoryTable);
  });
}

function handleUploadedFiles(fileList, isAppend = false) {
  const validFiles = Array.from(fileList).filter(f => f.type.startsWith('image/'));
  if (validFiles.length === 0) {
    alert('Please upload a valid image file (PNG, JPG, WEBP).');
    return;
  }

  if (!isAppend) {
    state.scannedImages = [];
    state.activeImageIndex = 0;
  }
  state.currentSample = null;

  let loadedCount = 0;
  const newEntries = [];

  validFiles.forEach((file) => {
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target.result;
      const img = new Image();
      img.onload = () => {
        const existingCount = state.scannedImages.length + newEntries.length;
        let surfaceName = existingCount === 0 ? 'Body / Main Label' :
          (existingCount === 1 ? 'Bottle Top / Cap Stamp' : `Surface ${existingCount + 1}`);

        if (/cap|top|stamp|neck|crown/i.test(file.name)) {
          surfaceName = 'Bottle Top / Cap Stamp';
        } else if (/back|rear|info/i.test(file.name)) {
          surfaceName = 'Back / Information Panel';
        }

        newEntries.push({
          id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          name: surfaceName,
          dataUrl: dataUrl,
          imgElement: img,
          ocrText: '',
          words: [],
          regions: []
        });

        loadedCount++;
        if (loadedCount === validFiles.length) {
          state.scannedImages = state.scannedImages.concat(newEntries);
          state.activeImageIndex = state.scannedImages.length - 1;

          const active = state.scannedImages[state.activeImageIndex];
          state.currentImageSource = active.imgElement;
          state.currentImageDataUrl = active.dataUrl;

          displayImageOnCanvas(active.imgElement, active.regions || []);
          renderMultiSurfaceStrip();
          showScanPermissionCard();
          showToast(`${newEntries.length} photo${newEntries.length > 1 ? 's' : ''} staged. Grant permission to scan.`);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

function handleUploadedFile(file) {
  handleUploadedFiles([file], false);
}

/**
 * Camera Stream Handlers
 */
async function startCameraStream() {
  const streamCont = document.getElementById('camera-stream-container');
  const uploadPrompt = document.getElementById('upload-prompt');
  const canvasCont = document.getElementById('canvas-container');
  const video = document.getElementById('camera-video');

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
    state.cameraStream = stream;
    video.srcObject = stream;

    if (uploadPrompt) uploadPrompt.classList.add('hidden');
    if (canvasCont) canvasCont.classList.add('hidden');
    if (streamCont) streamCont.classList.remove('hidden');

    showToast('Camera stream active. Align product label in viewfinder.');
  } catch (err) {
    console.warn('Camera access unavailable:', err);
    alert('Camera access could not be established. Please check device permissions or upload an image file.');
  }
}

function captureCameraSnapshot(isAppend = false) {
  const video = document.getElementById('camera-video');
  if (!video) return;

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL('image/png');
  stopCameraStream();

  const img = new Image();
  img.onload = () => {
    if (!isAppend) {
      state.scannedImages = [];
    }
    const count = state.scannedImages.length;
    const surfaceName = count === 0 ? 'Body / Main Label' :
      (count === 1 ? 'Bottle Top / Cap Stamp' : `Angle ${count + 1}`);

    const entry = {
      id: 'cam_' + Date.now(),
      name: surfaceName,
      dataUrl: dataUrl,
      imgElement: img,
      ocrText: '',
      words: [],
      regions: []
    };

    state.scannedImages.push(entry);
    state.activeImageIndex = state.scannedImages.length - 1;
    state.currentImageSource = img;
    state.currentImageDataUrl = dataUrl;
    state.currentSample = null;

    displayImageOnCanvas(img, []);
    renderMultiSurfaceStrip();
    showScanPermissionCard();
    showToast(`Captured ${surfaceName}. Grant permission to scan.`);
  };
  img.src = dataUrl;
}

function stopCameraStream() {
  if (state.cameraStream) {
    state.cameraStream.getTracks().forEach(track => track.stop());
    state.cameraStream = null;
  }
  const streamCont = document.getElementById('camera-stream-container');
  if (streamCont) streamCont.classList.add('hidden');
}

/**
 * Toast Notification Utility
 */
function showToast(message) {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toast-message');
  if (!toast || !msgEl) return;

  msgEl.textContent = message;
  toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');

  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
  }, 2800);
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Copy Extracted OCR Raw Text to Clipboard
 */
function copyOcrRawText() {
  const text = document.getElementById('ocr-raw-text')?.value || '';
  if (!text.trim()) {
    showToast('No extracted packaging text to copy.');
    return;
  }
  navigator.clipboard.writeText(text).then(() => {
    showToast('Extracted packaging text copied to clipboard!');
  }).catch(() => {
    showToast('Copied text to clipboard!');
  });
}

/**
 * --------------------------------------------------------------------------
 * Global Clipboard Paste Listener
 * --------------------------------------------------------------------------
 * Pressing Ctrl+V anywhere with a copied packaging photo/screenshot stages it for audit
 */
window.addEventListener('paste', e => {
  const activeTagName = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
  if (activeTagName === 'textarea' || activeTagName === 'input') {
    return; // Do not intercept normal typing paste in text inputs
  }

  const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
  if (!items) return;

  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      const file = items[i].getAsFile();
      if (file) {
        handleUploadedFiles([file], state.scannedImages && state.scannedImages.length > 0 && state.auditPhase === 'awaiting_decision');
        showToast('Pasted image proof from clipboard! Click "Grant Permission & Scan" to analyze.');
      }
      break;
    }
  }
});

