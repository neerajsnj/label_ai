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
  cameraStream: null
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
 * Render Quick Test Sample Buttons
 */
function renderSamplePills() {
  const container = document.getElementById('samples-container');
  if (!container) return;

  container.innerHTML = SamplePackagedCommodities.map(sample => {
    let badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    let dotColor = 'bg-emerald-500';

    if (sample.expectedStatus === 'yellow') {
      badgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
      dotColor = 'bg-amber-500';
    } else if (sample.expectedStatus === 'red') {
      badgeClass = 'bg-rose-100 text-rose-800 border-rose-300';
      dotColor = 'bg-rose-500';
    }

    return `
      <button onclick="loadSampleCommodity('${sample.id}')" class="text-left p-2.5 rounded-lg border border-slate-200 hover:border-teal-500 bg-slate-50 hover:bg-teal-50/40 transition group flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between gap-1 mb-1">
            <span class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${badgeClass}">
              <span class="inline-block w-1.5 h-1.5 rounded-full ${dotColor} mr-1"></span>${sample.expectedScore}%
            </span>
            <span class="text-[10px] text-slate-400 uppercase font-medium">${sample.category}</span>
          </div>
          <p class="text-xs font-bold text-slate-800 group-hover:text-teal-700 leading-tight">${sample.name}</p>
        </div>
        <p class="text-[10px] text-slate-500 mt-1 line-clamp-1">${sample.subtitle}</p>
      </button>
    `;
  }).join('');
}

/**
 * Load a Curated Sample Commodity and Render Graphic
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

  // Generate visual label graphic
  const dataUrl = generateSampleLabelGraphic(sample);
  state.currentImageDataUrl = dataUrl;

  const img = new Image();
  img.onload = () => {
    state.currentImageSource = img;
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
 * Run OCR Extraction Pipeline with visual scanner beam
 */
async function runOcrPipeline(sampleFallback = null) {
  const beam = document.getElementById('scanner-beam');
  const progressCont = document.getElementById('ocr-progress-container');
  const progressBar = document.getElementById('ocr-progress-bar');
  const progressLabel = document.getElementById('ocr-progress-label');
  const progressPercent = document.getElementById('ocr-progress-percent');
  const ocrStatusPill = document.getElementById('ocr-status-pill');
  const textarea = document.getElementById('ocr-raw-text');

  if (beam) beam.classList.remove('hidden');
  if (progressCont) progressCont.classList.remove('hidden');
  if (ocrStatusPill) {
    ocrStatusPill.className = 'text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800';
    ocrStatusPill.textContent = 'Scanning & Extracting...';
  }

  try {
    const ocrResult = await ocrProcessor.extractText(
      state.currentImageSource || state.currentImageDataUrl,
      progress => {
        if (progressBar) progressBar.style.width = `${progress.progress}%`;
        if (progressPercent) progressPercent.textContent = `${progress.progress}%`;
        if (progressLabel) progressLabel.textContent = progress.status;
      },
      sampleFallback
    );

    if (textarea) textarea.value = ocrResult.text;

    if (ocrStatusPill) {
      ocrStatusPill.className = 'text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800';
      ocrStatusPill.textContent = 'Text Extracted (Ready)';
    }

    // Automatically trigger compliance rule evaluation
    evaluateCompliance();

  } catch (err) {
    console.error('OCR pipeline error:', err);
    showToast('OCR extraction failed. Please check image quality.');
  } finally {
    if (beam) beam.classList.add('hidden');
    setTimeout(() => {
      if (progressCont) progressCont.classList.add('hidden');
    }, 600);
  }
}

/**
 * Evaluate Compliance under Legal Metrology Rules, 2011
 */
function evaluateCompliance() {
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

  // Update UI Elements in Dashboard
  updateDashboardUI(auditResult);

  // Switch to Dashboard Tab to display result
  switchTab('dashboard');

  showToast(`Compliance Audit Complete: ${auditResult.score}% (${auditResult.statusLabel})`);
}

/**
 * Update the Compliance Dashboard with audit findings
 */
function updateDashboardUI(data) {
  // Score gauge circle
  const scoreBar = document.getElementById('score-circle-bar');
  const scoreNum = document.getElementById('verdict-score-num');
  const verdictBadge = document.getElementById('verdict-badge');
  const verdictCard = document.getElementById('verdict-card');
  const verdictTitle = document.getElementById('verdict-title');
  const verdictDesc = document.getElementById('verdict-desc');
  const commPill = document.getElementById('verdict-commodity-pill');
  const navBadge = document.getElementById('nav-score-badge');

  const circumference = 2 * Math.PI * 54; // ~339.292
  const offset = circumference - (data.score / 100) * circumference;

  if (scoreBar) {
    scoreBar.style.strokeDashoffset = offset;
    scoreBar.style.stroke = data.overallStatus === 'green' ? '#10b981' :
      (data.overallStatus === 'yellow' ? '#f59e0b' : '#ef4444');
  }

  if (scoreNum) scoreNum.textContent = `${data.score}%`;

  if (navBadge) {
    navBadge.classList.remove('hidden');
    navBadge.textContent = `${data.score}%`;
    navBadge.className = data.overallStatus === 'green' ? 'text-[11px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800' :
      (data.overallStatus === 'yellow' ? 'text-[11px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800' : 'text-[11px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800');
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
      if (files.length > 0) handleUploadedFile(files[0]);
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', e => {
      if (e.target.files.length > 0) handleUploadedFile(e.target.files[0]);
    });
  }

  // Camera buttons
  const btnCamera = document.getElementById('btn-open-camera');
  const btnCapture = document.getElementById('btn-capture-photo');
  const btnCloseCam = document.getElementById('btn-close-camera');

  if (btnCamera) btnCamera.addEventListener('click', startCameraStream);
  if (btnCapture) btnCapture.addEventListener('click', captureCameraSnapshot);
  if (btnCloseCam) btnCloseCam.addEventListener('click', stopCameraStream);

  // Run audit CTA
  const btnRun = document.getElementById('btn-run-audit');
  if (btnRun) btnRun.addEventListener('click', evaluateCompliance);

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

function handleUploadedFile(file) {
  if (!file.type.startsWith('image/')) {
    alert('Please upload a valid image file (PNG, JPG, WEBP).');
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    const dataUrl = e.target.result;
    state.currentImageDataUrl = dataUrl;
    state.currentSample = null;

    const img = new Image();
    img.onload = () => {
      state.currentImageSource = img;
      displayImageOnCanvas(img, []);
      runOcrPipeline();
    };
    img.src = dataUrl;
  };
  reader.readAsDataURL(file);
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

function captureCameraSnapshot() {
  const video = document.getElementById('camera-video');
  if (!video) return;

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL('image/png');
  state.currentImageDataUrl = dataUrl;
  state.currentSample = null;

  stopCameraStream();

  const img = new Image();
  img.onload = () => {
    state.currentImageSource = img;
    displayImageOnCanvas(img, []);
    runOcrPipeline();
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
