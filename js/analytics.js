/**
 * LabelCheck AI — Violation Analytics & Insights Module
 * Computes violation trends, compliance distributions, and renders Chart.js charts.
 */

class AnalyticsDashboard {
  constructor(adminStore) {
    this.adminStore = adminStore;
    this.statusChart = null;
    this.violationChart = null;
    this.categoryChart = null;
  }

  render() {
    const stats = this.adminStore.getViolationStats();

    // Update KPI metric numbers in UI
    const elTotal = document.getElementById('stat-total-scans');
    const elCompliant = document.getElementById('stat-compliant-rate');
    const elTopViolation = document.getElementById('stat-top-violation');
    const elCriticalCount = document.getElementById('stat-critical-count');

    if (elTotal) elTotal.textContent = stats.totalScans;

    const compRate = stats.totalScans > 0 ?
      Math.round((stats.greenCount / stats.totalScans) * 100) : 0;
    if (elCompliant) elCompliant.textContent = `${compRate}%`;

    // Find top violation
    let topName = 'Unit Sale Price (USP)';
    let maxV = 0;
    for (const [name, count] of Object.entries(stats.ruleViolations)) {
      if (count > maxV) {
        maxV = count;
        topName = name;
      }
    }
    if (elTopViolation) elTopViolation.textContent = topName;
    if (elCriticalCount) elCriticalCount.textContent = stats.redCount;

    // Render charts
    this.renderStatusDonut(stats);
    this.renderViolationsBar(stats);
    this.renderCategoryBar(stats);
  }

  renderStatusDonut(stats) {
    const canvas = document.getElementById('chart-compliance-status');
    if (!canvas || typeof Chart === 'undefined') return;

    if (this.statusChart) this.statusChart.destroy();

    const ctx = canvas.getContext('2d');
    this.statusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Compliant (Green)', 'Needs Verification (Yellow)', 'Non-Compliant (Red)'],
        datasets: [{
          data: [stats.greenCount, stats.yellowCount, stats.redCount],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, font: { family: 'Inter', size: 11 } }
          }
        },
        cutout: '68%'
      }
    });
  }

  renderViolationsBar(stats) {
    const canvas = document.getElementById('chart-common-violations');
    if (!canvas || typeof Chart === 'undefined') return;

    if (this.violationChart) this.violationChart.destroy();

    const labels = Object.keys(stats.ruleViolations);
    const data = Object.values(stats.ruleViolations);

    const ctx = canvas.getContext('2d');
    this.violationChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Non-Compliance Incidents',
          data: data,
          backgroundColor: '#3b82f6',
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            beginAtZero: true,
            ticks: { precision: 0 }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  renderCategoryBar(stats) {
    const canvas = document.getElementById('chart-category-compliance');
    if (!canvas || typeof Chart === 'undefined') return;

    if (this.categoryChart) this.categoryChart.destroy();

    const cats = ['food', 'cosmetic', 'household', 'imported', 'electronics'];
    const displayNames = ['Food & FMCG', 'Cosmetics', 'Household', 'Imported', 'Electronics'];
    const rates = cats.map(c => {
      const data = stats.categoryBreakdown[c];
      return data && data.count > 0 ? Math.round((data.compliant / data.count) * 100) : 75;
    });

    const ctx = canvas.getContext('2d');
    this.categoryChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: displayNames,
        datasets: [{
          label: 'Compliance Rate (%)',
          data: rates,
          backgroundColor: '#059669',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: val => `${val}%`
            }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  exportAuditLogCSV() {
    const history = this.adminStore.loadHistory();
    if (!history.length) {
      alert('No scan records available to export.');
      return;
    }

    const headers = ['Scan ID', 'Timestamp', 'Product Name', 'Category', 'Compliance Score', 'Status', 'Inspector'];
    const rows = history.map(h => [
      h.id,
      h.timestamp,
      `"${(h.productName || '').replace(/"/g, '""')}"`,
      h.category,
      `${h.score}%`,
      h.overallStatus.toUpperCase(),
      `"${(h.inspectorName || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LegalMetrology_ComplianceAudit_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

if (typeof window !== 'undefined') {
  window.AnalyticsDashboard = AnalyticsDashboard;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AnalyticsDashboard };
}
