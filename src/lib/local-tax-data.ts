/**
 * 2026 Local / City Income Tax Data
 *
 * Sources:
 * - NY: Eshel CPA / NYC Dept of Finance (NYC resident tax)
 * - MD: National Finance Center (MD county taxes)
 * - OH: RITA / CCA Ohio / individual city ordinances
 * - PA: City of Philadelphia / PA DCED / Keystone Research
 * - IN: Indiana Dept of Revenue (county taxes)
 * - MO: Kansas City / St. Louis earnings tax ordinances
 * - MI: Michigan Dept of Treasury (city taxes)
 * - KY: Kentucky Revenue Cabinet (occupational license taxes)
 * - AL: individual city ordinances
 * - OR: Portland / Multnomah County / TriMet
 * - CO: individual city OPT ordinances
 */

import type { FilingStatus } from './tax-calculator';

export type LocalTaxType = 'flat' | 'graduated' | 'head-tax';

export interface LocalBracket {
	limit: number;
	rate: number;
}

export interface LocalTaxJurisdiction {
	/** Unique ID (used in selectors) */
	id: string;
	/** Parent state abbreviation */
	state: string;
	/** Display name, e.g. "New York City" or "Montgomery County" */
	name: string;
	/** Longer description for tooltips */
	description?: string;
	type: LocalTaxType;
	flatRate?: number;
	/** Brackets for single filers */
	brackets?: LocalBracket[];
	/** Brackets for married-filing-jointly */
	bracketsMfj?: LocalBracket[];
	/** Brackets for head of household */
	bracketsHoh?: LocalBracket[];
	/** Whether the tax applies only to residents of the jurisdiction */
	residentsOnly: boolean;
	/** If defined, the taxable base is the state's taxable income, not federal */
	basedOnStateTaxable?: boolean;
	/** Special notes */
	notes?: string;
}

// ─── NEW YORK CITY ────────────────────────────────────────────────────────────

const NYC_JURISDICTION: LocalTaxJurisdiction = {
	id: 'nyc',
	state: 'NY',
	name: 'New York City',
	description: 'NYC resident personal income tax on NY taxable income',
	type: 'graduated',
	residentsOnly: true,
	basedOnStateTaxable: true,
	brackets: [
		{ limit: 12_000, rate: 0.03078 },
		{ limit: 25_000, rate: 0.03762 },
		{ limit: 50_000, rate: 0.03819 },
		{ limit: Infinity, rate: 0.03876 },
	],
	bracketsMfj: [
		{ limit: 21_600, rate: 0.03078 },
		{ limit: 45_000, rate: 0.03762 },
		{ limit: 90_000, rate: 0.03819 },
		{ limit: Infinity, rate: 0.03876 },
	],
	bracketsHoh: [
		{ limit: 14_400, rate: 0.03078 },
		{ limit: 30_000, rate: 0.03762 },
		{ limit: 60_000, rate: 0.03819 },
		{ limit: Infinity, rate: 0.03876 },
	],
	notes: 'Applied to NY state taxable income. Non-residents who work in NYC do not pay this tax.',
};

// ─── MARYLAND COUNTIES ────────────────────────────────────────────────────────

const MD_COUNTIES: LocalTaxJurisdiction[] = [
	{ id: 'md-allegany', state: 'MD', name: 'Allegany County', type: 'flat', flatRate: 0.032, residentsOnly: true },
	{ id: 'md-anne-arundel', state: 'MD', name: 'Anne Arundel County', type: 'graduated', residentsOnly: true,
		brackets: [
			{ limit: 50_000, rate: 0.027 },
			{ limit: 400_000, rate: 0.0294 },
			{ limit: Infinity, rate: 0.032 },
		],
		bracketsMfj: [
			{ limit: 75_000, rate: 0.027 },
			{ limit: 480_000, rate: 0.0294 },
			{ limit: Infinity, rate: 0.032 },
		],
		notes: 'Graduated rates based on annual taxable wages.',
	},
	{ id: 'md-baltimore-city', state: 'MD', name: 'Baltimore City', type: 'flat', flatRate: 0.032, residentsOnly: true },
	{ id: 'md-baltimore-county', state: 'MD', name: 'Baltimore County', type: 'flat', flatRate: 0.032, residentsOnly: true },
	{ id: 'md-calvert', state: 'MD', name: 'Calvert County', type: 'flat', flatRate: 0.032, residentsOnly: true },
	{ id: 'md-caroline', state: 'MD', name: 'Caroline County', type: 'flat', flatRate: 0.032, residentsOnly: true },
	{ id: 'md-carroll', state: 'MD', name: 'Carroll County', type: 'flat', flatRate: 0.0303, residentsOnly: true },
	{ id: 'md-cecil', state: 'MD', name: 'Cecil County', type: 'flat', flatRate: 0.0274, residentsOnly: true },
	{ id: 'md-charles', state: 'MD', name: 'Charles County', type: 'flat', flatRate: 0.0303, residentsOnly: true },
	{ id: 'md-dorchester', state: 'MD', name: 'Dorchester County', type: 'flat', flatRate: 0.033, residentsOnly: true },
	{ id: 'md-frederick', state: 'MD', name: 'Frederick County', type: 'graduated', residentsOnly: true,
		brackets: [
			{ limit: 25_000, rate: 0.0225 },
			{ limit: 50_000, rate: 0.0275 },
			{ limit: 150_000, rate: 0.0296 },
			{ limit: Infinity, rate: 0.032 },
		],
		bracketsMfj: [
			{ limit: 25_000, rate: 0.0225 },
			{ limit: 100_000, rate: 0.0275 },
			{ limit: 250_000, rate: 0.0296 },
			{ limit: Infinity, rate: 0.032 },
		],
		notes: 'Graduated rates based on annual taxable wages.',
	},
	{ id: 'md-garrett', state: 'MD', name: 'Garrett County', type: 'flat', flatRate: 0.0265, residentsOnly: true },
	{ id: 'md-harford', state: 'MD', name: 'Harford County', type: 'flat', flatRate: 0.0306, residentsOnly: true },
	{ id: 'md-howard', state: 'MD', name: 'Howard County', type: 'flat', flatRate: 0.032, residentsOnly: true },
	{ id: 'md-kent', state: 'MD', name: 'Kent County', type: 'flat', flatRate: 0.033, residentsOnly: true },
	{ id: 'md-montgomery', state: 'MD', name: 'Montgomery County', type: 'flat', flatRate: 0.032, residentsOnly: true },
	{ id: 'md-prince-georges', state: 'MD', name: "Prince George's County", type: 'flat', flatRate: 0.032, residentsOnly: true },
	{ id: 'md-queen-annes', state: 'MD', name: "Queen Anne's County", type: 'flat', flatRate: 0.032, residentsOnly: true },
	{ id: 'md-st-marys', state: 'MD', name: "St. Mary's County", type: 'flat', flatRate: 0.032, residentsOnly: true },
	{ id: 'md-somerset', state: 'MD', name: 'Somerset County', type: 'flat', flatRate: 0.032, residentsOnly: true },
	{ id: 'md-talbot', state: 'MD', name: 'Talbot County', type: 'flat', flatRate: 0.024, residentsOnly: true },
	{ id: 'md-washington', state: 'MD', name: 'Washington County', type: 'flat', flatRate: 0.0295, residentsOnly: true },
	{ id: 'md-wicomico', state: 'MD', name: 'Wicomico County', type: 'flat', flatRate: 0.032, residentsOnly: true },
	{ id: 'md-worcester', state: 'MD', name: 'Worcester County', type: 'flat', flatRate: 0.0225, residentsOnly: true },
];

// ─── OHIO CITIES ──────────────────────────────────────────────────────────────

const OH_CITIES: LocalTaxJurisdiction[] = [
	{ id: 'oh-akron', state: 'OH', name: 'Akron', type: 'flat', flatRate: 0.025, residentsOnly: true, notes: 'Non-residents also pay 0.25%' },
	{ id: 'oh-cincinnati', state: 'OH', name: 'Cincinnati', type: 'flat', flatRate: 0.018, residentsOnly: true },
	{ id: 'oh-cleveland', state: 'OH', name: 'Cleveland', type: 'flat', flatRate: 0.025, residentsOnly: true, notes: 'Non-residents pay 2.0% on income earned in Cleveland' },
	{ id: 'oh-columbus', state: 'OH', name: 'Columbus', type: 'flat', flatRate: 0.025, residentsOnly: true },
	{ id: 'oh-dayton', state: 'OH', name: 'Dayton', type: 'flat', flatRate: 0.025, residentsOnly: true },
	{ id: 'oh-toledo', state: 'OH', name: 'Toledo', type: 'flat', flatRate: 0.0225, residentsOnly: true },
	{ id: 'oh-canton', state: 'OH', name: 'Canton', type: 'flat', flatRate: 0.02, residentsOnly: true },
	{ id: 'oh-youngstown', state: 'OH', name: 'Youngstown', type: 'flat', flatRate: 0.0225, residentsOnly: true },
	{ id: 'oh-columbiana', state: 'OH', name: 'Columbiana', type: 'flat', flatRate: 0.015, residentsOnly: true },
	{ id: 'oh-cuyahoga-falls', state: 'OH', name: 'Cuyahoga Falls', type: 'flat', flatRate: 0.02, residentsOnly: true },
	{ id: 'oh-euclid', state: 'OH', name: 'Euclid', type: 'flat', flatRate: 0.025, residentsOnly: true },
	{ id: 'oh-hamilton', state: 'OH', name: 'Hamilton', type: 'flat', flatRate: 0.023, residentsOnly: true },
	{ id: 'oh-keating', state: 'OH', name: 'Kettering', type: 'flat', flatRate: 0.025, residentsOnly: true },
	{ id: 'oh-lakewood', state: 'OH', name: 'Lakewood', type: 'flat', flatRate: 0.02, residentsOnly: true },
	{ id: 'oh-lima', state: 'OH', name: 'Lima', type: 'flat', flatRate: 0.02, residentsOnly: true },
	{ id: 'oh-lorain', state: 'OH', name: 'Lorain', type: 'flat', flatRate: 0.02, residentsOnly: true },
	{ id: 'oh-mansfield', state: 'OH', name: 'Mansfield', type: 'flat', flatRate: 0.015, residentsOnly: true },
	{ id: 'oh-middletown', state: 'OH', name: 'Middletown', type: 'flat', flatRate: 0.02, residentsOnly: true },
	{ id: 'oh-newark', state: 'OH', name: 'Newark', type: 'flat', flatRate: 0.0225, residentsOnly: true },
	{ id: 'oh-parma', state: 'OH', name: 'Parma', type: 'flat', flatRate: 0.02, residentsOnly: true },
	{ id: 'oh-springfield', state: 'OH', name: 'Springfield', type: 'flat', flatRate: 0.0225, residentsOnly: true },
	{ id: 'oh-warren', state: 'OH', name: 'Warren', type: 'flat', flatRate: 0.02, residentsOnly: true },
];

// ─── PENNSYLVANIA LOCALITIES ─────────────────────────────────────────────────

const PA_LOCALITIES: LocalTaxJurisdiction[] = [
	{
		id: 'pa-philadelphia', state: 'PA', name: 'Philadelphia', type: 'flat', flatRate: 0.03735, residentsOnly: false,
		notes: '3.735% for residents. Non-residents working in Philly pay 3.425%. We use the resident rate.',
	},
	{
		id: 'pa-pittsburgh', state: 'PA', name: 'Pittsburgh', type: 'flat', flatRate: 0.03, residentsOnly: true,
		notes: 'Combined 3% (1% City EIT + 2% School District EIT). Applies to residents.',
	},
	{
		id: 'pa-allentown', state: 'PA', name: 'Allentown', type: 'flat', flatRate: 0.02, residentsOnly: true,
		notes: 'Combined city and school district EIT.',
	},
	{
		id: 'pa-erie', state: 'PA', name: 'Erie', type: 'flat', flatRate: 0.021, residentsOnly: true,
		notes: 'Combined city and school district EIT.',
	},
	{
		id: 'pa-reading', state: 'PA', name: 'Reading', type: 'flat', flatRate: 0.02, residentsOnly: true,
	},
	{
		id: 'pa-scranton', state: 'PA', name: 'Scranton', type: 'flat', flatRate: 0.024, residentsOnly: true,
	},
	{
		id: 'pa-bethlehem', state: 'PA', name: 'Bethlehem', type: 'flat', flatRate: 0.02, residentsOnly: true,
	},
	{
		id: 'pa-lancaster', state: 'PA', name: 'Lancaster', type: 'flat', flatRate: 0.01, residentsOnly: true,
		notes: '1% resident EIT. School district may impose additional rate.',
	},
	{
		id: 'pa-harrisburg', state: 'PA', name: 'Harrisburg', type: 'flat', flatRate: 0.02, residentsOnly: true,
	},
	{
		id: 'pa-york', state: 'PA', name: 'York', type: 'flat', flatRate: 0.0175, residentsOnly: true,
	},
];

// ─── INDIANA COUNTIES (selected major) ────────────────────────────────────────
// All 92 IN counties levy a local income tax. We include major counties.
// Rates are for residents.

const IN_COUNTIES: LocalTaxJurisdiction[] = [
	{ id: 'in-marion', state: 'IN', name: 'Marion County (Indianapolis)', type: 'flat', flatRate: 0.0268, residentsOnly: true },
	{ id: 'in-lake', state: 'IN', name: 'Lake County (Gary/Hammond)', type: 'flat', flatRate: 0.03, residentsOnly: true },
	{ id: 'in-allen', state: 'IN', name: 'Allen County (Fort Wayne)', type: 'flat', flatRate: 0.0235, residentsOnly: true },
	{ id: 'in-hamilton', state: 'IN', name: 'Hamilton County (Carmel/Noblesville)', type: 'flat', flatRate: 0.0118, residentsOnly: true },
	{ id: 'in-st-joseph', state: 'IN', name: 'St. Joseph County (South Bend)', type: 'flat', flatRate: 0.0258, residentsOnly: true },
	{ id: 'in-tippecanoe', state: 'IN', name: 'Tippecanoe County (Lafayette)', type: 'flat', flatRate: 0.0268, residentsOnly: true },
	{ id: 'in-vanderburgh', state: 'IN', name: 'Vanderburgh County (Evansville)', type: 'flat', flatRate: 0.02, residentsOnly: true },
	{ id: 'in-elkhart', state: 'IN', name: 'Elkhart County', type: 'flat', flatRate: 0.025, residentsOnly: true },
	{ id: 'in-monroe', state: 'IN', name: 'Monroe County (Bloomington)', type: 'flat', flatRate: 0.0161, residentsOnly: true },
	{ id: 'in-delaware', state: 'IN', name: 'Delaware County (Muncie)', type: 'flat', flatRate: 0.025, residentsOnly: true },
];

// ─── MISSOURI EARNINGS TAX CITIES ─────────────────────────────────────────────

const MO_CITIES: LocalTaxJurisdiction[] = [
	{
		id: 'mo-kansas-city', state: 'MO', name: 'Kansas City', type: 'flat', flatRate: 0.01, residentsOnly: false,
		notes: '1% earnings tax. Residents pay on all earned income; non-residents pay on income earned in KC.',
	},
	{
		id: 'mo-st-louis', state: 'MO', name: 'St. Louis', type: 'flat', flatRate: 0.01, residentsOnly: false,
		notes: '1% earnings tax. Residents pay on all earned income; non-residents pay on income earned in St. Louis.',
	},
];

// ─── MICHIGAN CITIES ──────────────────────────────────────────────────────────

const MI_CITIES: LocalTaxJurisdiction[] = [
	{
		id: 'mi-detroit', state: 'MI', name: 'Detroit', type: 'flat', flatRate: 0.024, residentsOnly: false,
		notes: 'Residents 2.4%, non-residents 1.2%. Using resident rate.',
	},
	{
		id: 'mi-flint', state: 'MI', name: 'Flint', type: 'flat', flatRate: 0.01, residentsOnly: false,
		notes: 'Residents 1%, non-residents 0.5%.',
	},
	{
		id: 'mi-grand-rapids', state: 'MI', name: 'Grand Rapids', type: 'flat', flatRate: 0.015, residentsOnly: false,
		notes: 'Residents 1.5%, non-residents 0.75%.',
	},
	{
		id: 'mi-lansing', state: 'MI', name: 'Lansing', type: 'flat', flatRate: 0.01, residentsOnly: false,
		notes: 'Residents 1%, non-residents 0.5%.',
	},
	{
		id: 'mi-saginaw', state: 'MI', name: 'Saginaw', type: 'flat', flatRate: 0.015, residentsOnly: false,
		notes: 'Residents 1.5%, non-residents 0.75%.',
	},
	{
		id: 'mi-battle-creek', state: 'MI', name: 'Battle Creek', type: 'flat', flatRate: 0.01, residentsOnly: false,
		notes: 'Residents 1%, non-residents 0.5%.',
	},
];

// ─── KENTUCKY CITIES (Occupational License Taxes) ────────────────────────────

const KY_CITIES: LocalTaxJurisdiction[] = [
	{ id: 'ky-louisville', state: 'KY', name: 'Louisville Metro', type: 'flat', flatRate: 0.015, residentsOnly: false, notes: 'Jefferson County occupational tax.' },
	{ id: 'ky-lexington', state: 'KY', name: 'Lexington-Fayette', type: 'flat', flatRate: 0.0225, residentsOnly: false, notes: 'Fayette County occupational license fee.' },
	{ id: 'ky-covington', state: 'KY', name: 'Covington', type: 'flat', flatRate: 0.025, residentsOnly: false },
	{ id: 'ky-owensboro', state: 'KY', name: 'Owensboro', type: 'flat', flatRate: 0.012, residentsOnly: false },
	{ id: 'ky-bowling-green', state: 'KY', name: 'Bowling Green', type: 'flat', flatRate: 0.0135, residentsOnly: false },
];

// ─── ALABAMA CITIES (Occupational Taxes) ──────────────────────────────────────

const AL_CITIES: LocalTaxJurisdiction[] = [
	{ id: 'al-birmingham', state: 'AL', name: 'Birmingham', type: 'flat', flatRate: 0.01, residentsOnly: false, notes: '1% occupational tax. Typically applies to employees working in the city.' },
];

// ─── OREGON LOCAL TAXES ───────────────────────────────────────────────────────

const OR_LOCAL: LocalTaxJurisdiction[] = [
	{
		id: 'or-portland-metro', state: 'OR', name: 'Portland Metro Transit (TriMet)', type: 'flat', flatRate: 0.008237, residentsOnly: false,
		notes: 'TriMet transit payroll tax of 0.8237%. Applies to employers, often passed through. Portland Metro area.',
	},
];

// ─── COMBINED LIST ────────────────────────────────────────────────────────────

export const LOCAL_TAX_JURISDICTIONS: LocalTaxJurisdiction[] = [
	NYC_JURISDICTION,
	...MD_COUNTIES,
	...OH_CITIES,
	...PA_LOCALITIES,
	...IN_COUNTIES,
	...MO_CITIES,
	...MI_CITIES,
	...KY_CITIES,
	...AL_CITIES,
	...OR_LOCAL,
];

// ─── Lookups ──────────────────────────────────────────────────────────────────

export function getLocalJurisdiction(id: string): LocalTaxJurisdiction | undefined {
	return LOCAL_TAX_JURISDICTIONS.find((j) => j.id === id);
}

export function getLocalJurisdictionsForState(stateAbbr: string): LocalTaxJurisdiction[] {
	return LOCAL_TAX_JURISDICTIONS.filter((j) => j.state === stateAbbr);
}

/** Format a jurisdiction's rate(s) into a human-readable string */
export function formatRate(jurisdiction: LocalTaxJurisdiction): string {
	if (jurisdiction.type === 'flat' && jurisdiction.flatRate !== undefined) {
		return `${(jurisdiction.flatRate * 100).toFixed(2)}%`;
	}
	if (jurisdiction.type === 'graduated') {
		const maxRate = Math.max(...(jurisdiction.brackets ?? []).map((b) => b.rate));
		const minRate = Math.min(...(jurisdiction.brackets ?? []).map((b) => b.rate));
		if (minRate === maxRate) {
			return `${(minRate * 100).toFixed(2)}%`;
		}
		return `${(minRate * 100).toFixed(2)}%–${(maxRate * 100).toFixed(2)}%`;
	}
	if (jurisdiction.type === 'head-tax') {
		return 'Fixed annual fee';
	}
	return '';
}

export function getLocalTaxOptions(stateAbbr: string): Array<{ value: string; label: string }> {
	const jurisdictions = getLocalJurisdictionsForState(stateAbbr);
	if (jurisdictions.length === 0) return [];
	return [
		{ value: '', label: 'None' },
		...jurisdictions.map((j) => ({
			value: j.id,
			label: `${j.name} — ${formatRate(j)}`,
		})),
	];
}

/**
 * Calculate local income tax for a given jurisdiction.
 *
 * @param jurisdiction - The local tax jurisdiction
 * @param taxableIncome - The annual taxable income (federal taxable or state, depending on jurisdiction)
 * @param status - Filing status
 * @returns Annual local tax amount
 */
export function calculateLocalTax(
	jurisdiction: LocalTaxJurisdiction,
	taxableIncome: number,
	status: FilingStatus
): number {
	if (jurisdiction.type === 'head-tax') {
		// Head taxes are flat annual fees, not income-based
		return 0;
	}

	if (jurisdiction.type === 'flat' && jurisdiction.flatRate !== undefined) {
		return taxableIncome * jurisdiction.flatRate;
	}

	if (jurisdiction.type === 'graduated') {
		let brackets: LocalBracket[];

		if (status === 'married-joint' && jurisdiction.bracketsMfj) {
			brackets = jurisdiction.bracketsMfj;
		} else if (status === 'head-of-household' && jurisdiction.bracketsHoh) {
			brackets = jurisdiction.bracketsHoh;
		} else if (jurisdiction.brackets) {
			brackets = jurisdiction.brackets;
		} else {
			return 0;
		}

		let tax = 0;
		let remaining = taxableIncome;
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

	return 0;
}
