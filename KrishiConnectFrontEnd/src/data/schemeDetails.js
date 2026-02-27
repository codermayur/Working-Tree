/**
 * Scheme details mapping — keyed by slug.
 * Used for dynamic scheme detail pages. Missing slugs get GENERIC fallback.
 */
export const SCHEME_DETAILS = {
  'pradhan-mantri-kisan-samman-nidhi-pm-kisan': {
    overview:
      'PM-KISAN is a Central Sector Scheme to provide financial support of ₹6,000 per year in three equal installments to landholding farmer families. The amount is transferred directly to bank accounts of beneficiaries.',
    benefits: [
      '₹6,000 per year in 3 equal installments of ₹2,000 each',
      'Direct Benefit Transfer (DBT) to bank accounts',
      'No middlemen; transparent and timely assistance',
      'Supports purchase of inputs and allied activities',
    ],
    eligibility: [
      'Landholding farmer family with cultivable land',
      'Valid bank account linked with Aadhaar',
      'Land records as per state revenue norms',
      'Indian citizenship',
    ],
    documents: ['Aadhaar card', 'Land records / revenue documents', 'Bank account details', 'Passport-size photograph'],
    steps: [
      'Visit Common Service Centre (CSC) or State government portal',
      'Submit Aadhaar and land details for verification',
      'Link bank account and complete e-KYC',
      'Receive confirmation; installments credited automatically',
    ],
    notes:
      'Farmers ineligible for the scheme include those holding constitutional posts, present/former ministers, and higher income tax payers. Installments are released in April–July, August–November, and December–March.',
    targetBeneficiaries: 'Landholding farmer families',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    launchYear: '2019',
    applicationMode: 'Online (CSC / State portal)',
    status: 'Active',
  },
  'kisan-credit-card-kcc': {
    overview:
      'Kisan Credit Card (KCC) provides farmers with timely and adequate credit for cultivation, crop production, and other short-term needs. It offers flexible repayment and interest subvention.',
    benefits: [
      'Credit limit for crop production and allied activities',
      'Interest subvention for timely repayment',
      'Flexible repayment aligned with harvest cycles',
      'Coverage for tenant farmers and SHGs',
    ],
    eligibility: [
      'Individual farmers, including small and marginal',
      'Tenant farmers, sharecroppers, and oral lessees',
      'Self-Help Groups (SHGs) of farmers',
      'Joint liability groups',
    ],
    documents: ['Land documents / cultivation proof', 'Identity proof (Aadhaar)', 'Passport-size photograph', 'Bank account details'],
    steps: [
      'Approach your bank (rural branch or designated bank)',
      'Submit application with land and identity documents',
      'Bank assesses credit limit based on landholding and cropping',
      'KCC issued; withdraw as per crop cycle needs',
    ],
    notes:
      'KCC is typically valid for 5 years with annual renewal. Interest subvention is available for short-term crop loans; check with your bank for current rates.',
    targetBeneficiaries: 'Individual farmers, tenant farmers, SHGs',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    launchYear: '1998',
    applicationMode: 'Bank branch / CSC',
    status: 'Active',
  },
  'pradhan-mantri-fasal-bima-yojana-pmfby': {
    overview:
      'PMFBY is a crop insurance scheme to protect farmers against yield loss due to natural calamities, pests, and diseases. It offers low premium and quick claim settlement.',
    benefits: [
      'Low premium: 2% (kharif), 1.5% (rabi), 5% (horticulture)',
      'Coverage for yield loss and prevented sowing',
      'Quick claim settlement through technology',
      'Coverage for post-harvest losses in select cases',
    ],
    eligibility: [
      'All farmers growing notified crops',
      'Sharecroppers and tenant farmers',
      'Landholding as per state revenue records',
    ],
    documents: ['Aadhaar', 'Land record / sowing certificate', 'Bank account details', 'Crop details'],
    steps: [
      'Enroll during sowing period at bank, CSC, or insurance company',
      'Pay premium; rest is subsidized by government',
      'In case of loss, inform bank/insurance; claim processed',
      'Claim amount credited to bank account',
    ],
    notes:
      'Enrollment is mandatory for loanee farmers in many states. Non-loanee farmers can opt in voluntarily. Cut-off dates for enrollment vary by crop and season.',
    targetBeneficiaries: 'All farmers (notified crops)',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    launchYear: '2016',
    applicationMode: 'Bank / CSC / Insurance provider',
    status: 'Active',
  },
  'soil-health-card-scheme': {
    overview:
      'Soil Health Card Scheme provides farmers with a card that shows nutrient status of their soil and recommendations for fertilizers and amendments. It promotes balanced use of nutrients and better yield.',
    benefits: [
      'Free soil testing every 2 years',
      'Nutrient status and crop-wise recommendations',
      'Better fertilizer use and cost saving',
      'Improved soil health over time',
    ],
    eligibility: ['All farmers with cultivable land'],
    documents: ['Land details', 'Aadhaar', 'Contact information'],
    steps: [
      'Register at agriculture office or online portal',
      'Soil samples collected from your field',
      'Lab testing and recommendation generation',
      'Soil Health Card delivered to you',
    ],
    notes:
      'One card is issued per holding every 2 years. Recommendations are crop-specific; follow them for optimal results.',
    targetBeneficiaries: 'All farmers',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    launchYear: '2015',
    applicationMode: 'State agriculture department / Online',
    status: 'Active',
  },
  'pm-kusum': {
    overview:
      'PM-KUSUM aims to increase use of solar power in agriculture by supporting solar pumps, grid-connected pumps, and solarization of existing pumps. It reduces diesel dependency and provides extra income through surplus power.',
    benefits: [
      'Subsidy on standalone solar pumps',
      'Solarization of grid-connected agricultural pumps',
      'Sale of surplus solar power to DISCOMs',
      'Reduced electricity and diesel cost',
    ],
    eligibility: [
      'Farmers with grid-connected agricultural pumps',
      'Farmers willing to install standalone solar pumps',
      'As per state-wise allocation and eligibility',
    ],
    documents: ['Land documents', 'Aadhaar', 'Electricity connection details', 'Bank account'],
    steps: [
      'Check state-wise scheme notification and eligibility',
      'Register on national/state portal',
      'Select vendor and get installation done',
      'Submit documents and claim subsidy',
    ],
    notes:
      'Component-wise subsidies and caps apply. State nodal agencies implement the scheme; check latest guidelines for your state.',
    targetBeneficiaries: 'Farmers with / without grid connection',
    ministry: 'Ministry of New & Renewable Energy',
    launchYear: '2019',
    applicationMode: 'Online (State portal)',
    status: 'Active',
  },
};

/** Generic fallback when slug is not in SCHEME_DETAILS */
export const GENERIC_DETAILS = {
  overview:
    'This is a Government of India scheme under the Agriculture & Farmers Welfare sector. It aims to support farmers through financial assistance, subsidies, infrastructure, or allied services. For exact benefits and process, please refer to the official portal or contact your nearest agriculture office.',
  benefits: [
    'Financial assistance or subsidy as per scheme norms',
    'Support for farming and allied activities',
    'Access to government infrastructure and services',
    'Eligibility-based benefits as per official guidelines',
  ],
  eligibility: [
    'Eligibility criteria are defined by the scheme',
    'Typically includes farmers, FPOs, or agri-entrepreneurs',
    'Check official portal for exact requirements',
  ],
  documents: ['Aadhaar', 'Land/cultivation proof (if applicable)', 'Bank account details', 'Any scheme-specific documents as notified'],
  steps: [
    'Visit the official scheme portal or CSC',
    'Register and verify your details',
    'Submit required documents',
    'Track application and receive benefits as per scheme',
  ],
  notes:
    'Details may vary by state and scheme updates. Always refer to the official portal (via Apply button) for the latest eligibility, documents, and process.',
  targetBeneficiaries: 'As per scheme guidelines',
  ministry: 'Ministry of Agriculture & Farmers Welfare',
  launchYear: '—',
  applicationMode: 'Online / Offline (see official portal)',
  status: 'Active',
};

/**
 * Get details for a scheme by slug. Returns merged details; uses GENERIC_DETAILS when slug not found.
 */
export function getSchemeDetails(slug) {
  if (!slug || typeof slug !== 'string') return GENERIC_DETAILS;
  const trimmed = slug.trim().toLowerCase();
  return SCHEME_DETAILS[trimmed] ?? GENERIC_DETAILS;
}
