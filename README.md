# LabelCheck AI — Smart Packaged Commodity Compliance Checker

**LabelCheck AI** is an AI-assisted web platform designed to help consumers, retailers, manufacturers, and legal inspection authorities perform rapid preliminary compliance checks on packaged commodity labels against the **Legal Metrology (Packaged Commodities) Rules, 2011** (and its subsequent amendments).

---

## 🎯 Problem Statement & Regulatory Context

Under the **Legal Metrology Act, 2009** and the **Legal Metrology (Packaged Commodities) Rules, 2011 (LMPC Rules)**, every pre-packaged commodity manufactured, imported, distributed, or sold in India must bear specific statutory declarations in the prescribed format, font size, and units of measurement.

Failure to declare mandatory information or using non-standard units (such as *gms* instead of *g*, or omitting *inclusive of all taxes* with MRP) attracts severe penalties under **Section 36 of the Legal Metrology Act, 2009**:
- **First Offence:** Fine up to ₹25,000
- **Second Offence:** Fine up to ₹50,000
- **Subsequent Offences:** Fine up to ₹1,00,000 and/or imprisonment up to 1 year

**LabelCheck AI** solves the manual inspection bottleneck by automating text extraction via Optical Character Recognition (OCR) and evaluating label typography against statutory requirements in seconds.

---

## ✨ Key Capabilities

1. **Multi-Input Scanning**:
   - Upload high-resolution images of product packaging (PNG, JPG, WEBP).
   - Live camera capture from webcams or mobile devices.
   - **One-Click Curated Samples Gallery**: 5 pre-loaded realistic commodities covering **Compliant (Green)**, **Needs Verification (Yellow)**, and **Non-Compliant (Red)** states.

2. **Optical Character Recognition (OCR) & Region Mapping**:
   - In-browser OCR extraction with line-by-line parsing.
   - Interactive bounding box coordinate mapper highlighting statutory regions directly over the label image.
   - Click-to-focus on individual declarations.

3. **Mandatory Declarations Evaluated (Rule 6, 11, 12)**:
   - ✅ **Product Name / Generic Name** (Rule 6(1)(a))
   - ✅ **Net Quantity & Standard SI Units** (Rule 6(1)(b) & Rule 11/12 — enforces strict metric symbols `g`, `kg`, `ml`, `l`, `N` while rejecting illegal symbols like `gms`, `kgs`, `ml.`)
   - ✅ **Maximum Retail Price (MRP)** (Rule 6(1)(e) — verifies explicit declaration of *inclusive of all taxes*)
   - ✅ **Unit Sale Price (USP)** (Rule 6(1)(f) amendment — mandatory declaration of price per gram/ml/unit)
   - ✅ **Manufacturer / Packer / Importer Details** (Rule 6(1)(d) — complete physical address with 6-digit PIN code)
   - ✅ **Consumer Care Redressal Mechanism** (Rule 6(1)(n) — requires both telephone helpline AND email address)
   - ✅ **Month & Year of Manufacture / Packing** (Rule 6(1)(c))
   - ✅ **Country of Origin** (Rule 6(10) — strictly mandatory for imported goods)
   - ✅ **Best Before / Expiry Date** (perishable food & cosmetic goods)
   - ✅ **Batch / Lot / Code Number** (Rule 6(1)(g) — product traceability)
   - ✅ **Veg / Non-Veg Emblem & FSSAI Lic.** (supplementary harmony check for food items)

4. **Compliance Scoring & Color Badge System**:
   - 🟢 **Green (Compliant, $\ge 85\%$):** Most mandatory information is present and compliant.
   - 🟡 **Yellow (Needs Verification / Partial, $60\% - 84\%$):** Information is incomplete, non-standard, or requires manual check.
   - 🔴 **Red (Non-Compliant, $< 60\%$ or Critical Omission):** Critical statutory declarations missing; actionable violation.

5. **Actionable Corrective Guidance**:
   - For every missing or deficient declaration, the system highlights the exact defect and prescribes the corrective wording citing the relevant rule clause.

6. **Official Inspection Report (PDF Generation)**:
   - Downloadable and printable audit report featuring audit metadata, compliance index, detailed checklist matrix, corrective instructions, inspector sign-off blocks, and legal disclaimers.

7. **Scan History & Audit Logs**:
   - Stores inspection records locally with search, category filtering, and one-click export to CSV.

8. **Administrator Rule Configurator**:
   - Dynamically toggle rules on/off, adjust score weights (1–30), change severity levels (Critical, Major, Minor), or add new custom statutory rules as amendments take effect.

9. **Violation Analytics**:
   - Interactive Chart.js graphs displaying compliance distribution, most frequent non-compliance infractions, and category compliance comparisons.

10. **Role-Based Persona Views**:
    - Tailored guidance for **Legal Metrology Officers (Inspectors)**, **Retailers**, **Manufacturers**, and **Consumers**.

---

## 🚀 Quickstart Guide

### Option 1: Double-Click Launcher (Windows)
Simply double-click the `start.bat` file in the root directory. It automatically launches the local server and opens your default browser at `http://localhost:3000`.

### Option 2: Run via Terminal
```powershell
# Using the bundled agy-node or Node.js:
& "C:\Users\user\AppData\Roaming\Antigravity\bin\agy-node.cmd" server.js
```
Then open `http://localhost:3000` in any web browser.

### Option 3: Standalone Browser Opening
You can also directly open `index.html` in Chrome, Edge, Firefox, or Safari (`file:///C:/Users/user/Documents/label%20ai/index.html`).

---

## 🧪 Testing the 5 Pre-Loaded Samples

Click on any of the curated sample buttons at the top of the Scanner page:

1. **NutriCrisp Multigrain Biscuits (Food & FMCG)**:
   - Expected: 🟢 **Compliant (Score ~96%)**
   - Demonstrates complete compliance across all statutory declarations including USP, FSSAI, and consumer care.
2. **SilkGlow Ultra Moisturizing Lotion (Cosmetics)**:
   - Expected: 🟡 **Needs Verification (Score ~68%)**
   - Demonstrates detection of missing Unit Sale Price (USP), missing manufacturer PIN code, and incomplete consumer grievance email.
3. **AquaShine Ultra Dishwash Gel (Household Cleaner)**:
   - Expected: 🔴 **Non-Compliant (Score ~45%)**
   - Demonstrates detection of illegal prohibited unit symbol `"gms"` (Rule 12), missing `"inclusive of all taxes"` statement, and absence of consumer care cell.
4. **Alpine Delight Dark Hazelnut Chocolate (Imported Confectionery)**:
   - Expected: 🔴 **Non-Compliant (Score ~52%)**
   - Demonstrates critical detection of missing **Country of Origin** (Rule 6(10)) and missing importer PIN code.
5. **PowerPro 65W Fast Charging Cable (Electronics)**:
   - Expected: 🟢 **Compliant (Score ~92%)**
   - Demonstrates compliance for electronic commodities declared by count `"1 N"` and length `"1.5 m"`.

---

## ⚖️ Statutory Disclaimer
*LabelCheck AI* is designed as an AI-assisted digital decision-support tool for preliminary packaging-label verification. It assists consumers, retailers, and quality auditors in early defect detection. Final legal verification, seizure, compounding, and prosecution authority rests exclusively with authorized Legal Metrology Officers and State Controllers under the Legal Metrology Act, 2009.
