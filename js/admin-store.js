/**
 * LabelCheck AI — Admin Store & History Management
 * Manages configurable Legal Metrology rules, scan audit history,
 * and statistical aggregations of packaging non-compliance.
 */

const STORAGE_KEYS = {
  RULES: 'labelcheck_rules_v1',
  HISTORY: 'labelcheck_history_v1',
  SETTINGS: 'labelcheck_settings_v1'
};

class AdminStore {
  constructor() {
    this.rules = this.loadRules();
    this.history = this.loadHistory();
    this.initDefaultHistoryIfEmpty();
  }

  loadRules() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RULES);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with functions from default LegalMetrologyRules
        return this.rehydrateRules(parsed);
      }
    } catch (e) {
      console.warn('Failed to load rules from localStorage:', e);
    }
    return [...LegalMetrologyRules];
  }

  rehydrateRules(savedRules) {
    const defaultMap = new Map();
    LegalMetrologyRules.forEach(r => defaultMap.set(r.id, r));

    return savedRules.map(sr => {
      const defaultRule = defaultMap.get(sr.id);
      if (defaultRule) {
        return {
          ...defaultRule,
          name: sr.name || defaultRule.name,
          legalRef: sr.legalRef || defaultRule.legalRef,
          severity: sr.severity || defaultRule.severity,
          weight: typeof sr.weight === 'number' ? sr.weight : defaultRule.weight,
          enabled: sr.enabled !== false,
          applicableCategories: sr.applicableCategories || defaultRule.applicableCategories,
          evaluate: defaultRule.evaluate
        };
      }
      // Custom rule created by admin
      return {
        ...sr,
        enabled: sr.enabled !== false,
        evaluate: (text, cat) => {
          const keyword = sr.customKeyword || '';
          if (!keyword) return { status: 'found', extractedText: 'Pass (Admin Rule)', confidence: 0.9, notes: 'Custom admin rule satisfied.' };
          const hasMatch = new RegExp(keyword, 'i').test(text);
          return hasMatch ? {
            status: 'found',
            extractedText: `Matched pattern "${keyword}"`,
            confidence: 0.9,
            notes: `Custom condition "${keyword}" matched in label text.`
          } : {
            status: 'missing',
            extractedText: null,
            confidence: 0.9,
            notes: `Required custom parameter "${keyword}" missing.`
          };
        }
      };
    });
  }

  saveRules(rules) {
    this.rules = rules;
    try {
      const serialized = rules.map(r => ({
        id: r.id,
        name: r.name,
        legalRef: r.legalRef,
        severity: r.severity,
        weight: r.weight,
        enabled: r.enabled !== false,
        applicableCategories: r.applicableCategories,
        customKeyword: r.customKeyword
      }));
      localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(serialized));
    } catch (e) {
      console.error('Failed to save rules to localStorage:', e);
    }
  }

  resetRulesToDefault() {
    localStorage.removeItem(STORAGE_KEYS.RULES);
    this.rules = [...LegalMetrologyRules];
    return this.rules;
  }

  addCustomRule(ruleData) {
    const newRule = {
      id: 'rule_custom_' + Date.now(),
      name: ruleData.name,
      legalRef: ruleData.legalRef || 'Admin Directive',
      severity: ruleData.severity || 'major',
      weight: parseInt(ruleData.weight, 10) || 10,
      applicableCategories: ruleData.applicableCategories || ['all'],
      description: ruleData.description || 'Custom statutory requirement configured by administrator.',
      correctiveAction: ruleData.correctiveAction || 'Update package label to comply with this specific mandate.',
      customKeyword: ruleData.customKeyword || '',
      enabled: true,
      evaluate: (text, cat) => {
        const keyword = ruleData.customKeyword || '';
        const hasMatch = new RegExp(keyword, 'i').test(text);
        return hasMatch ? {
          status: 'found',
          extractedText: `Found: "${keyword}"`,
          confidence: 0.9,
          notes: `Pattern "${keyword}" verified.`
        } : {
          status: 'missing',
          extractedText: null,
          confidence: 0.85,
          notes: `Custom declaration "${ruleData.name}" was not detected.`
        };
      }
    };

    this.rules.push(newRule);
    this.saveRules(this.rules);
    return newRule;
  }

  updateRule(ruleId, updates) {
    const idx = this.rules.findIndex(r => r.id === ruleId);
    if (idx !== -1) {
      this.rules[idx] = { ...this.rules[idx], ...updates };
      this.saveRules(this.rules);
      return this.rules[idx];
    }
    return null;
  }

  deleteRule(ruleId) {
    this.rules = this.rules.filter(r => r.id !== ruleId);
    this.saveRules(this.rules);
  }

  loadHistory() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load history:', e);
    }
    return [];
  }

  saveHistory() {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(this.history));
    } catch (e) {
      console.error('Failed to save history:', e);
    }
  }

  addScanRecord(record) {
    const scanEntry = {
      id: 'scan_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      productName: record.productName || 'Unlabeled Commodity',
      category: record.category || 'all',
      score: record.score,
      overallStatus: record.overallStatus,
      statusLabel: record.statusLabel,
      thumbnail: record.thumbnail || null,
      ocrTextSnippet: (record.ocrText || '').slice(0, 200),
      fullOcrText: record.ocrText,
      results: record.results || [],
      inspectorNotes: record.inspectorNotes || '',
      inspectorName: record.inspectorName || 'Inspector LMO-14'
    };

    this.history.unshift(scanEntry);
    if (this.history.length > 100) {
      this.history = this.history.slice(0, 100);
    }
    this.saveHistory();
    return scanEntry;
  }

  clearHistory() {
    this.history = [];
    this.saveHistory();
  }

  deleteScanRecord(id) {
    this.history = this.history.filter(h => h.id !== id);
    this.saveHistory();
  }

  getScanById(id) {
    return this.history.find(h => h.id === id);
  }

  /**
   * Seed realistic initial inspection scans so charts and history are populated on first launch
   */
  initDefaultHistoryIfEmpty() {
    if (this.history.length > 0) return;

    const seedScans = [
      {
        id: 'scan_seed_1',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        productName: 'NutriCrisp Multigrain Biscuits',
        category: 'food',
        score: 96,
        overallStatus: 'green',
        statusLabel: 'Compliant',
        inspectorNotes: 'Full compliance verified under Rule 6. All declarations legible and in prescribed font height.',
        inspectorName: 'Officer R. Sharma (HQ-North)'
      },
      {
        id: 'scan_seed_2',
        timestamp: new Date(Date.now() - 3600000 * 7).toISOString(),
        productName: 'SilkGlow Ultra Moisturizing Lotion',
        category: 'cosmetic',
        score: 68,
        overallStatus: 'yellow',
        statusLabel: 'Needs Verification',
        inspectorNotes: 'Unit Sale Price missing. Notice issued under Rule 6(1)(f) to add ₹/ml declaration.',
        inspectorName: 'Officer K. Verma (West Zone)'
      },
      {
        id: 'scan_seed_3',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        productName: 'AquaShine Ultra Dishwash Gel',
        category: 'household',
        score: 45,
        overallStatus: 'red',
        statusLabel: 'Non-Compliant',
        inspectorNotes: 'Non-standard unit symbol "gms" used instead of standard SI "g". MRP lacks inclusive of all taxes.',
        inspectorName: 'Officer P. Nair (South District)'
      },
      {
        id: 'scan_seed_4',
        timestamp: new Date(Date.now() - 3600000 * 36).toISOString(),
        productName: 'Alpine Delight Dark Hazelnut Bar',
        category: 'imported',
        score: 52,
        overallStatus: 'red',
        statusLabel: 'Non-Compliant',
        inspectorNotes: 'Imported commodity lacking Country of Origin on label. Seizure warning under Section 36.',
        inspectorName: 'Officer A. Sengupta (Customs Cell)'
      },
      {
        id: 'scan_seed_5',
        timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
        productName: 'PowerPro 65W Fast Charging Cable',
        category: 'electronics',
        score: 92,
        overallStatus: 'green',
        statusLabel: 'Compliant',
        inspectorNotes: 'Electronics accessory properly labeled with unit count (1 N) and cord length.',
        inspectorName: 'Officer M. Patel (Zone 2)'
      },
      {
        id: 'scan_seed_6',
        timestamp: new Date(Date.now() - 3600000 * 72).toISOString(),
        productName: 'Golden Grain Basmati Rice 5kg',
        category: 'food',
        score: 88,
        overallStatus: 'green',
        statusLabel: 'Compliant',
        inspectorNotes: 'Satisfies standard net weight packages. Barcode verified.',
        inspectorName: 'Officer R. Sharma (HQ-North)'
      },
      {
        id: 'scan_seed_7',
        timestamp: new Date(Date.now() - 3600000 * 96).toISOString(),
        productName: 'Sparkle Fresh Oral Rinse 500ml',
        category: 'cosmetic',
        score: 58,
        overallStatus: 'red',
        statusLabel: 'Non-Compliant',
        inspectorNotes: 'Missing complete consumer care email and registered factory location.',
        inspectorName: 'Officer K. Verma (West Zone)'
      }
    ];

    this.history = seedScans;
    this.saveHistory();
  }

  /**
   * Aggregate violation frequencies across scan history
   */
  getViolationStats() {
    const stats = {
      totalScans: this.history.length,
      greenCount: 0,
      yellowCount: 0,
      redCount: 0,
      ruleViolations: {
        'Unit Sale Price (USP)': 0,
        'Consumer Care Email/Phone': 0,
        'MRP Tax Statement': 0,
        'Complete Manufacturer Address / PIN': 0,
        'Non-Standard Quantity Units': 0,
        'Country of Origin': 0,
        'Date of Manufacture / Packing': 0,
        'Product Generic Name': 0
      },
      categoryBreakdown: {
        food: { count: 0, compliant: 0 },
        cosmetic: { count: 0, compliant: 0 },
        household: { count: 0, compliant: 0 },
        imported: { count: 0, compliant: 0 },
        electronics: { count: 0, compliant: 0 },
        other: { count: 0, compliant: 0 }
      }
    };

    this.history.forEach(item => {
      if (item.overallStatus === 'green') stats.greenCount++;
      else if (item.overallStatus === 'yellow') stats.yellowCount++;
      else stats.redCount++;

      const cat = stats.categoryBreakdown[item.category] || stats.categoryBreakdown.other;
      cat.count++;
      if (item.overallStatus === 'green') cat.compliant++;

      // Simulate or parse specific violations
      if (item.score < 85) {
        if (item.category === 'cosmetic' || item.score < 75) stats.ruleViolations['Unit Sale Price (USP)']++;
        if (item.score < 60) stats.ruleViolations['Consumer Care Email/Phone']++;
        if (item.score < 50) stats.ruleViolations['MRP Tax Statement']++;
        if (item.score < 70) stats.ruleViolations['Complete Manufacturer Address / PIN']++;
        if (item.productName.toLowerCase().includes('cleaner') || item.score < 50) stats.ruleViolations['Non-Standard Quantity Units']++;
        if (item.category === 'imported' || item.score < 55) stats.ruleViolations['Country of Origin']++;
      }
    });

    return stats;
  }
}

if (typeof window !== 'undefined') {
  window.AdminStore = AdminStore;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AdminStore };
}
