/**
 * 2026 State Income Tax Rates, Brackets, and Deductions
 *
 * Sources: Tax Foundation "2026 State Income Tax Rates and Brackets"
 * https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/
 *
 * Many states with graduated rates double their single brackets for MFJ filers.
 * For states where HOH brackets aren't separately published, we approximate
 * using a ~1.5x multiplier on single brackets or the federal HOH ratio.
 */

import type { FilingStatus } from './tax-calculator';

// ─── Types ────────────────────────────────────────────────────────────────────

export type StateTaxType = 'none' | 'flat' | 'graduated' | 'mixed';

export interface StateBracket {
	/** Upper limit of this bracket. Use Infinity for the top bracket. */
	limit: number;
	rate: number;
}

export interface StateTaxConfig {
	name: string;
	abbreviation: string;
	type: StateTaxType;
	/** Flat rate, if applicable */
	flatRate?: number;
	/** Progressive brackets for single filers */
	brackets?: StateBracket[];
	/** Progressive brackets for married filing jointly */
	bracketsMfj?: StateBracket[];
	/** Standard deduction (0 if none) */
	standardDeduction?: {
		single: number;
		married: number;
		headOfHousehold: number;
	};
	/** Personal exemption */
	personalExemption?: {
		single: number;
		married: number;
		dependent: number;
	};
	/**
	 * If true, the state uses the federal standard deduction amount.
	 * The specific inflation-adjusted amount is listed in standardDeduction.
	 */
	usesFederalStandardDeduction?: boolean;
	/**
	 * Starting point for state taxable income:
	 * 'federal-agi' – uses Federal Adjusted Gross Income
	 * 'federal-taxable' – uses Federal Taxable Income
	 * 'state-defined' – has its own definition
	 */
	startingPoint: 'federal-agi' | 'federal-taxable' | 'state-defined';
	/** Notes about special rules */
	notes?: string;
}

// ─── No-Tax States ────────────────────────────────────────────────────────────

const NO_TAX_STATES: StateTaxConfig[] = [
	{ abbreviation: 'AK', name: 'Alaska', type: 'none', startingPoint: 'state-defined' },
	{ abbreviation: 'FL', name: 'Florida', type: 'none', startingPoint: 'state-defined' },
	{ abbreviation: 'NV', name: 'Nevada', type: 'none', startingPoint: 'state-defined' },
	{ abbreviation: 'NH', name: 'New Hampshire', type: 'none', startingPoint: 'state-defined' },
	{ abbreviation: 'SD', name: 'South Dakota', type: 'none', startingPoint: 'state-defined' },
	{ abbreviation: 'TN', name: 'Tennessee', type: 'none', startingPoint: 'state-defined' },
	{ abbreviation: 'TX', name: 'Texas', type: 'none', startingPoint: 'state-defined' },
	{ abbreviation: 'WY', name: 'Wyoming', type: 'none', startingPoint: 'state-defined' },
];

// ─── Flat-Rate States ─────────────────────────────────────────────────────────

const FLAT_TAX_STATES: StateTaxConfig[] = [
	{
		abbreviation: 'AZ',
		name: 'Arizona',
		type: 'flat',
		flatRate: 0.025,
		startingPoint: 'federal-agi',
		standardDeduction: { single: 8350, married: 16700, headOfHousehold: 12550 },
		notes: 'Standard deduction can be increased by 34% of charitable deductions.',
	},
	{
		abbreviation: 'CO',
		name: 'Colorado',
		type: 'flat',
		flatRate: 0.044,
		startingPoint: 'federal-taxable',
		standardDeduction: { single: 16100, married: 32200, headOfHousehold: 24150 },
	},
	{
		abbreviation: 'GA',
		name: 'Georgia',
		type: 'flat',
		flatRate: 0.0519,
		startingPoint: 'federal-agi',
		standardDeduction: { single: 12000, married: 24000, headOfHousehold: 18000 },
		personalExemption: { single: 0, married: 0, dependent: 4000 },
	},
	{
		abbreviation: 'ID',
		name: 'Idaho',
		type: 'flat',
		flatRate: 0.053,
		startingPoint: 'federal-taxable',
		standardDeduction: { single: 16100, married: 32200, headOfHousehold: 24150 },
	},
	{
		abbreviation: 'IL',
		name: 'Illinois',
		type: 'flat',
		flatRate: 0.0495,
		startingPoint: 'federal-agi',
		standardDeduction: { single: 0, married: 0, headOfHousehold: 0 },
		personalExemption: { single: 2925, married: 5850, dependent: 2925 },
	},
	{
		abbreviation: 'IN',
		name: 'Indiana',
		type: 'flat',
		flatRate: 0.0295,
		startingPoint: 'federal-agi',
		standardDeduction: { single: 0, married: 0, headOfHousehold: 0 },
		personalExemption: { single: 1000, married: 2000, dependent: 1000 },
	},
	{
		abbreviation: 'IA',
		name: 'Iowa',
		type: 'flat',
		flatRate: 0.038,
		startingPoint: 'federal-taxable',
		standardDeduction: { single: 16100, married: 32200, headOfHousehold: 24150 },
	},
	{
		abbreviation: 'KY',
		name: 'Kentucky',
		type: 'flat',
		flatRate: 0.035,
		startingPoint: 'state-defined',
		standardDeduction: { single: 3360, married: 3360, headOfHousehold: 3360 },
		notes: 'Standard deduction is not doubled for MFJ. Many married taxpayers file separately.',
	},
	{
		abbreviation: 'LA',
		name: 'Louisiana',
		type: 'flat',
		flatRate: 0.03,
		startingPoint: 'federal-agi',
		standardDeduction: { single: 12875, married: 25750, headOfHousehold: 19315 },
	},
	{
		abbreviation: 'MA',
		name: 'Massachusetts',
		type: 'graduated',
		flatRate: 0.05,
		brackets: [
			{ limit: 1_083_150, rate: 0.05 },
			{ limit: Infinity, rate: 0.09 },
		],
		bracketsMfj: [
			{ limit: 1_083_150, rate: 0.05 },
			{ limit: Infinity, rate: 0.09 },
		],
		startingPoint: 'federal-agi',
		standardDeduction: { single: 0, married: 0, headOfHousehold: 0 },
		personalExemption: { single: 4400, married: 8800, dependent: 1000 },
		notes: '9% rate applies to income over $1,083,150. Excludes the 0.46% PFML payroll tax.',
	},
	{
		abbreviation: 'MI',
		name: 'Michigan',
		type: 'flat',
		flatRate: 0.0425,
		startingPoint: 'federal-agi',
		standardDeduction: { single: 0, married: 0, headOfHousehold: 0 },
		personalExemption: { single: 5900, married: 11800, dependent: 5900 },
	},
	{
		abbreviation: 'MS',
		name: 'Mississippi',
		type: 'graduated',
		brackets: [
			{ limit: 10000, rate: 0.0 },
			{ limit: Infinity, rate: 0.04 },
		],
		bracketsMfj: [
			{ limit: 10000, rate: 0.0 },
			{ limit: Infinity, rate: 0.04 },
		],
		startingPoint: 'state-defined',
		standardDeduction: { single: 2300, married: 4600, headOfHousehold: 3450 },
		personalExemption: { single: 6000, married: 12000, dependent: 1500 },
		notes: 'Rate scheduled to decrease to 3.75% in 2027, 3.5% in 2028.',
	},
	{
		abbreviation: 'NC',
		name: 'North Carolina',
		type: 'flat',
		flatRate: 0.0399,
		startingPoint: 'federal-agi',
		standardDeduction: { single: 12750, married: 25500, headOfHousehold: 19125 },
	},
	{
		abbreviation: 'OH',
		name: 'Ohio',
		type: 'flat',
		flatRate: 0.0275,
		startingPoint: 'state-defined',
		standardDeduction: { single: 0, married: 0, headOfHousehold: 0 },
		personalExemption: { single: 2400, married: 4800, dependent: 2400 },
		notes: '2.75% flat rate on nonbusiness income over $26,050. First $26,050 is taxed at 0%. Personal exemption phases out above $500K AGI.',
	},
	{
		abbreviation: 'PA',
		name: 'Pennsylvania',
		type: 'flat',
		flatRate: 0.0307,
		startingPoint: 'state-defined',
		standardDeduction: { single: 0, married: 0, headOfHousehold: 0 },
	},
	{
		abbreviation: 'UT',
		name: 'Utah',
		type: 'flat',
		flatRate: 0.045,
		startingPoint: 'federal-agi',
		standardDeduction: { single: 0, married: 0, headOfHousehold: 0 },
		notes: 'Standard deduction is taken as a nonrefundable credit of 6% of federal standard/itemized deduction.',
	},
];

// ─── Graduated-Rate States ────────────────────────────────────────────────────

const GRADUATED_TAX_STATES: StateTaxConfig[] = [
	{
		abbreviation: 'AL',
		name: 'Alabama',
		type: 'graduated',
		brackets: [
			{ limit: 500, rate: 0.02 },
			{ limit: 3000, rate: 0.04 },
			{ limit: Infinity, rate: 0.05 },
		],
		bracketsMfj: [
			{ limit: 1000, rate: 0.02 },
			{ limit: 6000, rate: 0.04 },
			{ limit: Infinity, rate: 0.05 },
		],
		startingPoint: 'state-defined',
		standardDeduction: { single: 3000, married: 8500, headOfHousehold: 5750 },
		personalExemption: { single: 1500, married: 3000, dependent: 1000 },
	},
	{
		abbreviation: 'AR',
		name: 'Arkansas',
		type: 'graduated',
		brackets: [
			{ limit: 4600, rate: 0.02 },
			{ limit: Infinity, rate: 0.039 },
		],
		bracketsMfj: [
			{ limit: 4600, rate: 0.02 },
			{ limit: Infinity, rate: 0.039 },
		],
		startingPoint: 'state-defined',
		standardDeduction: { single: 2470, married: 4940, headOfHousehold: 3705 },
		notes: 'Separate tax tables exist for earners under $92,300 with rates up to 3.9%.',
	},
	{
		abbreviation: 'CA',
		name: 'California',
		type: 'graduated',
		brackets: [
			{ limit: 11079, rate: 0.01 },
			{ limit: 26264, rate: 0.02 },
			{ limit: 41452, rate: 0.04 },
			{ limit: 57542, rate: 0.06 },
			{ limit: 72724, rate: 0.08 },
			{ limit: 371479, rate: 0.093 },
			{ limit: 445771, rate: 0.103 },
			{ limit: 742953, rate: 0.113 },
			{ limit: 1_000_000, rate: 0.123 },
			{ limit: Infinity, rate: 0.133 },
		],
		bracketsMfj: [
			{ limit: 22158, rate: 0.01 },
			{ limit: 52528, rate: 0.02 },
			{ limit: 82904, rate: 0.04 },
			{ limit: 115084, rate: 0.06 },
			{ limit: 145448, rate: 0.08 },
			{ limit: 742958, rate: 0.093 },
			{ limit: 891542, rate: 0.103 },
			{ limit: 1_000_000, rate: 0.113 },
			{ limit: 1_485_906, rate: 0.123 },
			{ limit: Infinity, rate: 0.133 },
		],
		startingPoint: 'state-defined',
		standardDeduction: { single: 5540, married: 11080, headOfHousehold: 8310 },
		notes: 'Includes 1% mental health services tax over $1M. Excludes CA SDI payroll tax of 1.1%. Top brackets not fully indexed.',
	},
	{
		abbreviation: 'CT',
		name: 'Connecticut',
		type: 'graduated',
		brackets: [
			{ limit: 10000, rate: 0.02 },
			{ limit: 50000, rate: 0.045 },
			{ limit: 100000, rate: 0.055 },
			{ limit: 200000, rate: 0.06 },
			{ limit: 250000, rate: 0.065 },
			{ limit: 500000, rate: 0.069 },
			{ limit: Infinity, rate: 0.0699 },
		],
		bracketsMfj: [
			{ limit: 20000, rate: 0.02 },
			{ limit: 100000, rate: 0.045 },
			{ limit: 200000, rate: 0.055 },
			{ limit: 400000, rate: 0.06 },
			{ limit: 500000, rate: 0.065 },
			{ limit: 1_000_000, rate: 0.069 },
			{ limit: Infinity, rate: 0.0699 },
		],
		startingPoint: 'federal-agi',
		standardDeduction: { single: 0, married: 0, headOfHousehold: 0 },
		personalExemption: { single: 15000, married: 24000, dependent: 0 },
		notes: 'Has tax benefit recapture and complex phaseout provisions. Personal exemption phases out at higher incomes.',
	},
	{
		abbreviation: 'DE',
		name: 'Delaware',
		type: 'graduated',
		brackets: [
			{ limit: 2000, rate: 0.0 },
			{ limit: 5000, rate: 0.022 },
			{ limit: 10000, rate: 0.039 },
			{ limit: 20000, rate: 0.048 },
			{ limit: 25000, rate: 0.052 },
			{ limit: 60000, rate: 0.0555 },
			{ limit: Infinity, rate: 0.066 },
		],
		bracketsMfj: [
			{ limit: 2000, rate: 0.0 },
			{ limit: 5000, rate: 0.022 },
			{ limit: 10000, rate: 0.039 },
			{ limit: 20000, rate: 0.048 },
			{ limit: 25000, rate: 0.052 },
			{ limit: 60000, rate: 0.0555 },
			{ limit: Infinity, rate: 0.066 },
		],
		startingPoint: 'federal-agi',
		standardDeduction: { single: 3250, married: 6500, headOfHousehold: 4875 },
		notes: 'First $2,000 exempt from tax.',
	},
	{
		abbreviation: 'HI',
		name: 'Hawaii',
		type: 'graduated',
		brackets: [
			{ limit: 9600, rate: 0.014 },
			{ limit: 14400, rate: 0.032 },
			{ limit: 19200, rate: 0.055 },
			{ limit: 24000, rate: 0.064 },
			{ limit: 36000, rate: 0.068 },
			{ limit: 48000, rate: 0.072 },
			{ limit: 125000, rate: 0.076 },
			{ limit: 175000, rate: 0.079 },
			{ limit: 225000, rate: 0.0825 },
			{ limit: 275000, rate: 0.09 },
			{ limit: 325000, rate: 0.10 },
			{ limit: Infinity, rate: 0.11 },
		],
		bracketsMfj: [
			{ limit: 19200, rate: 0.014 },
			{ limit: 28800, rate: 0.032 },
			{ limit: 38400, rate: 0.055 },
			{ limit: 48000, rate: 0.064 },
			{ limit: 72000, rate: 0.068 },
			{ limit: 96000, rate: 0.072 },
			{ limit: 250000, rate: 0.076 },
			{ limit: 350000, rate: 0.079 },
			{ limit: 450000, rate: 0.0825 },
			{ limit: 550000, rate: 0.09 },
			{ limit: 650000, rate: 0.10 },
			{ limit: Infinity, rate: 0.11 },
		],
		startingPoint: 'federal-agi',
		standardDeduction: { single: 4400, married: 8800, headOfHousehold: 6600 },
		personalExemption: { single: 1144, married: 2288, dependent: 1144 },
	},
	{
		abbreviation: 'KS',
		name: 'Kansas',
		type: 'graduated',
		brackets: [
			{ limit: 23000, rate: 0.052 },
			{ limit: Infinity, rate: 0.0558 },
		],
		bracketsMfj: [
			{ limit: 46000, rate: 0.052 },
			{ limit: Infinity, rate: 0.0558 },
		],
		startingPoint: 'federal-agi',
		standardDeduction: { single: 3605, married: 8240, headOfHousehold: 5925 },
		personalExemption: { single: 9160, married: 18320, dependent: 2320 },
	},
	{
		abbreviation: 'ME',
		name: 'Maine',
		type: 'graduated',
		brackets: [
			{ limit: 27399, rate: 0.058 },
			{ limit: 64849, rate: 0.0675 },
			{ limit: Infinity, rate: 0.0715 },
		],
		bracketsMfj: [
			{ limit: 54849, rate: 0.058 },
			{ limit: 129749, rate: 0.0675 },
			{ limit: Infinity, rate: 0.0715 },
		],
		startingPoint: 'federal-agi',
		standardDeduction: { single: 8350, married: 16700, headOfHousehold: 12550 },
		personalExemption: { single: 5300, married: 10600, dependent: 0 },
		notes: 'Personal exemption phases out for high earners. Dependent credit of $305/$610 instead of exemption.',
	},
	{
		abbreviation: 'MD',
		name: 'Maryland',
		type: 'graduated',
		brackets: [
			{ limit: 1000, rate: 0.02 },
			{ limit: 2000, rate: 0.03 },
			{ limit: 3000, rate: 0.04 },
			{ limit: 100000, rate: 0.0475 },
			{ limit: 125000, rate: 0.05 },
			{ limit: 150000, rate: 0.0525 },
			{ limit: 250000, rate: 0.055 },
			{ limit: 500000, rate: 0.0575 },
			{ limit: 1_000_000, rate: 0.0625 },
			{ limit: Infinity, rate: 0.065 },
		],
		bracketsMfj: [
			{ limit: 1000, rate: 0.02 },
			{ limit: 2000, rate: 0.03 },
			{ limit: 3000, rate: 0.04 },
			{ limit: 150000, rate: 0.0475 },
			{ limit: 175000, rate: 0.05 },
			{ limit: 225000, rate: 0.0525 },
			{ limit: 300000, rate: 0.055 },
			{ limit: 600000, rate: 0.0575 },
			{ limit: 1_200_000, rate: 0.0625 },
			{ limit: Infinity, rate: 0.065 },
		],
		startingPoint: 'federal-agi',
		standardDeduction: { single: 3350, married: 6700, headOfHousehold: 5025 },
		personalExemption: { single: 3200, married: 6400, dependent: 3200 },
		notes: 'Exemption phases out at higher incomes. Additional 2% surtax on capital gains over $350K. Local taxes also apply in MD.',
	},
	{
		abbreviation: 'MN',
		name: 'Minnesota',
		type: 'graduated',
		brackets: [
			{ limit: 33310, rate: 0.0535 },
			{ limit: 109430, rate: 0.068 },
			{ limit: 203150, rate: 0.0785 },
			{ limit: Infinity, rate: 0.0985 },
		],
		bracketsMfj: [
			{ limit: 48700, rate: 0.0535 },
			{ limit: 193480, rate: 0.068 },
			{ limit: 337930, rate: 0.0785 },
			{ limit: Infinity, rate: 0.0985 },
		],
		startingPoint: 'federal-agi',
		standardDeduction: { single: 15300, married: 30600, headOfHousehold: 22950 },
		notes: 'Standard deduction phases out for high earners. 1% surtax on net investment income over $1M.',
	},
	{
		abbreviation: 'MO',
		name: 'Missouri',
		type: 'graduated',
		brackets: [
			{ limit: 1348, rate: 0.02 },
			{ limit: 2696, rate: 0.025 },
			{ limit: 4044, rate: 0.03 },
			{ limit: 5392, rate: 0.035 },
			{ limit: 6740, rate: 0.04 },
			{ limit: 8088, rate: 0.045 },
			{ limit: Infinity, rate: 0.047 },
		],
		bracketsMfj: [
			{ limit: 2696, rate: 0.02 },
			{ limit: 5392, rate: 0.025 },
			{ limit: 8088, rate: 0.03 },
			{ limit: 10784, rate: 0.035 },
			{ limit: 13480, rate: 0.04 },
			{ limit: 16176, rate: 0.045 },
			{ limit: Infinity, rate: 0.047 },
		],
		startingPoint: 'federal-agi',
		standardDeduction: { single: 16100, married: 32200, headOfHousehold: 24150 },
		notes: 'Exempts capital gains from income tax.',
	},
	{
		abbreviation: 'MT',
		name: 'Montana',
		type: 'graduated',
		brackets: [
			{ limit: 47500, rate: 0.047 },
			{ limit: Infinity, rate: 0.0565 },
		],
		bracketsMfj: [
			{ limit: 95000, rate: 0.047 },
			{ limit: Infinity, rate: 0.0565 },
		],
		startingPoint: 'federal-taxable',
		standardDeduction: { single: 16100, married: 32200, headOfHousehold: 24150 },
		notes: 'Top rate reduced from 5.9% to 5.65% in 2026. Further reduction to 5.4% scheduled for 2027.',
	},
	{
		abbreviation: 'NE',
		name: 'Nebraska',
		type: 'graduated',
		brackets: [
			{ limit: 4130, rate: 0.0246 },
			{ limit: 24760, rate: 0.0351 },
			{ limit: Infinity, rate: 0.0455 },
		],
		bracketsMfj: [
			{ limit: 8250, rate: 0.0246 },
			{ limit: 49530, rate: 0.0351 },
			{ limit: Infinity, rate: 0.0455 },
		],
		startingPoint: 'federal-agi',
		standardDeduction: { single: 8850, married: 17700, headOfHousehold: 13275 },
		notes: 'Top rate reduced from 5.2% to 4.55% in 2026. Scheduled to reach 3.99% by 2027.',
	},
	{
		abbreviation: 'NJ',
		name: 'New Jersey',
		type: 'graduated',
		brackets: [
			{ limit: 20000, rate: 0.014 },
			{ limit: 35000, rate: 0.0175 },
			{ limit: 40000, rate: 0.035 },
			{ limit: 75000, rate: 0.0553 },
			{ limit: 500000, rate: 0.0637 },
			{ limit: 1_000_000, rate: 0.0897 },
			{ limit: Infinity, rate: 0.1075 },
		],
		bracketsMfj: [
			{ limit: 20000, rate: 0.014 },
			{ limit: 50000, rate: 0.0175 },
			{ limit: 70000, rate: 0.0245 },
			{ limit: 80000, rate: 0.035 },
			{ limit: 150000, rate: 0.0553 },
			{ limit: 500000, rate: 0.0637 },
			{ limit: 1_000_000, rate: 0.0897 },
			{ limit: Infinity, rate: 0.1075 },
		],
		startingPoint: 'state-defined',
		standardDeduction: { single: 0, married: 0, headOfHousehold: 0 },
		personalExemption: { single: 1000, married: 2000, dependent: 1500 },
	},
	{
		abbreviation: 'NM',
		name: 'New Mexico',
		type: 'graduated',
		brackets: [
			{ limit: 5500, rate: 0.015 },
			{ limit: 16500, rate: 0.032 },
			{ limit: 33500, rate: 0.043 },
			{ limit: 66500, rate: 0.047 },
			{ limit: 210000, rate: 0.049 },
			{ limit: Infinity, rate: 0.059 },
		],
		bracketsMfj: [
			{ limit: 8000, rate: 0.015 },
			{ limit: 25000, rate: 0.032 },
			{ limit: 50000, rate: 0.043 },
			{ limit: 100000, rate: 0.047 },
			{ limit: 315000, rate: 0.049 },
			{ limit: Infinity, rate: 0.059 },
		],
		startingPoint: 'federal-taxable',
		standardDeduction: { single: 16100, married: 32200, headOfHousehold: 24150 },
		notes: 'Offers $4,000 deduction for dependents in lieu of suspended personal exemption.',
	},
	{
		abbreviation: 'NY',
		name: 'New York',
		type: 'graduated',
		brackets: [
			{ limit: 8500, rate: 0.039 },
			{ limit: 11700, rate: 0.044 },
			{ limit: 13900, rate: 0.0515 },
			{ limit: 80650, rate: 0.054 },
			{ limit: 215400, rate: 0.059 },
			{ limit: 1_077_550, rate: 0.0685 },
			{ limit: 5_000_000, rate: 0.0965 },
			{ limit: 25_000_000, rate: 0.103 },
			{ limit: Infinity, rate: 0.109 },
		],
		bracketsMfj: [
			{ limit: 17150, rate: 0.039 },
			{ limit: 23600, rate: 0.044 },
			{ limit: 27900, rate: 0.0515 },
			{ limit: 161550, rate: 0.054 },
			{ limit: 323200, rate: 0.059 },
			{ limit: 2_155_350, rate: 0.0685 },
			{ limit: 5_000_000, rate: 0.0965 },
			{ limit: 25_000_000, rate: 0.103 },
			{ limit: Infinity, rate: 0.109 },
		],
		startingPoint: 'federal-agi',
		standardDeduction: { single: 8000, married: 16050, headOfHousehold: 11200 },
		notes: 'Has tax benefit recapture. Local NYC tax of up to 3.876% applies to NYC residents.',
	},
	{
		abbreviation: 'ND',
		name: 'North Dakota',
		type: 'graduated',
		brackets: [
			{ limit: 48475, rate: 0.0195 },
			{ limit: Infinity, rate: 0.025 },
		],
		bracketsMfj: [
			{ limit: 80975, rate: 0.0195 },
			{ limit: Infinity, rate: 0.025 },
		],
		startingPoint: 'federal-taxable',
		standardDeduction: { single: 16100, married: 32200, headOfHousehold: 24150 },
	},
	{
		abbreviation: 'OK',
		name: 'Oklahoma',
		type: 'graduated',
		brackets: [
			{ limit: 3750, rate: 0.0 },
			{ limit: 4900, rate: 0.025 },
			{ limit: 7200, rate: 0.035 },
			{ limit: Infinity, rate: 0.045 },
		],
		bracketsMfj: [
			{ limit: 7500, rate: 0.0 },
			{ limit: 9800, rate: 0.025 },
			{ limit: 14400, rate: 0.035 },
			{ limit: Infinity, rate: 0.045 },
		],
		startingPoint: 'federal-agi',
		standardDeduction: { single: 6350, married: 12700, headOfHousehold: 9525 },
		personalExemption: { single: 1000, married: 2000, dependent: 1000 },
		notes: 'Top rate reduced from 4.75% to 4.5% in 2026. Trigger mechanism for further reductions.',
	},
	{
		abbreviation: 'OR',
		name: 'Oregon',
		type: 'graduated',
		brackets: [
			{ limit: 4550, rate: 0.0475 },
			{ limit: 11400, rate: 0.0675 },
			{ limit: 125000, rate: 0.0875 },
			{ limit: Infinity, rate: 0.099 },
		],
		bracketsMfj: [
			{ limit: 9100, rate: 0.0475 },
			{ limit: 22800, rate: 0.0675 },
			{ limit: 250000, rate: 0.0875 },
			{ limit: Infinity, rate: 0.099 },
		],
		startingPoint: 'federal-agi',
		standardDeduction: { single: 2910, married: 5820, headOfHousehold: 4365 },
		notes: 'Top brackets not fully indexed for inflation.',
	},
	{
		abbreviation: 'RI',
		name: 'Rhode Island',
		type: 'graduated',
		brackets: [
			{ limit: 82050, rate: 0.0375 },
			{ limit: 186450, rate: 0.0475 },
			{ limit: Infinity, rate: 0.0599 },
		],
		bracketsMfj: [
			{ limit: 82050, rate: 0.0375 },
			{ limit: 186450, rate: 0.0475 },
			{ limit: Infinity, rate: 0.0599 },
		],
		startingPoint: 'federal-agi',
		standardDeduction: { single: 11200, married: 22400, headOfHousehold: 16800 },
		personalExemption: { single: 5250, married: 10500, dependent: 5250 },
		notes: 'Standard deduction, personal exemption phase out above $261K AGI.',
	},
	{
		abbreviation: 'SC',
		name: 'South Carolina',
		type: 'graduated',
		brackets: [
			{ limit: 3640, rate: 0.0 },
			{ limit: 18230, rate: 0.03 },
			{ limit: Infinity, rate: 0.06 },
		],
		bracketsMfj: [
			{ limit: 3640, rate: 0.0 },
			{ limit: 18230, rate: 0.03 },
			{ limit: Infinity, rate: 0.06 },
		],
		startingPoint: 'federal-taxable',
		standardDeduction: { single: 8350, married: 16700, headOfHousehold: 12550 },
		notes: 'Top rate temporarily reduced to 6% through June 30, 2026, then reverts to 6.2%.',
	},
	{
		abbreviation: 'VT',
		name: 'Vermont',
		type: 'graduated',
		brackets: [
			{ limit: 49400, rate: 0.0335 },
			{ limit: 119700, rate: 0.066 },
			{ limit: 249700, rate: 0.076 },
			{ limit: Infinity, rate: 0.0875 },
		],
		bracketsMfj: [
			{ limit: 82500, rate: 0.0335 },
			{ limit: 199450, rate: 0.066 },
			{ limit: 304000, rate: 0.076 },
			{ limit: Infinity, rate: 0.0875 },
		],
		startingPoint: 'federal-agi',
		standardDeduction: { single: 7650, married: 15300, headOfHousehold: 11475 },
		personalExemption: { single: 5300, married: 10600, dependent: 5300 },
		notes: 'Taxpayers with AGI over $150K pay the greater of income tax or 3% of federal AGI.',
	},
	{
		abbreviation: 'VA',
		name: 'Virginia',
		type: 'graduated',
		brackets: [
			{ limit: 3000, rate: 0.02 },
			{ limit: 5000, rate: 0.03 },
			{ limit: 17000, rate: 0.05 },
			{ limit: Infinity, rate: 0.0575 },
		],
		bracketsMfj: [
			{ limit: 3000, rate: 0.02 },
			{ limit: 5000, rate: 0.03 },
			{ limit: 17000, rate: 0.05 },
			{ limit: Infinity, rate: 0.0575 },
		],
		startingPoint: 'federal-agi',
		standardDeduction: { single: 8750, married: 17500, headOfHousehold: 13125 },
		personalExemption: { single: 930, married: 1860, dependent: 930 },
	},
	{
		abbreviation: 'WV',
		name: 'West Virginia',
		type: 'graduated',
		brackets: [
			{ limit: 10000, rate: 0.0222 },
			{ limit: 25000, rate: 0.0296 },
			{ limit: 40000, rate: 0.0333 },
			{ limit: 60000, rate: 0.0444 },
			{ limit: Infinity, rate: 0.0482 },
		],
		bracketsMfj: [
			{ limit: 10000, rate: 0.0222 },
			{ limit: 25000, rate: 0.0296 },
			{ limit: 40000, rate: 0.0333 },
			{ limit: 60000, rate: 0.0444 },
			{ limit: Infinity, rate: 0.0482 },
		],
		startingPoint: 'federal-agi',
		standardDeduction: { single: 0, married: 0, headOfHousehold: 0 },
		personalExemption: { single: 2000, married: 4000, dependent: 2000 },
	},
	{
		abbreviation: 'WI',
		name: 'Wisconsin',
		type: 'graduated',
		brackets: [
			{ limit: 15110, rate: 0.035 },
			{ limit: 51950, rate: 0.044 },
			{ limit: 332720, rate: 0.053 },
			{ limit: Infinity, rate: 0.0765 },
		],
		bracketsMfj: [
			{ limit: 20150, rate: 0.035 },
			{ limit: 69260, rate: 0.044 },
			{ limit: 443630, rate: 0.053 },
			{ limit: Infinity, rate: 0.0765 },
		],
		startingPoint: 'federal-agi',
		standardDeduction: { single: 13960, married: 25840, headOfHousehold: 19900 },
		personalExemption: { single: 700, married: 1400, dependent: 700 },
		notes: 'Standard deduction phases out at higher incomes.',
	},
	{
		abbreviation: 'DC',
		name: 'District of Columbia',
		type: 'graduated',
		brackets: [
			{ limit: 10000, rate: 0.04 },
			{ limit: 40000, rate: 0.06 },
			{ limit: 60000, rate: 0.065 },
			{ limit: 250000, rate: 0.085 },
			{ limit: 500000, rate: 0.0925 },
			{ limit: 1_000_000, rate: 0.0975 },
			{ limit: Infinity, rate: 0.1075 },
		],
		bracketsMfj: [
			{ limit: 10000, rate: 0.04 },
			{ limit: 40000, rate: 0.06 },
			{ limit: 60000, rate: 0.065 },
			{ limit: 250000, rate: 0.085 },
			{ limit: 500000, rate: 0.0925 },
			{ limit: 1_000_000, rate: 0.0975 },
			{ limit: Infinity, rate: 0.1075 },
		],
		startingPoint: 'federal-agi',
		standardDeduction: { single: 16100, married: 32200, headOfHousehold: 24150 },
	},
];

// ─── Combined List ────────────────────────────────────────────────────────────

export const STATE_TAX_CONFIGS: StateTaxConfig[] = [
	...NO_TAX_STATES,
	...FLAT_TAX_STATES,
	...GRADUATED_TAX_STATES,
].sort((a, b) => a.name.localeCompare(b.name));

// ─── Lookup ───────────────────────────────────────────────────────────────────

export function getStateConfig(abbreviation: string): StateTaxConfig | undefined {
	return STATE_TAX_CONFIGS.find((s) => s.abbreviation === abbreviation);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Compute state-specific standard deduction for a given filing status */
export function getStateStandardDeduction(
	config: StateTaxConfig,
	status: FilingStatus
): number {
	if (!config.standardDeduction) return 0;
	switch (status) {
		case 'single':
			return config.standardDeduction.single;
		case 'married-joint':
			return config.standardDeduction.married;
		case 'head-of-household':
			return config.standardDeduction.headOfHousehold;
	}
}

/** Compute state-specific personal exemption for a given filing status */
export function getStatePersonalExemption(
	config: StateTaxConfig,
	status: FilingStatus
): number {
	if (!config.personalExemption) return 0;
	switch (status) {
		case 'single':
			return config.personalExemption.single;
		case 'married-joint':
			return config.personalExemption.married;
		case 'head-of-household':
			return config.personalExemption.single; // HOH uses single exemption amount typically
	}
}

/** Compute state taxable income (starting point for state tax) */
export function getStateTaxableIncome(
	config: StateTaxConfig,
	federalAgi: number,
	federalTaxableIncome: number
): number {
	switch (config.startingPoint) {
		case 'federal-agi':
			return federalAgi;
		case 'federal-taxable':
			return federalTaxableIncome;
		case 'state-defined':
			// For states with their own definitions, we approximate using federal AGI
			return federalAgi;
	}
}

/**
 * Calculate state income tax for a given taxable income and filing status.
 * Returns the total state tax due for the year.
 */
export function calculateStateTax(
	config: StateTaxConfig,
	taxableIncome: number,
	status: FilingStatus
): number {
	if (config.type === 'none') return 0;

	// For Ohio: 2.75% flat on income over $26,050
	if (config.abbreviation === 'OH') {
		return Math.max(0, taxableIncome - 26050) * 0.0275;
	}

	// For Mississippi: 0% on first $10K, then 4%
	if (config.abbreviation === 'MS') {
		if (taxableIncome <= 10000) return 0;
		return (taxableIncome - 10000) * 0.04;
	}

	// Flat rate
	if (config.type === 'flat' && config.flatRate !== undefined) {
		return taxableIncome * config.flatRate;
	}

	// Graduated / mixed
	const brackets =
		status === 'married-joint' && config.bracketsMfj
			? config.bracketsMfj
			: config.brackets;

	if (!brackets || brackets.length === 0) {
		// Fallback to flat rate
		return config.flatRate ? taxableIncome * config.flatRate : 0;
	}

	return calculateGraduatedTax(taxableIncome, brackets);
}

function calculateGraduatedTax(income: number, brackets: StateBracket[]): number {
	let tax = 0;
	let remaining = income;
	let prevLimit = 0;

	for (const bracket of brackets) {
		if (remaining <= 0) break;
		const bracketAmount = Math.min(remaining, bracket.limit - prevLimit);
		if (bracketAmount > 0) {
			tax += bracketAmount * bracket.rate;
		}
		remaining -= bracketAmount;
		prevLimit = bracket.limit;
	}

	return tax;
}

// ─── Reciprocal Tax Agreements ──────────────────────────────────────────────
//
// These agreements allow residents of one state to work in another state
// and only pay income tax to their home state (not the work state).
// The key rule: if the WORK state has a reciprocal agreement with the HOME state,
// then you pay tax to your HOME state and are exempt from the WORK state's tax.
//
// Map: work state abbreviation → array of reciprocal home state abbreviations
// Source: https://onpay.com/insights/employers-guide-to-state-tax-reciprocity-agreements/

export const RECIPROCAL_AGREEMENTS: Record<string, string[]> = {
	'AZ': ['CA', 'IN', 'OR', 'VA'],
	'DC': ['*'], // DC has reciprocity with ALL states for non-residents
	'IL': ['IA', 'KY', 'MI', 'WI'],
	'IN': ['KY', 'MI', 'OH', 'PA', 'WI'],
	'IA': ['IL'],
	'KY': ['IL', 'IN', 'MI', 'WV', 'VA'],
	'MD': ['DC', 'PA', 'VA', 'WV'],
	'MI': ['IL', 'IN', 'KY', 'MN', 'OH', 'WI'],
	'MN': ['MI', 'ND'],
	'MT': ['ND'],
	'NJ': ['PA'],
	'ND': ['MN', 'MT'],
	'OH': ['IN', 'KY', 'MI', 'PA', 'WV'],
	'PA': ['IN', 'MD', 'NJ', 'OH', 'VA', 'WV'],
	'VA': ['DC', 'KY', 'MD', 'PA', 'WV'],
	'WV': ['KY', 'MD', 'OH', 'PA', 'VA'],
	'WI': ['IL', 'IN', 'KY', 'MI'],
};

/**
 * Determine whether a reciprocal agreement exists between a work state and home state.
 * If the work state has reciprocity with the home state, the worker pays tax only
 * to their home state (i.e., work state does not withhold).
 */
export function hasReciprocalAgreement(workState: string, homeState: string): boolean {
	const agreements = RECIPROCAL_AGREEMENTS[workState];
	if (!agreements) return false;
	// '*' means the work state has reciprocity with all states (e.g. DC)
	return agreements.includes('*') || agreements.includes(homeState);
}

/**
 * Given a home state and work state, return which state's tax rules should apply.
 * If they're the same, it's straightforward. If they differ and a reciprocal agreement
 * exists (work is reciprocal with home), use the home state. Otherwise, use the work state.
 */
export function getEffectiveTaxState(homeState: string, workState: string): string {
	if (homeState === workState) return homeState;
	// If work state has a reciprocal agreement with home state, pay home state tax
	if (hasReciprocalAgreement(workState, homeState)) {
		return homeState;
	}
	// Otherwise, pay tax to the work state (and home state typically offers a credit)
	return workState;
}

/**
 * Get human-readable information about reciprocity for display purposes.
 */
export function getReciprocityInfo(homeState: string, workState: string): {
	affected: boolean;
	taxState: string;
	message: string;
} {
	if (homeState === workState) {
		return {
			affected: false,
			taxState: homeState,
			message: '',
		};
	}

	if (hasReciprocalAgreement(workState, homeState)) {
		return {
			affected: true,
			taxState: homeState,
			message: `Reciprocal agreement: ${homeState} residents working in ${workState} pay only ${homeState} state income tax. No withholding for ${workState}.`,
		};
	}

	return {
		affected: true,
		taxState: workState,
		message: `No reciprocal agreement between ${homeState} and ${workState}. You'll pay ${workState} state income tax. You may be eligible for a tax credit in ${homeState} to avoid double taxation.`,
	};
}

// ─── Formatted list for UI ────────────────────────────────────────────────────

export const STATE_TAX_OPTIONS: Array<{ value: string; label: string }> =
	STATE_TAX_CONFIGS.map((s) => ({
		value: s.abbreviation,
		label: `${s.name} (${s.abbreviation})${s.type === 'none' ? ' — No Income Tax' : ''}`,
	}));
