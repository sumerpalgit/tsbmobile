/**
 * Per-role Step 4 ("Business Details") field definitions — mirrors webSrc's
 * `ROLE_CONFIG` in `src/components/onboarding/UnifiedRoleForm.tsx`: one config-driven
 * component reads this instead of 8 hand-built forms, same architecture web already uses.
 *
 * Field labels/options are copied from web's real per-role copy (not invented) so the
 * eventual `PUT /api/auth/{roleEndpoint}` submission lines up field-for-field — only the
 * `value`s here are placeholders (label text used as the value, same convention as this
 * screen's other static option lists) until the backend's actual per-role field keys/codes
 * are confirmed.
 *
 * Keyed by this screen's own role labels (`ROLES` in `./constants`), not web's longer ones —
 * see `ROLE_TYPE_MAP` for the mapping ("Business Owner" here is web's "Sellers").
 */

export type RoleField = {
  key: string;
  label: string;
  type: 'select' | 'text' | 'chips';
  required?: boolean;
  placeholder?: string;
  /** For `type: 'select'`. */
  options?: { value: string; label: string }[];
  /** For `type: 'chips'`. */
  chipOptions?: string[];
  /** For `type: 'select'` — this option value reveals an extra free-text box, stored under
   * `${key}Other`, matching web's "Other (please specify)" pattern used across most roles. */
  otherWhen?: string;
};

export type RoleConfigEntry = {
  designationOptions: { value: string; label: string }[];
  sections: { title: string; fields: RoleField[] }[];
  hasDealRange: boolean;
  hasOrgWebsite: boolean;
  /** `fileType` is the document-category tag sent to `POST /profile/upload-document`'s
   * `type` field — matches webSrc's `UnifiedRoleForm.tsx` `FileUploadField` call sites
   * exactly (e.g. `cimUrl` → `"cim"`, `pitchDeckUrl` → `"pitch_deck"`). */
  uploads: { key: string; label: string; fileType: string }[];
};

const opts = (values: string[]) => values.map(v => ({ value: v, label: v }));

const OTHER_SPECIFY = 'Other (please specify)';

export const ROLE_CONFIG: Record<string, RoleConfigEntry> = {
  Searcher: {
    designationOptions: opts(['Self Funded Searcher', 'Funded Searcher', 'Independent Sponsor', 'Other']),
    sections: [
      {
        title: 'Education',
        fields: [
          {
            key: 'educationLevel',
            label: 'Highest Level of Education',
            type: 'select',
            options: opts([
              'High school/equivalent',
              "Bachelor's degree",
              "Master's degree",
              'MBA',
              'Doctorate (PhD, etc.)',
              'Professional qualification (CA/CPA/CFA/etc.)',
              'Others',
            ]),
          },
          {
            key: 'fieldOfStudy',
            label: 'Field of Study',
            type: 'select',
            options: opts([
              'Business/Management',
              'Finance/Accounting',
              'Engineering/Technology',
              'Economics',
              'Law',
              'Science',
              'Arts/Humanities',
              'Other',
            ]),
          },
          { key: 'institution', label: 'Educational Institution', type: 'text', placeholder: 'University / Institution name' },
        ],
      },
      {
        title: 'Search Details',
        fields: [
          {
            key: 'searchStage',
            label: 'Stage of Search',
            type: 'select',
            required: true,
            options: opts(['Exploring options', 'Active search (deal sourcing)', 'Under LOI / Due diligence', 'Completed acquisition', 'Other']),
          },
          {
            key: 'timeCommitment',
            label: 'Time Commitment',
            type: 'select',
            required: true,
            options: opts(['Part-time (<20 hrs/week)', 'Full-time (40+ hrs/week)', 'Flexible', 'Not yet decided']),
          },
          {
            key: 'equityStatus',
            label: 'Equity Capital Status',
            type: 'select',
            required: true,
            options: opts(['Self-funded', 'Equity raised', 'Actively fundraising', 'Not yet decided']),
          },
          {
            key: 'debtStatus',
            label: 'Debt Financing Status',
            type: 'select',
            required: true,
            options: opts(['SBA financing', 'Conventional debt', 'Seller financing', 'No debt planned', 'Exploring options']),
          },
          {
            key: 'professionalBackground',
            label: 'Professional Background',
            type: 'select',
            options: opts(['Finance/Banking', 'Consulting', 'Operations', 'Entrepreneurship', 'Other']),
          },
          {
            key: 'financingReadiness',
            label: 'Financing Readiness',
            type: 'select',
            options: opts([
              'Ready to deploy capital',
              'Exploring financing options',
              'Capital committed but not yet deployed',
              'Not applicable',
            ]),
          },
        ],
      },
    ],
    hasDealRange: true,
    hasOrgWebsite: false,
    uploads: [{ key: 'cimUrl', label: 'CIM / Information Memorandum', fileType: 'cim' }],
  },

  Investor: {
    designationOptions: opts(['Angel Investor', 'Family Office', 'Institutional Investor', 'Search Fund Investor', 'Independent Sponsor', 'Other']),
    sections: [
      {
        title: 'Investment Preferences',
        fields: [
          {
            key: 'preferredInvestmentStage',
            label: 'Preferred Investment Stage',
            type: 'select',
            required: true,
            options: opts([
              'Search capital (Back a Searcher)',
              'Acquisition equity',
              'Growth capital',
              'Buyouts',
              'Minority investments',
              OTHER_SPECIFY,
            ]),
            otherWhen: OTHER_SPECIFY,
          },
          {
            key: 'experienceYears',
            label: 'Years of Experience',
            type: 'select',
            required: true,
            options: opts(['0 to 5 years', '6 to 10 years', '10 to 15 years', '15+ years']),
          },
          {
            key: 'investmentPreference',
            label: 'Investment Preference',
            type: 'select',
            required: true,
            options: opts(['Majority', 'Significant minority', 'Minority', 'Flexible / deal-dependent']),
          },
          {
            key: 'ticketSize',
            label: 'Ticket Size',
            type: 'select',
            required: true,
            options: opts(['<$25K', '$25K–$100K', '$100K–$500K', '$500K–$1M', '$1M–$5M', '$5M–$10M', '$10M+']),
          },
        ],
      },
    ],
    hasDealRange: true,
    hasOrgWebsite: true,
    uploads: [
      { key: 'investmentCriteriaUrl', label: 'Investment Criteria', fileType: 'investment_criteria' },
      { key: 'pitchDeckUrl', label: 'Pitch Deck', fileType: 'pitch_deck' },
    ],
  },

  Lender: {
    designationOptions: opts(['Commercial Bank', 'SBA Lender', 'Private Lender', 'Mezzanine Fund', 'Equipment Financing', 'Other']),
    sections: [
      {
        title: 'Lending Preferences',
        fields: [
          {
            key: 'typeOfFinancing',
            label: 'Type of Financing',
            type: 'select',
            required: true,
            options: opts([
              'Term Loan',
              'Revolving Credit Facility',
              'Cash Flow Based Lending',
              'Asset Based Lending (ABL)',
              'Acquisition Financing',
              'Bridge financing',
              'Refinancing/Recapitalisation',
              'Equipment Financing',
              'Real Estate Financing',
              'Working capital facilities',
              'Mezzanine/Subordinated debt',
              'Others',
            ]),
          },
          {
            key: 'dealStagePreference',
            label: 'When do you typically get involved?',
            type: 'select',
            required: true,
            options: opts([
              'Pre-LOI (early conversations)',
              'At LOI/Term sheet stage',
              'In due diligence',
              'Closing/Near close',
              'Post-close/Add-on financing',
              'Flexible/Any stage',
            ]),
          },
          {
            key: 'sbaFinancingStatus',
            label: 'SBA Financing Status',
            type: 'select',
            required: true,
            options: opts([
              'Yes. SBA-approved lender',
              'No. Non-SBA lending only',
              'Both',
              'Not applicable (outside the US)',
            ]),
          },
          {
            key: 'typicalLoanSize',
            label: 'Typical Loan Size',
            type: 'select',
            options: opts(['Under $1M', '$1M–$5M', '$5M–$10M', '$10M–$25M', '$25M+']),
          },
        ],
      },
    ],
    hasDealRange: true,
    hasOrgWebsite: true,
    uploads: [{ key: 'lendingCriteriaUrl', label: 'Lending Criteria Document', fileType: 'lending_criteria' }],
  },

  Advisor: {
    designationOptions: opts(['Partner/Founder', 'Managing Director', 'Director/Principal', 'Manager/Lead', 'Independent advisor/Consultant', 'Other']),
    sections: [
      {
        title: 'Advisory Preferences',
        fields: [
          {
            key: 'typicalInvolvement',
            label: 'When do you typically get involved?',
            type: 'select',
            required: true,
            placeholder: 'Select deal stage',
            options: opts([
              'Pre-search (planning, structuring, readiness)',
              'Active search phase',
              'At LOI/Term sheet stage',
              'Due diligence phase',
              'Closing/Transaction execution',
              'Post-close/Integration and operations',
              'Ongoing/Multiple stages',
              'Flexible/Depends on engagement',
            ]),
          },
          {
            key: 'typicalClientWork',
            label: 'Who do you typically work with?',
            type: 'select',
            required: true,
            placeholder: 'Select client type',
            options: opts([
              'Searchers/First-time acquirers',
              'Independent sponsors',
              'Search fund investors',
              'PE/VC funds',
              'Business owners/Sellers',
              'Corporates',
              'PE-backed operators',
              'Lenders/Capital providers',
              'All of the above',
              OTHER_SPECIFY,
            ]),
            otherWhen: OTHER_SPECIFY,
          },
          {
            key: 'primaryRepresentation',
            label: 'Which side do you primarily represent?',
            type: 'select',
            required: true,
            placeholder: 'Select side',
            options: opts(['Buy-side only', 'Sell-side only', 'Both sides (different engagements)']),
          },
          {
            key: 'clientEngagement',
            label: 'How do you engage with clients?',
            type: 'select',
            required: true,
            placeholder: 'Select engagement type',
            options: opts([
              'Project basis (defined scope)',
              'Retainer (ongoing relationship)',
              'Success fee/Transaction close',
              'Hourly/As needed',
              'Hybrid (retainer + success fee)',
              'Platform or productized service',
              OTHER_SPECIFY,
            ]),
            otherWhen: OTHER_SPECIFY,
          },
        ],
      },
    ],
    hasDealRange: true,
    hasOrgWebsite: true,
    uploads: [{ key: 'firmCredentialsUrl', label: 'Firm Credentials / Case Studies', fileType: 'credentials' }],
  },

  'Business Owner': {
    designationOptions: opts(['Business Owner', 'Co-Owner', 'Founder', 'Other']),
    sections: [
      {
        title: 'Transaction Details',
        fields: [
          {
            key: 'transactionReason',
            label: 'Reason for Transaction',
            type: 'select',
            required: true,
            options: opts([
              'Retirement/succession',
              'Looking for a growth partner/Capital infusion',
              'Strategic shift',
              'Personal reasons',
              'Exploring options',
              OTHER_SPECIFY,
            ]),
            otherWhen: OTHER_SPECIFY,
          },
          {
            key: 'transitionType',
            label: 'Transition Type',
            type: 'select',
            required: true,
            options: opts([
              'Full exit/Clean handover',
              'Majority sale',
              'Minority investment',
              'Strategic partnership',
              'Stay on in an operating role post-sale',
              'Management buyout (selling to existing team)',
              'Flexible/Open to discussion',
            ]),
          },
          {
            key: 'operationalInvolvement',
            label: 'Operational Involvement',
            type: 'select',
            required: true,
            options: opts([
              'Fully involved',
              'Moderately involved — management handles most operations',
              'Minimal involvement',
              'Not involved',
            ]),
          },
          {
            key: 'preferredBuyer',
            label: 'Preferred Buyer Type',
            type: 'select',
            required: true,
            options: opts([
              'Individual buyer/Searcher (ETA)',
              'Strategic buyer (competitor/industry player)',
              'Private equity/Institutional buyer',
              'Family office',
              'Employee/Management team (MBO)',
              'No preference - best offer wins',
              'Open to discussion/Flexible',
            ]),
          },
        ],
      },
    ],
    hasDealRange: true,
    hasOrgWebsite: false,
    uploads: [],
  },

  Operator: {
    designationOptions: opts([
      'CXO/Senior Executive (CEO, COO, CFO, etc)',
      'Business unit/Functional head',
      'Independent Operator',
      'Recently exited Executive',
      'Semi-retired/Portfolio professional',
      'Other',
    ]),
    sections: [
      {
        title: 'Operator Preferences',
        fields: [
          {
            key: 'coreExpertise',
            label: 'Core Area of Expertise',
            type: 'select',
            required: true,
            options: opts([
              'Finance & Accounting (CFO/Controller)',
              'Operations & Process Improvement (COO/Ops Director)',
              'Sales & Revenue Growth',
              'Marketing & Brand',
              'Human Resources & People Operations',
              'Technology & Systems (CTO/IT)',
              'Supply Chain & Logistics',
              'Customer Success & Retention',
              'Legal & Compliance',
              'General Management/CEO-level',
              OTHER_SPECIFY,
            ]),
            otherWhen: OTHER_SPECIFY,
          },
          {
            key: 'interestedRoleType',
            label: 'Interested Role Type',
            type: 'select',
            required: true,
            options: opts([
              'Full-time employee',
              'Fractional executive (part-time, ongoing)',
              'Interim/Bridge role (short-term, defined period)',
              'Project-based engagement',
              'Advisory board member',
              'Operating partner (equity-involved)',
              'Open to multiple arrangements',
            ]),
          },
          {
            key: 'engagementPreference',
            label: 'Engagement Preference',
            type: 'select',
            required: true,
            options: opts(['On-site/In-person', 'Fully remote', 'Hybrid (remote with periodic on-site)', 'Flexible/Open to any arrangement']),
          },
          {
            key: 'valueStage',
            label: 'Stage Where You Add Most Value',
            type: 'select',
            required: true,
            options: opts([
              'Pre-acquisition (due diligence support, operational assessment)',
              'Day 1 to 90 days (transition & stabilization)',
              '90 days to 1 year (early growth & systems building)',
              '1 to 3 years (scaling & optimization)',
              'Turnaround/Distressed situations',
              'Ongoing operations (steady state)',
              'Multiple stages/Flexible',
            ]),
          },
        ],
      },
    ],
    hasDealRange: true,
    hasOrgWebsite: false,
    uploads: [
      { key: 'resumeUrl', label: 'Resume', fileType: 'resume' },
      { key: 'coverLetterUrl', label: 'Cover Letter', fileType: 'cover_letter' },
    ],
  },

  Intermediary: {
    designationOptions: opts(['Founder/Partner', 'Managing Director', 'Director', 'Vice President', 'Employee', 'Platform Admin/Operator', 'Other']),
    sections: [
      {
        title: 'Mandate Preferences',
        fields: [
          {
            key: 'primarySide',
            label: 'Side You Represent',
            type: 'select',
            required: true,
            options: opts(['Sell-side only', 'Buy-side only', 'Both sides (different engagements)']),
          },
          {
            key: 'mandateStructure',
            label: 'Mandate Structure',
            type: 'select',
            required: true,
            options: opts([
              'Exclusive only',
              'Non-exclusive/Co-broker friendly',
              'Both exclusive and non-exclusive',
              'Flexible/Depends on the deal',
              OTHER_SPECIFY,
            ]),
            otherWhen: OTHER_SPECIFY,
          },
          {
            key: 'mandateType',
            label: 'Mandate Type',
            type: 'select',
            required: true,
            options: opts([
              'Proprietary listings (exclusive seller mandates)',
              'Buyer search mandates (finding targets for acquirers)',
              'Both above',
              'Off-market deal sourcing',
              'Distressed/Turnaround situations',
              'Add-on acquisitions (bolt-on for existing platforms)',
              OTHER_SPECIFY,
            ]),
            otherWhen: OTHER_SPECIFY,
          },
          {
            key: 'engagementStructure',
            label: 'Engagement Structure',
            type: 'select',
            required: true,
            options: opts([
              'Success fee only (no upfront)',
              'Retainer plus success fee',
              'Retainer only',
              'Flat fee (project based)',
              "Finder's fee arrangement",
              'Flexible/deal-specific',
              OTHER_SPECIFY,
            ]),
            otherWhen: OTHER_SPECIFY,
          },
        ],
      },
    ],
    hasDealRange: true,
    hasOrgWebsite: false,
    uploads: [],
  },

  Student: {
    designationOptions: opts(['Intern', 'Trainee', OTHER_SPECIFY]),
    sections: [
      {
        title: 'Academic Details',
        fields: [
          {
            key: 'academicStage',
            label: 'Academic Stage',
            type: 'select',
            required: true,
            options: opts([
              'Undergraduate student (current)',
              'Graduate/MBA student (current)',
              'Recently graduated (within last 12 months)',
              'Early career professional (1–3 years out)',
            ]),
          },
          {
            key: 'etaInterest',
            label: 'Primary ETA Interest',
            type: 'select',
            required: true,
            options: opts([
              'Becoming a searcher/acquirer',
              'Working with a search fund',
              'Investing in ETA deals',
              'Advisory/Professional services for ETA',
              'Research & academia',
              OTHER_SPECIFY,
            ]),
            otherWhen: OTHER_SPECIFY,
          },
          {
            key: 'timeCommitment',
            label: 'Time Commitment',
            type: 'select',
            required: true,
            options: opts(['<5 hours/week', '5–10 hours/week', '10–20 hours/week', 'Full-time internship/co-op', 'Flexible']),
          },
          {
            key: 'workInterest',
            label: 'Work Interest Areas',
            type: 'chips',
            required: true,
            chipOptions: [
              'Deal sourcing & pipeline building',
              'Financial modeling & valuation',
              'Due diligence support',
              'Market & industry research',
              'Operational improvement projects',
              'Sales & business development',
              'Marketing & growth initiatives',
              'Technology & systems implementation',
              'Administrative & deal coordination',
              'Content creation & thought leadership',
              'General search fund support (broad/varied)',
              'Legal & Compliance',
              'Flexible to requirements',
              OTHER_SPECIFY,
            ],
          },
        ],
      },
    ],
    hasDealRange: false,
    hasOrgWebsite: false,
    uploads: [],
  },
};

/** All role-specific required fields (plus the always-required Industries/Geography Focus)
 * filled in — gates Step 4's "Complete" button, mirroring web's per-field validation but
 * collapsed into one check since this screen validates on submit, not per-field like web. */
export function isStep4Complete(
  role: string,
  fieldValues: Record<string, string>,
  chipValues: Record<string, string[]>,
  industries: string[],
  geographyFocus: string[],
  /** Whether the caller's three Financial Criteria sliders (Revenue/EBITDA/Enterprise Value)
   * have all been touched at least once — matches webSrc's own required check (`formData.
   * revenueMin === undefined` etc.), which only passes once the user has actually dragged each
   * slider, not just because it renders with a display default. Ignored when `!config.
   * hasDealRange` (role has no Financial Criteria section at all). */
  dealRangesTouched: boolean,
): boolean {
  const config = ROLE_CONFIG[role];
  if (!config) return false;

  const fieldsOk = config.sections
    .flatMap(s => s.fields)
    .every(f => {
      if (!f.required) return true;
      if (f.type === 'chips') return (chipValues[f.key] ?? []).length > 0;
      return !!fieldValues[f.key]?.trim();
    });

  if (config.hasDealRange && !dealRangesTouched) return false;

  return fieldsOk && industries.length > 0 && geographyFocus.length > 0;
}
