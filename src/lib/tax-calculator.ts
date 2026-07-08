/**
 * 2026 US Payroll Tax Calculator
 *
 * Federal income tax brackets, Social Security, Medicare, and state income tax
 * calculations based on 2026 IRS and state tax parameters.
 */

import {
	getStateConfig,
	getStateStandardDeduction,
	getStatePersonalExemption,
	getStateTaxableIncome,
	calculateStateTax,
	getEffectiveTaxState,
	getReciprocityInfo,
	hasReciprocalAgreement,
} from './state-tax-data';
import {
	getLocalJurisdiction,
	calculateLocalTax,
} from './local-tax-data';

export type FilingStatus = 'single' | 'married-joint' | 'head-of-household';

export type PayFrequency = 'weekly' | 'biweekly' | 'semi-monthly' | 'monthly';	export interface CalculatorInput {
	hourlyWage: number;
	hoursPerPeriod: number;
	payFrequency: PayFrequency;
	filingStatus: FilingStatus;
	/** Home state (state of residence) */
	homeState: string;
	/** Work state (state where job is located) */
	workState: string;
	localJurisdiction: string; // local tax jurisdiction ID, empty string for none
	additionalPretaxDeductions: number; // per period (e.g., 401k, HSA, etc.)
	additionalPosttaxDeductions: number; // per period (e.g., charitable, garnishments)
	yearToDateWages: number; // YTD wages for accurate SS/Medicare threshold tracking
}	export interface CalculatorResult {
	/** Gross amounts */
	grossPayPerPeriod: number;
	grossPayMonthly: number;
	grossPayYearly: number;

	/** Pay period deductions */
	federalIncomeTaxPerPeriod: number;
	stateIncomeTaxPerPeriod: number;
	localIncomeTaxPerPeriod: number;
	socialSecurityTaxPerPeriod: number;
	medicareTaxPerPeriod: number;
	additionalMedicareTaxPerPeriod: number;
	totalDeductionsPerPeriod: number;
	netPayPerPeriod: number;

	/** Annual projections */
	federalIncomeTaxYearly: number;
	stateIncomeTaxYearly: number;
	localIncomeTaxYearly: number;
	socialSecurityTaxYearly: number;
	medicareTaxYearly: number;
	additionalMedicareTaxYearly: number;
	totalDeductionsYearly: number;
	netPayYearly: number;

	/** Breakdown percentages */
	effectiveTaxRate: number;
	marginalTaxRate: number;

	/** State info */
	stateName: string;
	stateAbbreviation: string;
	homeState: string;
	workState: string;
	effectiveTaxState: string;
	reciprocityActive: boolean;
	reciprocityNote: string;

	/** Local tax info */
	localJurisdictionName: string;
}

// ─── 2026 Tax Parameters ──────────────────────────────────────────────────────

const STANDARD_DEDUCTION: Record<FilingStatus, number> = {
	single: 12400,
	'married-joint': 24800,
	'head-of-household': 17700,
};

/** [bracketTop, rate] – brackets are cumulative; bracketTop is the upper limit of the bracket. */
const TAX_BRACKETS: Record<FilingStatus, Array<{ limit: number; rate: number }>> = {
	single: [
		{ limit: 12400, rate: 0.10 },
		{ limit: 50400, rate: 0.12 },
		{ limit: 105700, rate: 0.22 },
		{ limit: 201775, rate: 0.24 },
		{ limit: 256225, rate: 0.32 },
		{ limit: 640600, rate: 0.35 },
		{ limit: Infinity, rate: 0.37 },
	],
	'married-joint': [
		{ limit: 24800, rate: 0.10 },
		{ limit: 100800, rate: 0.12 },
		{ limit: 211400, rate: 0.22 },
		{ limit: 403550, rate: 0.24 },
		{ limit: 512450, rate: 0.32 },
		{ limit: 768700, rate: 0.35 },
		{ limit: Infinity, rate: 0.37 },
	],
	'head-of-household': [
		{ limit: 17700, rate: 0.10 },
		{ limit: 67450, rate: 0.12 },
		{ limit: 105700, rate: 0.22 },
		{ limit: 201775, rate: 0.24 },
		{ limit: 256200, rate: 0.32 },
		{ limit: 640600, rate: 0.35 },
		{ limit: Infinity, rate: 0.37 },
	],
};

/** Social Security (OASDI) */
const SOCIAL_SECURITY_RATE = 0.062; // 6.2% employee share
const SOCIAL_SECURITY_WAGE_BASE = 184_500; // 2026 cap

/** Medicare (HI) */
const MEDICARE_RATE = 0.0145; // 1.45% employee share

/** Additional Medicare Tax */
const ADDITIONAL_MEDICARE_RATE = 0.009; // 0.9%
const ADDITIONAL_MEDICARE_THRESHOLD: Record<FilingStatus, number> = {
	single: 200_000,
	'married-joint': 250_000,
	'head-of-household': 200_000,
};

// ─── Period multipliers ───────────────────────────────────────────────────────

function periodsPerYear(freq: PayFrequency): number {
	switch (freq) {
		case 'weekly': return 52;
		case 'biweekly': return 26;
		case 'semi-monthly': return 24;
		case 'monthly': return 12;
	}
}

// ─── Calculator ───────────────────────────────────────────────────────────────

export function calculateTax(input: CalculatorInput): CalculatorResult {
	const periods = periodsPerYear(input.payFrequency);

	// Gross pay
	const grossPerPeriod = input.hourlyWage * input.hoursPerPeriod;
	const grossYearly = grossPerPeriod * periods;
	const grossMonthly = grossYearly / 12;

	// Taxable income (after pre-tax deductions)
	const pretaxPerPeriod = input.additionalPretaxDeductions;
	const taxablePerPeriod = Math.max(0, grossPerPeriod - pretaxPerPeriod);
	const taxableYearly = taxablePerPeriod * periods;

	// ── Federal Income Tax ──────────────────────────────────────────────────
	const standardDeduction = STANDARD_DEDUCTION[input.filingStatus];
	const taxableIncome = Math.max(0, taxableYearly - standardDeduction);

	let federalTaxYearly = 0;
	let marginalRate = 0.10;
	let remaining = taxableIncome;
	const brackets = TAX_BRACKETS[input.filingStatus];
	let prevLimit = 0;

	for (const bracket of brackets) {
		if (remaining <= 0) break;
		const bracketAmount = Math.min(remaining, bracket.limit - prevLimit);
		if (bracketAmount > 0) {
			federalTaxYearly += bracketAmount * bracket.rate;
			marginalRate = bracket.rate;
		}
		remaining -= bracketAmount;
		prevLimit = bracket.limit;
	}

	const federalTaxPerPeriod = federalTaxYearly / periods;

	// ── Social Security Tax ─────────────────────────────────────────────────
	// SS tax applies only on wages up to the wage base, reduced by YTD wages
	const ssWagesRemaining = Math.max(0, SOCIAL_SECURITY_WAGE_BASE - input.yearToDateWages);
	const ssTaxableThisYear = Math.min(grossYearly, ssWagesRemaining);
	const socialSecurityTaxYearly = ssTaxableThisYear * SOCIAL_SECURITY_RATE;
	const socialSecurityTaxPerPeriod = socialSecurityTaxYearly / periods;

	// ── Medicare Tax ───────────────────────────────────────────────────────
	// Medicare applies to all wages (no cap)
	const medicareTaxYearly = grossYearly * MEDICARE_RATE;
	const medicareTaxPerPeriod = medicareTaxYearly / periods;

	// ── Additional Medicare Tax ────────────────────────────────────────────
	// 0.9% on wages over the threshold (reduced by YTD wages already over threshold)
	const medicareThreshold = ADDITIONAL_MEDICARE_THRESHOLD[input.filingStatus];
	const remainingThreshold = Math.max(0, medicareThreshold - input.yearToDateWages);
	const subjectToAdditional = Math.max(0, grossYearly - remainingThreshold);
	const additionalMedicareTaxYearly = subjectToAdditional * ADDITIONAL_MEDICARE_RATE;
	const additionalMedicareTaxPerPeriod = additionalMedicareTaxYearly / periods;

	// ── State Income Tax (with Reciprocal Agreement support) ──────────────
	// Determine which state's tax actually applies
	const effectiveTaxStateAbbr = getEffectiveTaxState(input.homeState, input.workState);
	const reciprocityInfo = getReciprocityInfo(input.homeState, input.workState);

	const stateConfig = getStateConfig(effectiveTaxStateAbbr);
	let stateName = effectiveTaxStateAbbr;
	let stateAbbreviation = effectiveTaxStateAbbr;
	let stateTaxYearly = 0;
	let stateTaxPerPeriod = 0;

	// We'll need state taxable income for local tax calculations that are based on it
	let stateTaxableIncomeForLocal = 0;

	// Use home state config for display purposes (what the user selected)
	const homeStateConfig = getStateConfig(input.homeState);

	if (stateConfig && stateConfig.type !== 'none') {
		stateName = stateConfig.name;
		stateAbbreviation = stateConfig.abbreviation;

		// Determine state taxable income starting point
		const stateStartingIncome = getStateTaxableIncome(stateConfig, grossYearly, taxableYearly);

		// Apply state standard deduction and personal exemption
		const stateStdDeduction = getStateStandardDeduction(stateConfig, input.filingStatus);
		const statePersonalExemption = getStatePersonalExemption(stateConfig, input.filingStatus);

		stateTaxableIncomeForLocal = Math.max(0, stateStartingIncome - stateStdDeduction - statePersonalExemption);

		stateTaxYearly = calculateStateTax(stateConfig, stateTaxableIncomeForLocal, input.filingStatus);
		stateTaxPerPeriod = stateTaxYearly / periods;
	} else if (stateConfig && stateConfig.type === 'none') {
		stateName = stateConfig.name;
		stateAbbreviation = stateConfig.abbreviation;
	}

	// ── Local Income Tax ────────────────────────────────────────────────────
	let localJurisdiction = getLocalJurisdiction(input.localJurisdiction);
	// Defensive: ignore jurisdiction if its state doesn't match the work state
	// (local taxes are typically based on where you work or live - we use the effective tax state)
	if (localJurisdiction && localJurisdiction.state !== effectiveTaxStateAbbr) {
		localJurisdiction = undefined;
	}
	let localTaxYearly = 0;
	let localTaxPerPeriod = 0;
	let localJurisdictionName = '';

	if (localJurisdiction) {
		localJurisdictionName = localJurisdiction.name;

		// Determine the taxable base for local tax
		// NYC tax is based on NY state taxable income
		// Most other local taxes are based on gross wages (federal AGI equivalent)
		let localTaxableBase: number;
		if (localJurisdiction.basedOnStateTaxable) {
			localTaxableBase = stateTaxableIncomeForLocal;
		} else {
			// Most local taxes are on gross wages/earnings
			localTaxableBase = grossYearly;
		}

		localTaxYearly = calculateLocalTax(localJurisdiction, localTaxableBase, input.filingStatus);
		localTaxPerPeriod = localTaxYearly / periods;
	}

	// ── Summary ────────────────────────────────────────────────────────────
	const totalDeductionsPerPeriod =
		federalTaxPerPeriod +
		stateTaxPerPeriod +
		localTaxPerPeriod +
		socialSecurityTaxPerPeriod +
		medicareTaxPerPeriod +
		additionalMedicareTaxPerPeriod +
		input.additionalPosttaxDeductions;

	const totalDeductionsYearly = totalDeductionsPerPeriod * periods;

	const netPayPerPeriod = grossPerPeriod - totalDeductionsPerPeriod - pretaxPerPeriod;
	const netPayYearly = grossYearly - totalDeductionsYearly - (pretaxPerPeriod * periods);

	const effectiveTaxRate = grossYearly > 0 ? totalDeductionsYearly / grossYearly : 0;

	const homeStateConfigNice = getStateConfig(input.homeState);
	const workStateConfigNice = getStateConfig(input.workState);

	return {
		grossPayPerPeriod: round(grossPerPeriod),
		grossPayMonthly: round(grossMonthly),
		grossPayYearly: round(grossYearly),

		federalIncomeTaxPerPeriod: round(federalTaxPerPeriod),
		stateIncomeTaxPerPeriod: round(stateTaxPerPeriod),
		localIncomeTaxPerPeriod: round(localTaxPerPeriod),
		socialSecurityTaxPerPeriod: round(socialSecurityTaxPerPeriod),
		medicareTaxPerPeriod: round(medicareTaxPerPeriod),
		additionalMedicareTaxPerPeriod: round(additionalMedicareTaxPerPeriod),
		totalDeductionsPerPeriod: round(totalDeductionsPerPeriod),
		netPayPerPeriod: round(netPayPerPeriod),

		federalIncomeTaxYearly: round(federalTaxYearly),
		stateIncomeTaxYearly: round(stateTaxYearly),
		localIncomeTaxYearly: round(localTaxYearly),
		socialSecurityTaxYearly: round(socialSecurityTaxYearly),
		medicareTaxYearly: round(medicareTaxYearly),
		additionalMedicareTaxYearly: round(additionalMedicareTaxYearly),
		totalDeductionsYearly: round(totalDeductionsYearly),
		netPayYearly: round(netPayYearly),

		effectiveTaxRate: round(effectiveTaxRate * 100),
		marginalTaxRate: round(marginalRate * 100),

		stateName,
		stateAbbreviation,
		homeState: homeStateConfigNice?.name ?? input.homeState,
		workState: workStateConfigNice?.name ?? input.workState,
		effectiveTaxState: stateName,
		reciprocityActive: reciprocityInfo.affected && reciprocityInfo.taxState === input.homeState,
		reciprocityNote: reciprocityInfo.message,
		localJurisdictionName,
	};
}

function round(n: number): number {
	return Math.round(n * 100) / 100;
}

// ─── Pre-defined helpers ──────────────────────────────────────────────────────

export const PAY_FREQUENCIES: Array<{ value: PayFrequency; label: string }> = [
	{ value: 'weekly', label: 'Weekly (52/year)' },
	{ value: 'biweekly', label: 'Bi-Weekly (26/year)' },
	{ value: 'semi-monthly', label: 'Semi-Monthly (24/year)' },
	{ value: 'monthly', label: 'Monthly (12/year)' },
];

export const FILING_STATUSES: Array<{ value: FilingStatus; label: string }> = [
	{ value: 'single', label: 'Single' },
	{ value: 'married-joint', label: 'Married Filing Jointly' },
	{ value: 'head-of-household', label: 'Head of Household' },
];
