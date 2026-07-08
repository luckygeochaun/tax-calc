<script lang="ts">
	import {
		calculateTax,
		PAY_FREQUENCIES,
		FILING_STATUSES,
		type PayFrequency,
		type FilingStatus,
		type CalculatorResult,
	} from '$lib/tax-calculator';
	import { STATE_TAX_OPTIONS, getReciprocityInfo } from '$lib/state-tax-data';
	import { getLocalTaxOptions, getLocalJurisdiction, formatRate } from '$lib/local-tax-data';

	let hourlyWage = $state(30);
	let hoursPerPeriod = $state(40);
	let payFrequency = $state<PayFrequency>('weekly');
	let filingStatus = $state<FilingStatus>('single');
	let selectedHomeState = $state('CA');
	let selectedWorkState = $state('CA');
	let selectedLocalJurisdiction = $state('');
	let localTaxOptions = $derived(getLocalTaxOptions(selectedWorkState));
	let selectedLocalJurisdictionInfo = $derived.by(() => {
		if (!selectedLocalJurisdiction) return null;
		return getLocalJurisdiction(selectedLocalJurisdiction);
	});
	let reciprocityInfo = $derived.by(() => {
		if (selectedHomeState === selectedWorkState) return null;
		return getReciprocityInfo(selectedHomeState, selectedWorkState);
	});
	let additionalPretax = $state(0);
	let additionalPosttax = $state(0);
	let yearToDateWages = $state(0);
	let showResults = $state(false);	let result = $derived.by(() => {
		if (!showResults) return null;
		return calculateTax({
												hourlyWage: hourlyWage || 0,
												hoursPerPeriod: hoursPerPeriod || 0,
												payFrequency,
												filingStatus,
												homeState: selectedHomeState,
												workState: selectedWorkState,
												localJurisdiction: selectedLocalJurisdiction,
												additionalPretaxDeductions: additionalPretax || 0,
												additionalPosttaxDeductions: additionalPosttax || 0,
												yearToDateWages: yearToDateWages || 0,
											});
	});

	function handleCalculate(e: Event) {
		e.preventDefault();
		showResults = true;
	}

	function formatCurrency(n: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(n);
	}

	function formatPercent(n: number): string {
		return n.toFixed(1) + '%';
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
	<!-- Header -->
	<header class="bg-white border-b border-slate-200 shadow-sm">
		<div class="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
			<div class="flex items-center gap-3">
				<div class="flex-shrink-0 w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
					<svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<div>
					<h1 class="text-2xl font-bold text-slate-900">Payroll Tax Calculator</h1>
					<p class="text-sm text-slate-500">Estimate your take-home pay after 2026 federal & state taxes</p>
				</div>
			</div>
		</div>
	</header>

	<main class="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
		<form onsubmit={handleCalculate}>
			<!-- Input Section -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
				<!-- Earnings Card -->
				<div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 transition-all hover:shadow-md">
					<h2 class="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2">
						<svg class="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
						</svg>
						Earnings
					</h2>

					<div class="space-y-4">
						<div>
							<label for="hourlyWage" class="block text-sm font-medium text-slate-700 mb-1.5">
								Hourly Wage
							</label>
							<div class="relative">
								<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<span class="text-slate-500 sm:text-sm">$</span>
								</div>
								<input
									id="hourlyWage"
									type="number"
									min="0"											step="0.01"
											bind:value={hourlyWage}
											oninput={() => (showResults = false)}
											class="block w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm"
											placeholder="0.00"
										/>
							</div>
						</div>

						<div>
							<label for="hoursPerPeriod" class="block text-sm font-medium text-slate-700 mb-1.5">
								Hours per Pay Period
							</label>
							<input
								id="hoursPerPeriod"
								type="number"
								min="0"
								step="0.5"
								bind:value={hoursPerPeriod}
								oninput={() => (showResults = false)}
								class="block w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm"
								placeholder="0"
							/>
						</div>

						<div>
							<label for="payFrequency" class="block text-sm font-medium text-slate-700 mb-1.5">
								Pay Frequency
							</label>
							<select
								id="payFrequency"
								bind:value={payFrequency}
								onchange={() => (showResults = false)}
								class="block w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm"
							>
								{#each PAY_FREQUENCIES as freq}
									<option value={freq.value}>{freq.label}</option>
								{/each}
							</select>
						</div>

						<div>
							<label for="yearToDateWages" class="block text-sm font-medium text-slate-700 mb-1.5">
								Year-to-Date Wages <span class="text-slate-400 font-normal">(for accurate SS & Medicare caps)</span>
							</label>
							<div class="relative">
								<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<span class="text-slate-500 sm:text-sm">$</span>
								</div>
								<input
									id="yearToDateWages"
									type="number"
									min="0"
									step="100"
									bind:value={yearToDateWages}
									oninput={() => (showResults = false)}
									class="block w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm"
									placeholder="0"
								/>
							</div>								<p class="mt-1 text-xs text-slate-400">
									Social Security caps at $184,500/year and Additional Medicare kicks in at $200,000 ($250,000 MFJ)
								</p>
						</div>

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<label for="homeState" class="block text-sm font-medium text-slate-700 mb-1.5">
									Home State <span class="text-slate-400 font-normal">(residence)</span>
								</label>
								<select
									id="homeState"
									bind:value={selectedHomeState}
									onchange={() => {
										showResults = false;
										selectedLocalJurisdiction = '';
									}}
									class="block w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm"
								>
									{#each STATE_TAX_OPTIONS as st}
										<option value={st.value}>{st.label}</option>
									{/each}
								</select>
								<p class="mt-1 text-xs text-slate-400">
									Where you live
								</p>
							</div>
							<div>
								<label for="workState" class="block text-sm font-medium text-slate-700 mb-1.5">
									Work State <span class="text-slate-400 font-normal">(job location)</span>
								</label>
								<select
									id="workState"
									bind:value={selectedWorkState}
									onchange={() => {
										showResults = false;
										selectedLocalJurisdiction = '';
									}}
									class="block w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm"
								>
									{#each STATE_TAX_OPTIONS as st}
										<option value={st.value}>{st.label}</option>
									{/each}
								</select>
								<p class="mt-1 text-xs text-slate-400">
									Where you physically work
								</p>
							</div>
						</div>

						{#if reciprocityInfo}
							<div class="p-3 rounded-xl {reciprocityInfo.affected && reciprocityInfo.taxState === selectedHomeState ? 'bg-blue-50 border border-blue-200' : 'bg-amber-50 border border-amber-200'} text-xs mt-3">
								<div class="flex items-start gap-2">
									<svg class="w-4 h-4 shrink-0 mt-0.5 {reciprocityInfo.affected && reciprocityInfo.taxState === selectedHomeState ? 'text-blue-500' : 'text-amber-500'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										{#if reciprocityInfo.affected && reciprocityInfo.taxState === selectedHomeState}
											<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
										{:else}
											<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
										{/if}
									</svg>
									<div>
										<p class="font-medium {reciprocityInfo.affected && reciprocityInfo.taxState === selectedHomeState ? 'text-blue-700' : 'text-amber-700'}">
											{reciprocityInfo.affected && reciprocityInfo.taxState === selectedHomeState
												? 'Reciprocal Agreement Active'
												: 'No Reciprocal Agreement'}
										</p>
										<p class="mt-1 {reciprocityInfo.affected && reciprocityInfo.taxState === selectedHomeState ? 'text-blue-600' : 'text-amber-600'}">
											{reciprocityInfo.message}
										</p>
									</div>
								</div>
							</div>
						{/if}

						{#if localTaxOptions.length > 1}
							<div>
								<label for="localJurisdiction" class="block text-sm font-medium text-slate-700 mb-1.5">
									Local / City Tax Jurisdiction <span class="text-slate-400 font-normal">(based on work state)</span>
								</label>
								<select
									id="localJurisdiction"
									bind:value={selectedLocalJurisdiction}
									onchange={() => (showResults = false)}
									class="block w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm"
								>
									{#each localTaxOptions as opt}
										<option value={opt.value}>{opt.label}</option>
									{/each}
								</select>

								{#if selectedLocalJurisdictionInfo}
									<div class="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
										<div class="flex items-center gap-2">
											<svg class="w-3.5 h-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
											<span class="text-slate-600 font-medium">
												Tax rate: {formatRate(selectedLocalJurisdictionInfo)}
											</span>
										</div>
										{#if selectedLocalJurisdictionInfo.description}
											<p class="text-slate-500">{selectedLocalJurisdictionInfo.description}</p>
										{/if}
										{#if selectedLocalJurisdictionInfo.notes}
											<p class="text-slate-400 italic">{selectedLocalJurisdictionInfo.notes}</p>
										{/if}
									</div>
								{/if}

								<p class="mt-2 text-xs text-slate-400">
									Select your locality to include local/city income tax in the calculation.
								</p>
							</div>
						{/if}
					</div>
				</div>

				<!-- Filing & Deductions Card -->
				<div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 transition-all hover:shadow-md">
					<h2 class="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2">
						<svg class="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
						Filing Status & Deductions
					</h2>

					<div class="space-y-4">
						<div>
							<label for="filingStatus" class="block text-sm font-medium text-slate-700 mb-1.5">
								Filing Status
							</label>
							<select
								id="filingStatus"
								bind:value={filingStatus}
								onchange={() => (showResults = false)}
								class="block w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm"
							>
								{#each FILING_STATUSES as status}
									<option value={status.value}>{status.label}</option>
								{/each}
							</select>
						</div>

						<div>
							<label for="additionalPretax" class="block text-sm font-medium text-slate-700 mb-1.5">
								Pre-Tax Deductions <span class="text-slate-400 font-normal">(401k, HSA, FSA, etc.)</span>
							</label>
							<div class="relative">
								<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<span class="text-slate-500 sm:text-sm">$</span>
								</div>
								<input
									id="additionalPretax"
									type="number"
									min="0"
									step="1"
									bind:value={additionalPretax}
									oninput={() => (showResults = false)}
									class="block w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm"
									placeholder="0.00"
								/>
							</div>
							<p class="mt-1 text-xs text-slate-400">
								Entered per pay period. Reduces both taxable income and take-home pay.
							</p>
						</div>

						<div>
							<label for="additionalPosttax" class="block text-sm font-medium text-slate-700 mb-1.5">
								Post-Tax Deductions <span class="text-slate-400 font-normal">(garnishments, Roth, etc.)</span>
							</label>
							<div class="relative">
								<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<span class="text-slate-500 sm:text-sm">$</span>
								</div>
								<input
									id="additionalPosttax"
									type="number"
									min="0"
									step="1"
									bind:value={additionalPosttax}
									oninput={() => (showResults = false)}
									class="block w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm"
									placeholder="0.00"
								/>
							</div>
							<p class="mt-1 text-xs text-slate-400">
								Entered per pay period. Does not reduce taxable income.
							</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Calculate Button -->
			<div class="flex justify-center mb-8">
				<button
					type="submit"
					class="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-600 text-white font-semibold rounded-xl shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all active:scale-[0.98] cursor-pointer"
				>
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
					</svg>
					{showResults ? 'Recalculate' : 'Calculate Take-Home Pay'}
				</button>
			</div>
		</form>

		<!-- Results Section -->
		{#if result}
			<div class="space-y-6 animate-[fadeIn_0.3s_ease-out]">
				<!-- Summary Cards -->
				<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 text-center">
						<p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Gross Pay</p>
						<p class="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(result.grossPayPerPeriod)}</p>
						<p class="text-xs text-slate-400 mt-1">per {payFrequency === 'weekly' ? 'week' : payFrequency === 'biweekly' ? 'two weeks' : payFrequency === 'semi-monthly' ? 'half-month' : 'month'}</p>
					</div>

					<div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 text-center">
						<p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Deductions</p>
						<p class="text-2xl font-bold text-red-600 mt-1">{formatCurrency(result.totalDeductionsPerPeriod)}</p>
						<p class="text-xs text-slate-400 mt-1">{formatPercent(result.effectiveTaxRate)} effective rate</p>
					</div>

					<div class="bg-emerald-50 rounded-2xl shadow-sm border border-emerald-200 p-5 text-center">
						<p class="text-xs font-medium text-emerald-700 uppercase tracking-wide">Net Pay (Take-Home)</p>
						<p class="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(result.netPayPerPeriod)}</p>
						<p class="text-xs text-emerald-600 mt-1">per {payFrequency === 'weekly' ? 'week' : payFrequency === 'biweekly' ? 'two weeks' : payFrequency === 'semi-monthly' ? 'half-month' : 'month'}</p>
					</div>
				</div>

				<!-- Detailed Breakdown -->
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<!-- Pay Period Breakdown -->
					<div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
						<div class="px-6 py-4 bg-slate-50 border-b border-slate-200">
							<h3 class="text-sm font-semibold text-slate-700 uppercase tracking-wide">Per-Paycheck Breakdown</h3>
						</div>
						<div class="p-6">
							<table class="w-full text-sm">
								<thead>
									<tr class="text-left text-xs text-slate-500 uppercase tracking-wide">
										<th class="pb-2 font-medium">Item</th>
										<th class="pb-2 font-medium text-right">Amount</th>
										<th class="pb-2 font-medium text-right">% of Gross</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-slate-100">
									<tr>
										<td class="py-2.5 text-slate-900 font-medium">Gross Pay</td>
										<td class="py-2.5 text-right text-slate-900">{formatCurrency(result.grossPayPerPeriod)}</td>
										<td class="py-2.5 text-right text-slate-500">100%</td>
									</tr>
									<tr class="text-red-700">
										<td class="py-2.5">Federal Income Tax</td>
										<td class="py-2.5 text-right">{formatCurrency(result.federalIncomeTaxPerPeriod)}</td>
										<td class="py-2.5 text-right">{formatPercent(result.grossPayPerPeriod > 0 ? (result.federalIncomeTaxPerPeriod / result.grossPayPerPeriod) * 100 : 0)}</td>
									</tr>
									{#if result.stateIncomeTaxPerPeriod > 0}
										<tr class="text-red-700">
											<td class="py-2.5">{result.stateName} Income Tax</td>
											<td class="py-2.5 text-right">{formatCurrency(result.stateIncomeTaxPerPeriod)}</td>
											<td class="py-2.5 text-right">{formatPercent(result.grossPayPerPeriod > 0 ? (result.stateIncomeTaxPerPeriod / result.grossPayPerPeriod) * 100 : 0)}</td>
										</tr>
									{/if}
									{#if result.localIncomeTaxPerPeriod > 0}
										<tr class="text-red-700">
											<td class="py-2.5">{result.localJurisdictionName} Local Tax</td>
											<td class="py-2.5 text-right">{formatCurrency(result.localIncomeTaxPerPeriod)}</td>
											<td class="py-2.5 text-right">{formatPercent(result.grossPayPerPeriod > 0 ? (result.localIncomeTaxPerPeriod / result.grossPayPerPeriod) * 100 : 0)}</td>
										</tr>
									{/if}
									<tr class="text-red-700">
										<td class="py-2.5">Social Security (6.2%)</td>
										<td class="py-2.5 text-right">{formatCurrency(result.socialSecurityTaxPerPeriod)}</td>
										<td class="py-2.5 text-right">{formatPercent(result.grossPayPerPeriod > 0 ? (result.socialSecurityTaxPerPeriod / result.grossPayPerPeriod) * 100 : 0)}</td>
									</tr>
									<tr class="text-red-700">
										<td class="py-2.5">Medicare (1.45%)</td>
										<td class="py-2.5 text-right">{formatCurrency(result.medicareTaxPerPeriod)}</td>
										<td class="py-2.5 text-right">{formatPercent(result.grossPayPerPeriod > 0 ? (result.medicareTaxPerPeriod / result.grossPayPerPeriod) * 100 : 0)}</td>
									</tr>
									{#if result.additionalMedicareTaxPerPeriod > 0}
										<tr class="text-red-700">
											<td class="py-2.5">Additional Medicare (0.9%)</td>
											<td class="py-2.5 text-right">{formatCurrency(result.additionalMedicareTaxPerPeriod)}</td>
											<td class="py-2.5 text-right">{formatPercent(result.grossPayPerPeriod > 0 ? (result.additionalMedicareTaxPerPeriod / result.grossPayPerPeriod) * 100 : 0)}</td>
										</tr>
									{/if}
									{#if additionalPretax > 0}
										<tr class="text-amber-700">
											<td class="py-2.5">Pre-Tax Deductions</td>
											<td class="py-2.5 text-right">{formatCurrency(additionalPretax)}</td>
											<td class="py-2.5 text-right">{formatPercent(result.grossPayPerPeriod > 0 ? (additionalPretax / result.grossPayPerPeriod) * 100 : 0)}</td>
										</tr>
									{/if}
									{#if additionalPosttax > 0}
										<tr class="text-amber-700">
											<td class="py-2.5">Post-Tax Deductions</td>
											<td class="py-2.5 text-right">{formatCurrency(additionalPosttax)}</td>
											<td class="py-2.5 text-right">{formatPercent(result.grossPayPerPeriod > 0 ? (additionalPosttax / result.grossPayPerPeriod) * 100 : 0)}</td>
										</tr>
									{/if}
									<tr class="font-semibold text-emerald-700">
										<td class="py-2.5 border-t-2 border-slate-200">Net Pay</td>
										<td class="py-2.5 text-right border-t-2 border-slate-200">{formatCurrency(result.netPayPerPeriod)}</td>
										<td class="py-2.5 text-right border-t-2 border-slate-200">{formatPercent(result.grossPayPerPeriod > 0 ? (result.netPayPerPeriod / result.grossPayPerPeriod) * 100 : 0)}</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>

					<!-- Annual Breakdown -->
					<div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
						<div class="px-6 py-4 bg-slate-50 border-b border-slate-200">
							<h3 class="text-sm font-semibold text-slate-700 uppercase tracking-wide">Annual Projection</h3>
						</div>
						<div class="p-6">
							<table class="w-full text-sm">
								<thead>
									<tr class="text-left text-xs text-slate-500 uppercase tracking-wide">
										<th class="pb-2 font-medium">Item</th>
										<th class="pb-2 font-medium text-right">Amount</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-slate-100">
									<tr>
										<td class="py-2.5 text-slate-900 font-medium">Gross Annual Pay</td>
										<td class="py-2.5 text-right text-slate-900">{formatCurrency(result.grossPayYearly)}</td>
									</tr>
									<tr>
										<td class="py-2.5">Monthly Equivalent</td>
										<td class="py-2.5 text-right text-slate-600">{formatCurrency(result.grossPayMonthly)}</td>
									</tr>
									<tr class="text-red-700">
										<td class="py-2.5">Federal Income Tax</td>
										<td class="py-2.5 text-right">{formatCurrency(result.federalIncomeTaxYearly)}</td>
									</tr>
									{#if result.stateIncomeTaxYearly > 0}
										<tr class="text-red-700">
											<td class="py-2.5">{result.stateName} Income Tax</td>
											<td class="py-2.5 text-right">{formatCurrency(result.stateIncomeTaxYearly)}</td>
										</tr>
									{/if}
									{#if result.localIncomeTaxYearly > 0}
										<tr class="text-red-700">
											<td class="py-2.5">{result.localJurisdictionName} Local Tax</td>
											<td class="py-2.5 text-right">{formatCurrency(result.localIncomeTaxYearly)}</td>
										</tr>
									{/if}
									<tr class="text-red-700">
										<td class="py-2.5">Social Security Tax</td>
										<td class="py-2.5 text-right">{formatCurrency(result.socialSecurityTaxYearly)}</td>
									</tr>
									<tr class="text-red-700">
										<td class="py-2.5">Medicare Tax</td>
										<td class="py-2.5 text-right">{formatCurrency(result.medicareTaxYearly)}</td>
									</tr>
									{#if result.additionalMedicareTaxYearly > 0}
										<tr class="text-red-700">
											<td class="py-2.5">Additional Medicare Tax</td>
											<td class="py-2.5 text-right">{formatCurrency(result.additionalMedicareTaxYearly)}</td>
										</tr>
									{/if}
									<tr class="font-semibold text-slate-900 border-t-2 border-slate-200">
										<td class="py-2.5">Total Deductions</td>
										<td class="py-2.5 text-right">{formatCurrency(result.totalDeductionsYearly)}</td>
									</tr>
									<tr class="font-semibold text-emerald-700">
										<td class="py-2.5 border-t-2 border-slate-200">Net Annual Pay</td>
										<td class="py-2.5 text-right border-t-2 border-slate-200">{formatCurrency(result.netPayYearly)}</td>
									</tr>
								</tbody>
							</table>

							<!-- Tax Rate Summary -->
							<div class="mt-5 pt-4 border-t border-slate-200">
								<div class="grid grid-cols-2 gap-4">
									<div class="bg-slate-50 rounded-xl p-3 text-center">
										<p class="text-xs text-slate-500 uppercase tracking-wide">Marginal Rate</p>
										<p class="text-lg font-bold text-slate-900">{formatPercent(result.marginalTaxRate)}</p>
									</div>
									<div class="bg-slate-50 rounded-xl p-3 text-center">
										<p class="text-xs text-slate-500 uppercase tracking-wide">Effective Rate</p>
										<p class="text-lg font-bold text-slate-900">{formatPercent(result.effectiveTaxRate)}</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Tax Bracket Visual -->
				<div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
					<h3 class="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">Tax Bracket Breakdown</h3>
					<div class="space-y-1.5">
						{#each [
							{ rate: 10, color: 'bg-emerald-400' },
							{ rate: 12, color: 'bg-teal-400' },
							{ rate: 22, color: 'bg-amber-400' },
							{ rate: 24, color: 'bg-orange-400' },
							{ rate: 32, color: 'bg-red-400' },
							{ rate: 35, color: 'bg-red-600' },
							{ rate: 37, color: 'bg-red-800' },
						] as bracket}
							{@const bracketLabel = `${bracket.rate}% Bracket`}
							{@const isActive = result.marginalTaxRate >= bracket.rate}
							<div class="flex items-center gap-3">
								<span class="text-xs text-slate-500 w-20 text-right shrink-0">{bracketLabel}</span>
								<div class="flex-1 h-4 rounded-full bg-slate-100 overflow-hidden">
									<div
										class="h-full rounded-full transition-all duration-500 {bracket.color}"
										style="width: {isActive ? 100 : 0}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
					<p class="mt-3 text-xs text-slate-400">
						Your marginal tax rate is {formatPercent(result.marginalTaxRate)}. Only income above each bracket's threshold is taxed at that bracket's rate.
					</p>
				</div>
			</div>
		{/if}

		<!-- Footer / Disclaimer -->
		<footer class="mt-12 text-center text-xs text-slate-400 max-w-2xl mx-auto">
			<p class="leading-relaxed">
				<strong>Disclaimer:</strong> This calculator provides estimates based on 2026 federal, state, and local tax rates and does not constitute professional tax advice.
				State tax calculations use published 2026 rates and brackets from the Tax Foundation. Local tax data covers major jurisdictions (NYC, MD counties, OH cities, PA localities, IN counties, MO cities, MI cities, KY cities, AL cities, OR TriMet).
				The standard deduction and tax brackets are based on 2026 inflation-adjusted values. Consult a qualified tax professional for your specific situation.
			</p>
		</footer>
	</main>
</div>

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
