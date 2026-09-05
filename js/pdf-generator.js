/**
 * LabelCheck AI — PDF Inspection Report Generator
 * Creates standardized Legal Metrology Preliminary Compliance Inspection Reports.
 */

class PDFReportGenerator {
  constructor() {}

  /**
   * Generate and print/download an official compliance report
   * @param {Object} scanData Data object containing score, results, product details, notes
   */
  generateReport(scanData) {
    const reportId = scanData.id || `LMR-AUDIT-${Date.now().toString().slice(-6)}`;
    const dateFormatted = new Date(scanData.scannedAt || scanData.timestamp || Date.now()).toLocaleString('en-IN', {
      dateStyle: 'full',
      timeStyle: 'medium'
    });

    const statusColor = scanData.overallStatus === 'green' ? '#16a34a' :
      (scanData.overallStatus === 'yellow' ? '#ca8a04' : '#dc2626');

    const statusBg = scanData.overallStatus === 'green' ? '#dcfce7' :
      (scanData.overallStatus === 'yellow' ? '#fef9c3' : '#fee2e2');

    // Create a printable modal or new window container
    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) {
      alert('Pop-up was blocked. Please allow pop-ups for this site to view the PDF report.');
      return;
    }

    const rowsHtml = (scanData.results || []).map((r, i) => {
      let badgeClass = 'status-missing';
      let statusText = 'MISSING';

      if (r.status === 'found') {
        badgeClass = 'status-found';
        statusText = 'FOUND / COMPLIANT';
      } else if (r.status === 'unclear') {
        badgeClass = 'status-unclear';
        statusText = 'UNCLEAR / DEFICIENT';
      } else if (r.status === 'manual_verification') {
        badgeClass = 'status-verify';
        statusText = 'MANUAL VERIFY';
      }

      return `
        <tr>
          <td style="font-weight: 600; width: 28%;">
            ${r.name}
            <div style="font-size: 10px; color: #64748b; font-weight: normal; margin-top: 2px;">
              Statutory Ref: <strong>${r.legalRef}</strong> • Severity: ${r.severity.toUpperCase()}
            </div>
          </td>
          <td style="width: 18%; text-align: center;">
            <span class="badge ${badgeClass}">${statusText}</span>
          </td>
          <td style="width: 27%; font-family: monospace; font-size: 11px; background: #f8fafc; color: #334155;">
            ${r.extractedText ? escapeHtml(r.extractedText) : '<span style="color: #94a3b8; font-style: italic;">[Not Detected on Package]</span>'}
          </td>
          <td style="width: 27%; font-size: 11px; color: #475569;">
            ${escapeHtml(r.notes || '')}
          </td>
        </tr>
      `;
    }).join('');

    const nonCompliantItems = (scanData.results || []).filter(r => r.status !== 'found');
    const correctiveHtml = nonCompliantItems.length === 0 ?
      '<p style="color: #16a34a; font-size: 12px; margin: 0;">No corrective action required. All scanned mandatory declarations meet the statutory standard.</p>' :
      `<ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #334155;">
        ${nonCompliantItems.map(item => `
          <li style="margin-bottom: 6px;">
            <strong>${item.name} (${item.legalRef}):</strong> ${item.correctiveAction}
          </li>
        `).join('')}
      </ul>`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Legal Metrology Inspection Report — ${reportId}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 20px;
            background: #ffffff;
            font-size: 12px;
            line-height: 1.5;
          }
          .header-table {
            width: 100%;
            border-bottom: 3px double #0f172a;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .title-area h1 {
            margin: 0 0 4px 0;
            font-size: 18px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #0f172a;
          }
          .title-area h2 {
            margin: 0;
            font-size: 12px;
            font-weight: 500;
            color: #475569;
          }
          .report-meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 12px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 16px;
          }
          .meta-item strong {
            display: block;
            font-size: 10px;
            text-transform: uppercase;
            color: #64748b;
          }
          .meta-item span {
            font-size: 13px;
            font-weight: 600;
            color: #1e293b;
          }
          .score-card {
            border: 2px solid ${statusColor};
            background: ${statusBg};
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .score-value {
            font-size: 32px;
            font-weight: 800;
            color: ${statusColor};
          }
          table.compliance-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 18px;
          }
          table.compliance-table th {
            background: #1e293b;
            color: #ffffff;
            font-size: 11px;
            text-transform: uppercase;
            padding: 8px 10px;
            text-align: left;
          }
          table.compliance-table td {
            border: 1px solid #e2e8f0;
            padding: 7px 10px;
            vertical-align: top;
          }
          table.compliance-table tr:nth-child(even) td {
            background: #fafafa;
          }
          .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.3px;
          }
          .status-found { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
          .status-missing { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
          .status-unclear { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; }
          .status-verify { background: #e0f2fe; color: #075985; border: 1px solid #7dd3fc; }
          .section-heading {
            font-size: 13px;
            font-weight: 700;
            color: #0f172a;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 4px;
            margin: 16px 0 10px 0;
            text-transform: uppercase;
          }
          .corrective-box {
            background: #fff7ed;
            border: 1px solid #fed7aa;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 16px;
          }
          .penalty-box {
            background: #f8fafc;
            border-left: 4px solid #0f172a;
            padding: 10px 14px;
            margin-bottom: 18px;
            font-size: 11px;
            color: #334155;
          }
          .signoff-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px dashed #cbd5e1;
          }
          .signature-box {
            text-align: center;
          }
          .signature-line {
            height: 45px;
            border-bottom: 1px solid #0f172a;
            margin-bottom: 6px;
          }
          .disclaimer {
            margin-top: 24px;
            font-size: 10px;
            color: #64748b;
            text-align: justify;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
          }
          .print-actions {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #0f172a;
            padding: 10px 16px;
            border-radius: 30px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          }
          .btn-print {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            font-weight: 600;
          }
          @media print {
            .print-actions { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="print-actions">
          <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
        </div>

        <table class="header-table">
          <tr>
            <td style="width: 70px; vertical-align: middle;">
              <div style="width: 54px; height: 54px; border-radius: 50%; background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 20px;">
                ⚖️
              </div>
            </td>
            <td class="title-area" style="vertical-align: middle;">
              <h1>LabelCheck AI — Statutory Compliance Audit Report</h1>
              <h2>Inspection under Legal Metrology (Packaged Commodities) Rules, 2011 & Amendments</h2>
            </td>
            <td style="text-align: right; vertical-align: middle;">
              <div style="font-size: 11px; font-weight: bold; color: #0f172a;">AUDIT ID: ${reportId}</div>
              <div style="font-size: 10px; color: #64748b;">Generated: ${dateFormatted}</div>
            </td>
          </tr>
        </table>

        <div class="report-meta-grid">
          <div class="meta-item">
            <strong>Commodity Tested:</strong>
            <span>${escapeHtml(scanData.productName || 'Packaged Commodity')}</span>
          </div>
          <div class="meta-item">
            <strong>Category:</strong>
            <span>${(scanData.category || 'Standard').toUpperCase()}</span>
          </div>
          <div class="meta-item">
            <strong>Inspecting Official / Role:</strong>
            <span>${escapeHtml(scanData.inspectorName || 'Officer LMO-14 (Field Auditor)')}</span>
          </div>
        </div>

        <div class="score-card">
          <div>
            <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: ${statusColor};">
              Preliminary Verdict: ${scanData.statusLabel.toUpperCase()}
            </div>
            <div style="font-size: 12px; color: #334155; margin-top: 2px;">
              ${scanData.statusDescription}
            </div>
          </div>
          <div style="text-align: right;">
            <div class="score-value">${scanData.score}%</div>
            <div style="font-size: 10px; color: #64748b; font-weight: 600;">COMPLIANCE INDEX</div>
          </div>
        </div>

        <div class="section-heading">1. Statutory Declarations Evaluation Matrix</div>
        <table class="compliance-table">
          <thead>
            <tr>
              <th>Mandatory Clause</th>
              <th style="text-align: center;">Status</th>
              <th>Extracted Packaging Text</th>
              <th>Audit Observation</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="section-heading">2. Corrective Actions & Rectification Advice</div>
        <div class="corrective-box">
          ${correctiveHtml}
        </div>

        <div class="penalty-box">
          <strong>Statutory Note (Section 36, Legal Metrology Act, 2009):</strong>
          Manufacturing, packing, distributing or selling any non-standard packaged commodity or omitting mandatory declarations under Rule 6 attracts a fine of up to ₹25,000 for the first offence, up to ₹50,000 for the second offence, and imprisonment with fine for subsequent offences.
        </div>

        <div class="section-heading">3. Verification & Endorsement</div>
        <div style="font-size: 11px; color: #475569; margin-bottom: 8px;">
          Inspector Notes: ${escapeHtml(scanData.inspectorNotes || 'Preliminary automated visual scan performed. Evidence logged into department compliance database.')}
        </div>

        <div class="signoff-grid">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div style="font-weight: 600; font-size: 11px;">Inspecting Officer / Quality Auditor Signature</div>
            <div style="font-size: 10px; color: #64748b;">Seal & Date</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div style="font-weight: 600; font-size: 11px;">Manufacturer / Retailer Acknowledgment</div>
            <div style="font-size: 10px; color: #64748b;">Authorized Signatory</div>
          </div>
        </div>

        <div class="disclaimer">
          <strong>REGULATORY DISCLAIMER:</strong> This audit report is generated by <em>LabelCheck AI</em> as a digital decision-support tool for preliminary packaging-label screening. It is designed to assist manufacturers, retailers, consumers, and inspectors in detecting label defects early. Final legal verification, evidentiary sampling, compounding, and prosecution authority rests exclusively with authorized Legal Metrology Officers under the Legal Metrology Act, 2009.
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

if (typeof window !== 'undefined') {
  window.PDFReportGenerator = PDFReportGenerator;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PDFReportGenerator };
}
