/**
 * LabelCheck AI — Legal Metrology (Packaged Commodities) Rules, 2011 Engine
 * Implements regulatory checks under Rule 6, Rule 11, Rule 12, and Rule 18.
 */

const LegalMetrologyRules = [
  {
    id: 'rule_prod_name',
    name: 'Generic / Common Name of Commodity',
    legalRef: 'Rule 6(1)(a)',
    severity: 'critical',
    weight: 15,
    applicableCategories: ['all'],
    description: 'The common or generic name of the commodity contained in the package must be clearly displayed.',
    correctiveAction: 'Ensure the specific or generic commodity name is prominently printed in the principal display panel with adequate font size according to package size (Rule 7).',
    evaluate: function (text, category) {
      const patterns = [
        /(?:product|commodity|item|name)\s*[:\-]?\s*([A-Za-z0-9\s\-\&]{3,40})/i,
        /(?:biscuit|cookies|cream|lotion|gel|shampoo|oil|detergent|cable|chocolate|rice|atta|tea|coffee|snack|chips|soap|cleaner|juice|water)/i
      ];

      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          const val = match[1] ? match[1].trim() : match[0].trim();
          return {
            status: 'found',
            extractedText: val,
            confidence: 0.92,
            notes: `Identified common commodity descriptor: "${val}"`
          };
        }
      }

      const firstLines = text.split('\n').filter(l => l.trim().length > 3).slice(0, 3);
      if (firstLines.length > 0) {
        return {
          status: 'manual_verification',
          extractedText: firstLines[0].trim(),
          confidence: 0.65,
          notes: `Likely commodity title detected on top panel: "${firstLines[0].trim()}". Verify if it unambiguously identifies the generic commodity.`
        };
      }

      return {
        status: 'missing',
        extractedText: null,
        confidence: 0.9,
        notes: 'Commodity generic or common name could not be identified on the label.'
      };
    }
  },

  {
    id: 'rule_net_qty',
    name: 'Net Quantity & Standard SI Units',
    legalRef: 'Rule 6(1)(b) & Rule 11, 12',
    severity: 'critical',
    weight: 20,
    applicableCategories: ['all'],
    description: 'Net quantity must be declared in standard units of weight, measure or number (e.g., g, kg, ml, l, m, N, units). Non-standard units (such as gms, gms., ml., kgs) are strictly prohibited.',
    correctiveAction: 'Declare net quantity in standard metric symbols: "g" for gram, "kg" for kilogram, "ml" or "mL" for millilitre, "l" or "L" for litre, or "N" for count. Avoid suffixes like "gms", "kilos", or trailing periods.',
    evaluate: function (text, category) {
      const validSiPattern = /(?:net\s*(?:quantity|weight|volume|content|wt|vol|qty)?[:.\s-]*)?(\d+(?:\.\d+)?)\s*(kg|g|mg|l|ml|cl|ltr|meter|m|cm|mm|n|units|tablets|capsules|pcs|pieces)\b/i;
      const prohibitedPattern = /(?:net\s*(?:quantity|wt|qty)?[:.\s-]*)?(\d+(?:\.\d+)?)\s*(gms\.?|kilos?|kgs\.?|ml\.|ltrs\.?|ct\.)\b/i;

      const nonStandardMatch = text.match(prohibitedPattern);
      if (nonStandardMatch) {
        return {
          status: 'unclear',
          extractedText: nonStandardMatch[0].trim(),
          confidence: 0.88,
          notes: `Non-standard unit symbol "${nonStandardMatch[2]}" found. Under Rule 12, standard SI symbols (g, kg, ml, l) must be used without plural 's' or trailing periods.`
        };
      }

      const match = text.match(validSiPattern);
      if (match) {
        const fullQty = `${match[1]} ${match[2]}`.trim();
        return {
          status: 'found',
          extractedText: match[0].trim(),
          confidence: 0.95,
          notes: `Standard net quantity detected: "${fullQty}" using legal SI unit.`
        };
      }

      if (/net\s*(?:qty|quantity|weight)/i.test(text)) {
        return {
          status: 'unclear',
          extractedText: 'Net Quantity indicator found without clear numeric measure',
          confidence: 0.7,
          notes: 'Keyword "Net Quantity" appears on label, but numeric value or metric symbol was obscured or truncated.'
        };
      }

      return {
        status: 'missing',
        extractedText: null,
        confidence: 0.95,
        notes: 'Mandatory declaration of Net Quantity is missing. Violation of Rule 6(1)(b).'
      };
    }
  },

  {
    id: 'rule_mrp',
    name: 'Maximum Retail Price (MRP) & Tax Declaration',
    legalRef: 'Rule 6(1)(e)',
    severity: 'critical',
    weight: 15,
    applicableCategories: ['all'],
    description: 'MRP must be stated in Indian Rupees (₹ or Rs.) and explicitly mention "inclusive of all taxes" (e.g. "MRP ₹ ... incl. of all taxes"). Overwriting or stickers concealing original MRP is illegal.',
    correctiveAction: 'Print MRP clearly in the format: "MRP ₹ ... (incl. of all taxes)" or "Maximum Retail Price ₹ ... (inclusive of all taxes)". No additional fee above MRP can be charged.',
    evaluate: function (text, category) {
      const mrpFullPattern = /(?:m\.?r\.?p\.?|max(?:imum)?\s*retail\s*price)[:\s]*(?:rs\.?|₹|inr)?\s*(\d+(?:\.\d{1,2})?)\s*(?:\([^\)]*taxes[^\)]*\)|incl(?:usive)?\.?\s*of\s*all\s*taxes)/i;
      const mrpPatternOnly = /(?:m\.?r\.?p\.?|max(?:imum)?\s*retail\s*price)[:\s]*(?:rs\.?|₹|inr)?\s*(\d+(?:\.\d{1,2})?)/i;
      const currencyPattern = /(?:rs\.?|₹)\s*(\d+(?:\.\d{1,2})?)/i;

      const fullMatch = text.match(mrpFullPattern);
      if (fullMatch) {
        return {
          status: 'found',
          extractedText: fullMatch[0].trim(),
          confidence: 0.98,
          notes: `MRP detected with mandatory "inclusive of all taxes" declaration: "${fullMatch[0].trim()}".`
        };
      }

      const mrpMatch = text.match(mrpPatternOnly);
      if (mrpMatch) {
        const hasTaxClause = /incl(?:usive)?\.?\s*(?:of)?\s*(?:all)?\s*tax(?:es)?/i.test(text);
        if (hasTaxClause) {
          return {
            status: 'found',
            extractedText: `${mrpMatch[0]} (incl. of taxes declared on label)`,
            confidence: 0.9,
            notes: `MRP amount ₹${mrpMatch[1]} and tax inclusion clause verified on label.`
          };
        } else {
          return {
            status: 'unclear',
            extractedText: mrpMatch[0].trim(),
            confidence: 0.82,
            notes: `MRP amount ₹${mrpMatch[1]} found, but mandatory clause "inclusive of all taxes" was NOT detected. Rule 6(1)(e) requires explicit tax declaration.`
          };
        }
      }

      const currencyMatch = text.match(currencyPattern);
      if (currencyMatch) {
        return {
          status: 'manual_verification',
          extractedText: currencyMatch[0].trim(),
          confidence: 0.6,
          notes: `Price figure "${currencyMatch[0]}" identified, but not explicitly labeled as "MRP" or "Maximum Retail Price". Needs manual verification.`
        };
      }

      return {
        status: 'missing',
        extractedText: null,
        confidence: 0.92,
        notes: 'Mandatory Maximum Retail Price (MRP) declaration is completely missing. Violation of Rule 6(1)(e).'
      };
    }
  },

  {
    id: 'rule_usp',
    name: 'Unit Sale Price (USP)',
    legalRef: 'Rule 6(1)(f) (Amendment 2021/2022)',
    severity: 'major',
    weight: 10,
    applicableCategories: ['all'],
    description: 'Mandatory declaration of Unit Sale Price (e.g. ₹ per g, ₹ per ml, ₹ per unit) where net quantity is more than 1 kg/1 litre or for multi-piece packages, enabling consumer price transparency.',
    correctiveAction: 'Calculate and print Unit Sale Price rounded off to nearest two decimal places: e.g. "₹ 0.35 / g" or "₹ 15.00 / 100ml" adjacent to MRP.',
    evaluate: function (text, category) {
      const uspPattern = /(?:unit\s*sale\s*price|u\.?s\.?p\.?)[:\s]*(?:rs\.?|₹|\u20b9|inr)?\s*(\d+(?:\.\d{1,2})?)\s*(?:\/|\s*per\s*)\s*(?:g|gm|kg|ml|l|ltr|n|unit|piece|item)\b/i;
      const ratePattern = /(?:rs\.?|₹|\u20b9|inr)\s*(\d+(?:\.\d{1,2})?)\s*(?:\/|\s*per\s*)\s*(?:100\s*g|100\s*ml|10\s*g|g|kg|ml|l|n|unit)\b/i;

      const match = text.match(uspPattern);
      if (match) {
        return {
          status: 'found',
          extractedText: match[0].trim(),
          confidence: 0.95,
          notes: `Unit Sale Price (USP) correctly declared: "${match[0].trim()}".`
        };
      }

      const rateMatch = text.match(ratePattern);
      if (rateMatch) {
        return {
          status: 'found',
          extractedText: rateMatch[0].trim(),
          confidence: 0.85,
          notes: `Unit rate formula identified: "${rateMatch[0].trim()}". Complies with USP mandate.`
        };
      }

      return {
        status: 'missing',
        extractedText: null,
        confidence: 0.88,
        notes: 'Unit Sale Price (USP) declaration is missing. Mandatory under Legal Metrology (Packaged Commodities) Amendment Rules.'
      };
    }
  },

  {
    id: 'rule_manufacturer_address',
    name: 'Manufacturer / Packer / Importer Name & Complete Address',
    legalRef: 'Rule 6(1)(d)',
    severity: 'critical',
    weight: 15,
    applicableCategories: ['all'],
    description: 'Name and complete address of the manufacturer, or packer, or importer must be printed, including city, state, and 6-digit PIN code. Mere website URL or trade name is insufficient.',
    correctiveAction: 'Provide the complete registered physical address including premise/plot number, street, city, state, and valid 6-digit postal PIN code preceded by "Mfg by:", "Packed by:", or "Imported by:".',
    evaluate: function (text, category) {
      const mfrKeywords = /(?:mfg(?:\.|ured)?\s*by|manufactured\s*by|packed\s*by|pkd\s*by|marketed\s*by|imported\s*by|mktg\s*by)[:\s]*([^\n\r]{10,120})/i;
      const pinPattern = /\b([1-9][0-9]{2}\s?[0-9]{3})\b/;
      const addressIndicators = /(?:industrial|estate|plot|road|street|nagar|sector|phase|dist|state|pvt|ltd|limited|corp)/i;

      const mfrMatch = text.match(mfrKeywords);
      const hasPin = text.match(pinPattern);
      const hasAddressTokens = addressIndicators.test(text);

      if (mfrMatch && hasPin) {
        return {
          status: 'found',
          extractedText: `${mfrMatch[0].trim()} (PIN: ${hasPin[1]})`,
          confidence: 0.95,
          notes: `Complete manufacturer/packer declaration found with valid PIN code ${hasPin[1]}.`
        };
      }

      if (mfrMatch) {
        return {
          status: 'unclear',
          extractedText: mfrMatch[0].trim(),
          confidence: 0.8,
          notes: `Manufacturer entity identified ("${mfrMatch[0].trim()}"), but complete physical address or 6-digit PIN code appears missing or illegible.`
        };
      }

      if (hasAddressTokens && hasPin) {
        return {
          status: 'manual_verification',
          extractedText: `Address found with PIN ${hasPin[1]}`,
          confidence: 0.7,
          notes: `Postal address tokens and PIN code (${hasPin[1]}) detected, but explicit role prefix ("Mfg by", "Pkd by", or "Imported by") is ambiguous.`
        };
      }

      return {
        status: 'missing',
        extractedText: null,
        confidence: 0.92,
        notes: 'Manufacturer, packer, or importer name and registered address details could not be detected.'
      };
    }
  },

  {
    id: 'rule_consumer_care',
    name: 'Consumer Care & Grievance Redressal Mechanism',
    legalRef: 'Rule 6(1)(n)',
    severity: 'critical',
    weight: 15,
    applicableCategories: ['all'],
    description: 'Every package must bear the name, address, telephone number, and e-mail address of the person or office who can be contacted in case of consumer complaints.',
    correctiveAction: 'Print comprehensive consumer assistance details: "For consumer complaints, contact Consumer Care Cell at [Address], Tel: [Toll-Free/Phone], Email: [Email]". All elements (phone + email + address/designation) are mandatory.',
    evaluate: function (text, category) {
      const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/i;
      const phonePattern = /(?:tel|phone|contact|toll\s*free|helpline|care|no\.?)[:\s\-]*(\+?91[\-\s]?)?(?:[6-9]\d{9}|1800[\s\-]?\d{3}[\s\-]?\d{3,4}|0\d{2,4}[\-\s]?\d{6,8}|\b\d{4}[\-\s]?\d{3}[\-\s]?\d{4}\b)/i;
      const careKeyword = /(?:consumer\s*care|customer\s*care|feedback|grievance|complaints?|helpline|reach\s*us)/i;

      const emailMatch = text.match(emailPattern);
      const phoneMatch = text.match(phonePattern);
      const hasCareKeyword = careKeyword.test(text);

      if (emailMatch && phoneMatch && hasCareKeyword) {
        return {
          status: 'found',
          extractedText: `Phone: ${phoneMatch[0].trim()} | Email: ${emailMatch[0]}`,
          confidence: 0.98,
          notes: `Full consumer care contact mechanism identified with phone number and email address.`
        };
      }

      if (emailMatch && phoneMatch) {
        return {
          status: 'found',
          extractedText: `Phone: ${phoneMatch[0].trim()} | Email: ${emailMatch[0]}`,
          confidence: 0.9,
          notes: `Identified phone and email communication channels for consumer grievances.`
        };
      }

      if (emailMatch || phoneMatch) {
        const foundItem = emailMatch ? `Email: ${emailMatch[0]}` : `Phone: ${phoneMatch[0].trim()}`;
        return {
          status: 'unclear',
          extractedText: foundItem,
          confidence: 0.78,
          notes: `Partial consumer care details found (${foundItem}). Rule 6(1)(n) requires BOTH telephone number AND email address.`
        };
      }

      if (hasCareKeyword) {
        return {
          status: 'unclear',
          extractedText: 'Customer care header detected without contact credentials',
          confidence: 0.65,
          notes: 'Customer care section headline found, but telephone number or email could not be parsed.'
        };
      }

      return {
        status: 'missing',
        extractedText: null,
        confidence: 0.95,
        notes: 'Consumer care contact details (telephone number and email address) are completely missing. Violation of Rule 6(1)(n).'
      };
    }
  },

  {
    id: 'rule_mfg_date',
    name: 'Month & Year of Manufacture / Packing / Import',
    legalRef: 'Rule 6(1)(c)',
    severity: 'major',
    weight: 10,
    applicableCategories: ['all'],
    description: 'The month and year in which the commodity is manufactured or pre-packed or imported must be clearly indicated (e.g., 08/2026 or Aug 2026).',
    correctiveAction: 'Display the manufacturing or pre-packing month and year prominently: "Mfg Date: MM/YYYY" or "Pkd: Month YYYY".',
    evaluate: function (text, category) {
      const mfgDatePattern = /(?:mfg(?:\.|ured)?|pkd(?:\.|ed)?|packed|import(?:ed)?|mfg\s*date|date\s*of\s*mfg|month\s*(?:&|and)?\s*year\s*(?:of)?\s*(?:mfg|manufacture|packing)?)[:\s]*([0-3]?\d[\/\-\.][0-1]?\d[\/\-\.]20\d{2}|[0-1]?\d[\/\-\.]20\d{2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s\.\,\-\/]+20\d{2})/i;
      const genericDatePattern = /\b(0[1-9]|1[0-2])[\/\-](20\d{2})\b/;

      const match = text.match(mfgDatePattern);
      if (match) {
        return {
          status: 'found',
          extractedText: match[0].trim(),
          confidence: 0.95,
          notes: `Valid manufacturing / packing date declaration identified: "${match[0].trim()}".`
        };
      }

      const genericMatch = text.match(genericDatePattern);
      if (genericMatch) {
        return {
          status: 'manual_verification',
          extractedText: genericMatch[0],
          confidence: 0.7,
          notes: `Detected Month/Year format date "${genericMatch[0]}". Confirm if it explicitly refers to date of manufacture or packing.`
        };
      }

      return {
        status: 'missing',
        extractedText: null,
        confidence: 0.9,
        notes: 'Month and year of manufacture, packing, or import was not detected on the label.'
      };
    }
  },

  {
    id: 'rule_country_origin',
    name: 'Country of Origin',
    legalRef: 'Rule 6(10) & Rule 6(1)(d)',
    severity: 'major',
    weight: 10,
    applicableCategories: ['imported', 'all'],
    description: 'Every package of imported commodity must declare the Country of Origin or Country of Manufacture. Also required for all domestic e-commerce packaging declarations.',
    correctiveAction: 'Clearly state: "Country of Origin: [Country Name]" or "Made in [Country Name]". For imported products, this must accompany the importer registration details.',
    evaluate: function (text, category) {
      const originPattern = /(?:country\s*of\s*origin|made\s*in|product\s*of|origin)[:\s]*([A-Za-z\s]{3,25})/i;
      const countryNames = /\b(india|china|germany|usa|united\s*states|switzerland|japan|vietnam|thailand|bangladesh|italy|france|korea|taiwan|malaysia|indonesia|uk|united\s*kingdom)\b/i;

      const match = text.match(originPattern);
      if (match) {
        return {
          status: 'found',
          extractedText: match[0].trim(),
          confidence: 0.96,
          notes: `Country of Origin explicitly declared: "${match[0].trim()}".`
        };
      }

      const countryMatch = text.match(countryNames);
      if (countryMatch && /(?:imported|mfg|manufactured|origin)/i.test(text)) {
        return {
          status: 'found',
          extractedText: `Country reference found: ${countryMatch[0]}`,
          confidence: 0.85,
          notes: `Origin jurisdiction "${countryMatch[0]}" identified in manufacturing context.`
        };
      }

      if (category === 'imported') {
        return {
          status: 'missing',
          extractedText: null,
          confidence: 0.95,
          notes: 'CRITICAL: Country of Origin is strictly mandatory for all imported packaged commodities under Rule 6(10).'
        };
      }

      return {
        status: 'manual_verification',
        extractedText: null,
        confidence: 0.6,
        notes: 'Country of Origin not explicitly marked. Mandatory if imported or retailed online.'
      };
    }
  },

  {
    id: 'rule_best_before',
    name: 'Best Before / Expiry / Use By Date',
    legalRef: 'Rule 6(1)(e) & Related Food/Cosmetics Rules',
    severity: 'major',
    weight: 8,
    applicableCategories: ['food', 'cosmetic'],
    description: 'Mandatory for food, cosmetics, and perishable items to indicate "Best Before" period or explicit expiry date for consumer health and safety.',
    correctiveAction: 'State: "Best Before [X] months from packaging" or "Expiry Date: MM/YYYY".',
    evaluate: function (text, category) {
      const expiryPattern = /(?:best\s*before|use\s*by|exp(?:\.|iry)?\s*date|exp)[:\s]*([^\n\r]{4,35})/i;
      const match = text.match(expiryPattern);

      if (match) {
        return {
          status: 'found',
          extractedText: match[0].trim(),
          confidence: 0.95,
          notes: `Shelf life declaration identified: "${match[0].trim()}".`
        };
      }

      if (category === 'food' || category === 'cosmetic') {
        return {
          status: 'missing',
          extractedText: null,
          confidence: 0.9,
          notes: `Shelf life declaration (Best Before or Expiry) is missing for ${category} packaged commodity.`
        };
      }

      return {
        status: 'found',
        extractedText: 'Exempt / Not strictly required for non-perishable commodity',
        confidence: 1.0,
        notes: 'Non-perishable general commodity; explicit expiry date is optional.'
      };
    }
  },

  {
    id: 'rule_batch_lot',
    name: 'Batch / Lot / Code Number',
    legalRef: 'Rule 6(1)(g)',
    severity: 'minor',
    weight: 5,
    applicableCategories: ['all'],
    description: 'A lot, code, or batch number must be marked on the package to enable product traceability in case of recalls or defects.',
    correctiveAction: 'Print the batch or lot code: "Batch No: [Code]" or "Lot No: [Code]".',
    evaluate: function (text, category) {
      const batchPattern = /(?:batch\s*(?:no\.?|number|code)?|lot\s*(?:no\.?|number|code)?|b\.?no\.?)[:\s]*([A-Za-z0-9\-\/]{3,18})/i;
      const match = text.match(batchPattern);

      if (match) {
        return {
          status: 'found',
          extractedText: match[0].trim(),
          confidence: 0.94,
          notes: `Batch/Lot tracking code detected: "${match[0].trim()}".`
        };
      }

      return {
        status: 'missing',
        extractedText: null,
        confidence: 0.85,
        notes: 'Batch or lot identifier could not be detected. Recommend marking batch number for product traceability.'
      };
    }
  },

  {
    id: 'rule_veg_nonveg',
    name: 'Veg / Non-Veg Emblem & Supplementary Food Licences',
    legalRef: 'FSSAI & Packaged Commodities Food Harmony',
    severity: 'minor',
    weight: 5,
    applicableCategories: ['food'],
    description: 'For all packaged food commodities, the green dot (Vegetarian) or brown dot (Non-Vegetarian) emblem and 14-digit FSSAI license number must be declared.',
    correctiveAction: 'Display the statutory green/brown vegetarian/non-vegetarian square symbol and declare "Lic. No. [14-digit FSSAI Number]".',
    evaluate: function (text, category) {
      if (category !== 'food') {
        return {
          status: 'found',
          extractedText: 'Exempt (Non-food commodity)',
          confidence: 1.0,
          notes: 'Not applicable for non-food commodities.'
        };
      }

      const fssaiPattern = /(?:fssai|lic\.?\s*no\.?)[:\s]*([0-9]{14})/i;
      const vegPattern = /(?:veg|vegetarian|100%\s*vegetarian|non[\-\s]*veg)/i;

      const fssaiMatch = text.match(fssaiPattern);
      const vegMatch = text.match(vegPattern);

      if (fssaiMatch && vegMatch) {
        return {
          status: 'found',
          extractedText: `FSSAI: ${fssaiMatch[1]} | Diet: ${vegMatch[0]}`,
          confidence: 0.95,
          notes: `Identified 14-digit FSSAI license (${fssaiMatch[1]}) and dietary declaration.`
        };
      }

      if (fssaiMatch || vegMatch) {
        const item = fssaiMatch ? `FSSAI Lic: ${fssaiMatch[1]}` : `Dietary mark: ${vegMatch[0]}`;
        return {
          status: 'found',
          extractedText: item,
          confidence: 0.85,
          notes: `Food label element identified: ${item}.`
        };
      }

      return {
        status: 'unclear',
        extractedText: null,
        confidence: 0.75,
        notes: 'Food category selected, but FSSAI license number or explicit dietary symbol was not detected.'
      };
    }
  }
];

class ComplianceEngine {
  constructor(customRules = null) {
    this.rules = customRules || LegalMetrologyRules;
  }

  setRules(rules) {
    this.rules = rules;
  }

  getRules() {
    return this.rules;
  }

  evaluateCompliance(ocrText, category = 'all') {
    const normalizedText = (ocrText || '').trim();
    const results = [];
    let totalWeight = 0;
    let earnedWeight = 0;
    let hasCriticalMissing = false;
    let missingCount = 0;
    let unclearCount = 0;
    let manualVerifyCount = 0;
    let foundCount = 0;

    for (const rule of this.rules) {
      const isApplicable = rule.applicableCategories.includes('all') ||
        rule.applicableCategories.includes(category) ||
        (category === 'all');

      if (!isApplicable) continue;

      const evalResult = rule.evaluate(normalizedText, category);
      totalWeight += rule.weight;

      let scoreRatio = 0;
      if (evalResult.status === 'found') {
        scoreRatio = 1.0;
        foundCount++;
      } else if (evalResult.status === 'unclear') {
        scoreRatio = 0.4;
        unclearCount++;
      } else if (evalResult.status === 'manual_verification') {
        scoreRatio = 0.5;
        manualVerifyCount++;
      } else {
        scoreRatio = 0;
        missingCount++;
        if (rule.severity === 'critical') {
          hasCriticalMissing = true;
        }
      }

      earnedWeight += (rule.weight * scoreRatio);

      results.push({
        id: rule.id,
        name: rule.name,
        legalRef: rule.legalRef,
        severity: rule.severity,
        weight: rule.weight,
        description: rule.description,
        correctiveAction: rule.correctiveAction,
        status: evalResult.status,
        extractedText: evalResult.extractedText,
        confidence: evalResult.confidence,
        notes: evalResult.notes
      });
    }

    const percentage = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

    let overallStatus = 'green';
    let statusLabel = 'Compliant';
    let statusDescription = 'Most mandatory declarations under Legal Metrology Rules, 2011 are present and compliant.';

    if (hasCriticalMissing || percentage < 60) {
      overallStatus = 'red';
      statusLabel = 'Non-Compliant';
      statusDescription = 'Critical mandatory declarations are missing. The label violates provisions of the Legal Metrology (Packaged Commodities) Rules, 2011.';
    } else if (percentage < 85 || unclearCount > 0 || manualVerifyCount > 0) {
      overallStatus = 'yellow';
      statusLabel = 'Needs Verification / Partially Compliant';
      statusDescription = 'Some declarations are unclear, incomplete, or require manual verification by an inspector.';
    }

    return {
      score: percentage,
      overallStatus,
      statusLabel,
      statusDescription,
      hasCriticalMissing,
      counts: {
        total: results.length,
        found: foundCount,
        unclear: unclearCount,
        manualVerify: manualVerifyCount,
        missing: missingCount
      },
      results,
      scannedAt: new Date().toISOString()
    };
  }
}

if (typeof window !== 'undefined') {
  window.ComplianceEngine = ComplianceEngine;
  window.LegalMetrologyRules = LegalMetrologyRules;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ComplianceEngine, LegalMetrologyRules };
}
