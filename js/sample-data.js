/**
 * LabelCheck AI — Curated Packaged Commodity Samples
 * Includes realistic packaging graphics, category classifications, and ground-truth text.
 */

const SamplePackagedCommodities = [
  {
    id: 'sample_food_compliant',
    name: 'NutriCrisp Multigrain Biscuits',
    category: 'food',
    expectedScore: 96,
    expectedStatus: 'green',
    subtitle: '200g FMCG Food Packet — Full Compliance',
    badge: 'Compliant (Green)',
    description: 'Complies with all Legal Metrology Rules, 2011 and FSSAI packaging mandates: clear SI units, MRP with taxes, USP, full registered manufacturer address with PIN, and complete customer care grievance contacts.',
    rawText: `NUTRICRISP MULTIGRAIN DIGESTIVES
Baked with 5 Healthy Grains & Oats
Net Quantity: 200 g
MRP: Rs. 45.00 (inclusive of all taxes)
Unit Sale Price: ₹ 0.225 / g
Batch No: NB-2688
Mfg Date: 08/2026
Best Before 9 months from manufacture
Manufactured by: Surya Bakeries Pvt Ltd,
Plot 42, Sector 18, Industrial Area,
Gurugram, Haryana - 122015
Country of Origin: India
For Complaints contact: Consumer Care Cell
Surya Bakeries Pvt Ltd, Plot 42, Sector 18, Gurugram, Haryana - 122015
Tel: 1800-200-8899 | Email: customercare@suryabakeries.in
FSSAI Lic. No. 10014022002891
100% Vegetarian [Green Dot Emblem]
Storage: Store in a cool, dry place away from sunlight.`,
    regions: [
      { box: [15, 8, 70, 14], label: 'Product Name', color: '#10b981' },
      { box: [15, 26, 35, 10], label: 'Net Quantity', color: '#10b981' },
      { box: [15, 38, 45, 12], label: 'MRP & Taxes', color: '#10b981' },
      { box: [15, 52, 40, 9], label: 'Unit Sale Price (USP)', color: '#10b981' },
      { box: [15, 63, 75, 18], label: 'Manufacturer & PIN', color: '#10b981' },
      { box: [15, 82, 75, 15], label: 'Consumer Care Cell', color: '#10b981' }
    ],
    theme: {
      bg: '#fbf7ee',
      headerBg: '#2d6a4f',
      accent: '#d97706',
      badgeColor: '#16a34a'
    }
  },

  {
    id: 'sample_cosmetic_partial',
    name: 'SilkGlow Ultra Moisturizing Lotion',
    category: 'cosmetic',
    expectedScore: 68,
    expectedStatus: 'yellow',
    subtitle: '250ml Cosmetic Bottle — Partially Compliant',
    badge: 'Needs Verification (Yellow)',
    description: 'Missing mandatory Unit Sale Price (USP) under 2021/2022 amendments. Manufacturer address lacks 6-digit postal PIN code and street location, and consumer care lacks required grievance email address.',
    rawText: `SILKGLOW
Ultra Moisturizing Body Lotion
Deep Nourishment with Shea Butter & Vitamin E
Net Vol.: 250 ml
MRP: Rs. 299.00 (incl. of all taxes)
Pkd: 06/2026
Use before 24 months from pkd
B.No: SG-991
Marketed by: SilkGlow Personal Care Ltd, Andheri East, Mumbai
Made in India
For Customer Feedback & Complaints:
Helpline: 9820012345
External use only. Avoid contact with eyes.`,
    regions: [
      { box: [15, 10, 70, 16], label: 'Product Name', color: '#10b981' },
      { box: [15, 30, 35, 10], label: 'Net Quantity', color: '#10b981' },
      { box: [15, 42, 45, 10], label: 'MRP (Inclusive of Taxes)', color: '#10b981' },
      { box: [15, 64, 75, 14], label: 'Address (Missing PIN)', color: '#eab308' },
      { box: [15, 80, 75, 12], label: 'Consumer Care (Missing Email)', color: '#eab308' }
    ],
    theme: {
      bg: '#fdf2f8',
      headerBg: '#9d174d',
      accent: '#ec4899',
      badgeColor: '#ca8a04'
    }
  },

  {
    id: 'sample_cleaner_violation',
    name: 'AquaShine Ultra Dishwash Gel',
    category: 'household',
    expectedScore: 45,
    expectedStatus: 'red',
    subtitle: '500g Cleaning Gel — Critical Violations',
    badge: 'Non-Compliant (Red)',
    description: 'Uses prohibited non-standard unit "gms" (violates Rule 12). Maximum Retail Price lacks mandatory "inclusive of all taxes" clause (Rule 6(1)(e)). Consumer Care cell and complete physical address are entirely omitted.',
    rawText: `AQUASHINE LEMON FRESH
Concentrated Dishwash Gel with Active Citrus
Net 500 gms
MRP: Rs. 110
Mfg: 04/2026
Lot 4402
AquaShine Cleaning Corp
Keep out of reach of children.
Tough on grease, gentle on hands.`,
    regions: [
      { box: [15, 10, 70, 16], label: 'Product Name', color: '#10b981' },
      { box: [15, 32, 45, 10], label: 'Prohibited Unit "gms"', color: '#ef4444' },
      { box: [15, 46, 40, 10], label: 'MRP Without Tax Clause', color: '#ef4444' },
      { box: [15, 68, 60, 12], label: 'Incomplete Corporate Name', color: '#ef4444' }
    ],
    theme: {
      bg: '#f0fdf4',
      headerBg: '#0f766e',
      accent: '#14b8a6',
      badgeColor: '#dc2626'
    }
  },

  {
    id: 'sample_imported_chocolate',
    name: 'Alpine Delight Dark Hazelnut Bar',
    category: 'imported',
    expectedScore: 52,
    expectedStatus: 'red',
    subtitle: '100g Imported Chocolate — Missing Origin & Importer PIN',
    badge: 'Non-Compliant (Red)',
    description: 'Imported food commodity lacking explicit Country of Origin declaration (strictly mandatory under Rule 6(10)). Importer lacks 6-digit PIN code and consumer care contact lacks registered email.',
    rawText: `ALPINE DELIGHT
Swiss Recipe Dark Hazelnut Chocolate 70% Cocoa
Net Wt: 100 g
MRP: ₹ 350.00 (inclusive of all taxes)
Unit Sale Price: ₹ 3.50 / g
Mfg Date: 03/2026
Best Before 12/2026
Batch No: AD-CH-774
Foreign Manufacturer: ChocAlp SA, Zurich, Switzerland
Imported and Distributed by: Global Treats India, Nariman Point, Mumbai
For inquiries call +91-9123456789
FSSAI Lic. No. 11521019000412
Contains tree nuts and soy lecithin.`,
    regions: [
      { box: [15, 8, 70, 15], label: 'Product Name', color: '#10b981' },
      { box: [15, 26, 35, 10], label: 'Net Quantity', color: '#10b981' },
      { box: [15, 38, 50, 10], label: 'MRP & Taxes', color: '#10b981' },
      { box: [15, 50, 40, 9], label: 'Unit Sale Price', color: '#10b981' },
      { box: [15, 68, 75, 14], label: 'Importer (Missing PIN)', color: '#eab308' },
      { box: [15, 84, 75, 10], label: 'Consumer Contact (No Email)', color: '#ef4444' }
    ],
    theme: {
      bg: '#fffbeb',
      headerBg: '#78350f',
      accent: '#b45309',
      badgeColor: '#dc2626'
    }
  },

  {
    id: 'sample_electronics_cable',
    name: 'PowerPro 65W Fast Charging Cable',
    category: 'electronics',
    expectedScore: 92,
    expectedStatus: 'green',
    subtitle: 'Consumer Electronic Accessory — Compliant',
    badge: 'Compliant (Green)',
    description: 'Full compliance under Legal Metrology Rules for consumer electronics: declared by count "1 N", dimension "1.5 m", complete manufacturer entity with PIN code, customer helpline & email, and MRP with taxes.',
    rawText: `POWERPRO
65W Ultra Fast Charging Type-C Braided Cable
Net Quantity: 1 N (1 Unit)
Dimension: Length 1.5 m (5 ft)
MRP: ₹ 499.00 (inclusive of all taxes)
Unit Sale Price: ₹ 499.00 / N
Month & Year of Manufacture: July 2026
Batch: ET-2026-C09
Country of Origin: India
Manufactured & Marketed by:
ElectroTech Devices India Pvt Ltd,
Plot 12, Phase 3, Peenya Industrial Area,
Bengaluru, Karnataka - 560058
Consumer Care & Grievance Redressal:
Customer Grievance Officer, ElectroTech Devices
Tel: 080-45678901 | Email: support@electrotech.in
Address: Same as Manufactured by`,
    regions: [
      { box: [15, 8, 70, 14], label: 'Commodity Name', color: '#10b981' },
      { box: [15, 24, 45, 10], label: 'Net Quantity (1 N) & Length (1.5 m)', color: '#10b981' },
      { box: [15, 36, 45, 10], label: 'MRP (incl. taxes)', color: '#10b981' },
      { box: [15, 48, 40, 9], label: 'Unit Sale Price (USP)', color: '#10b981' },
      { box: [15, 62, 75, 16], label: 'Manufacturer & PIN', color: '#10b981' },
      { box: [15, 80, 75, 15], label: 'Consumer Helpline & Email', color: '#10b981' }
    ],
    theme: {
      bg: '#f8fafc',
      headerBg: '#1e293b',
      accent: '#2563eb',
      badgeColor: '#16a34a'
    }
  },

  {
    id: 'sample_bottle_water_stamp',
    name: 'Meriba Packaged Drinking Water',
    category: 'food',
    expectedScore: 96,
    expectedStatus: 'green',
    subtitle: '1L Bottle — 2 Surfaces (Rule 6 Proviso Bottle Stamp)',
    badge: 'Compliant (Rule 6 Proviso)',
    description: 'Demonstrates Legal Metrology Rule 6(1) Proviso for bottled drinks: Main label declares "REFER TO STAMP ON BOTTLE" with bottle cap scan providing stamped MRP, MFD Date, and Batch Number.',
    multiSurface: true,
    surfaces: [
      {
        name: 'Body / Main Label',
        text: `PACKAGED DRINKING WATER
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
FSSAI Lic. No. 10020043000892`
      },
      {
        name: 'Bottle Top / Cap Stamp',
        text: `--- BOTTLE CAP / TOP STAMP ---
B.NO: MRB-842
MFD: 08/2026
USE BY: 02/2027
MRP: Rs. 20.00 (INCL. OF ALL TAXES)`
      }
    ],
    rawText: `--- SURFACE 1: BODY / MAIN LABEL ---
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

--- SURFACE 2: BOTTLE TOP / CAP STAMP ---
B.NO: MRB-842
MFD: 08/2026
USE BY: 02/2027
MRP: Rs. 20.00 (INCL. OF ALL TAXES)`,
    regions: [
      { box: [15, 8, 70, 14], label: 'Generic Name (Packaged Water)', color: '#10b981' },
      { box: [15, 26, 35, 10], label: 'Net Quantity (1 L)', color: '#10b981' },
      { box: [15, 38, 45, 12], label: 'Rule 6 Proviso (Refer to Stamp)', color: '#10b981' },
      { box: [15, 52, 40, 9], label: 'Unit Sale Price (USP)', color: '#10b981' },
      { box: [15, 63, 75, 18], label: 'Manufacturer & FSSAI', color: '#10b981' },
      { box: [15, 82, 75, 15], label: 'Consumer Care Cell', color: '#10b981' }
    ],
    theme: {
      bg: '#f0f9ff',
      headerBg: '#0284c7',
      accent: '#0ea5e9',
      badgeColor: '#16a34a'
    }
  }
];

/**
 * Generate an authentic visual label graphic on an HTML5 canvas or SVG data URL
 */
function generateSampleLabelGraphic(sample) {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = sample.theme.bg || '#ffffff';
  ctx.fillRect(0, 0, 600, 800);

  // Outer border & shadow effect
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 580, 780);

  // Top header banner
  ctx.fillStyle = sample.theme.headerBg || '#1e293b';
  ctx.fillRect(10, 10, 580, 90);

  // Header Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(sample.name.toUpperCase(), 300, 50);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '14px "Inter", sans-serif';
  ctx.fillText(sample.subtitle || 'Packaged Commodity Label', 300, 78);

  // Decorative barcode placeholder on top right
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(490, 20, 80, 50);
  ctx.fillStyle = '#000000';
  for (let i = 495; i < 565; i += 4) {
    if (Math.sin(i * 9) > -0.2) {
      ctx.fillRect(i, 25, 2, 40);
    }
  }

  // Dietary emblem (if food)
  if (sample.category === 'food') {
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 25, 30, 30);
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.arc(45, 40, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  // Label text lines
  ctx.textAlign = 'left';
  const lines = sample.rawText.split('\n');
  let y = 135;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      y += 10;
      return;
    }

    if (trimmed.startsWith('NUTRICRISP') || trimmed.startsWith('SILKGLOW') ||
        trimmed.startsWith('AQUASHINE') || trimmed.startsWith('ALPINE') ||
        trimmed.startsWith('POWERPRO')) {
      ctx.fillStyle = sample.theme.headerBg;
      ctx.font = 'bold 18px "Inter", sans-serif';
      ctx.fillText(trimmed, 30, y);
      y += 26;
    } else if (trimmed.startsWith('MRP:') || trimmed.startsWith('Net Quantity:') ||
               trimmed.startsWith('Net Vol.:') || trimmed.startsWith('Net 500') ||
               trimmed.startsWith('Unit Sale Price:')) {
      // Highlighted regulatory section
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(25, y - 16, 550, 24);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px "Inter", monospace';
      ctx.fillText(trimmed, 35, y);
      y += 28;
    } else if (trimmed.startsWith('Manufactured') || trimmed.startsWith('Marketed') ||
               trimmed.startsWith('Imported') || trimmed.startsWith('For Complaints')) {
      ctx.fillStyle = '#1e3a8a';
      ctx.font = 'bold 13px "Inter", sans-serif';
      ctx.fillText(trimmed, 30, y);
      y += 22;
    } else {
      ctx.fillStyle = '#334155';
      ctx.font = '12px "Inter", sans-serif';
      ctx.fillText(trimmed, 30, y);
      y += 20;
    }
  });

  // Regulatory footer stamp
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(10, 730, 580, 60);
  ctx.fillStyle = '#475569';
  ctx.font = '11px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LEGAL METROLOGY (PACKAGED COMMODITIES) RULES, 2011 COMPLIANCE AUDIT SPECIMEN', 300, 755);
  ctx.fillText(`Specimen ID: ${sample.id} • Category: ${sample.category.toUpperCase()} • Score: ${sample.expectedScore}%`, 300, 772);

  return canvas.toDataURL('image/png');
}

if (typeof window !== 'undefined') {
  window.SamplePackagedCommodities = SamplePackagedCommodities;
  window.generateSampleLabelGraphic = generateSampleLabelGraphic;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SamplePackagedCommodities, generateSampleLabelGraphic };
}
