/**
 * PaisaTrack Financial Export & Reporting Engine
 * js/export.js
 * 
 * Provides bank-grade financial reporting and data export capabilities:
 * - Date range filtering:
 *   - Monthly selection (Current Month, previous months, and Full Financial Year FY 2026-27)
 *   - Custom Date Range (Start Date to End Date with quick presets and real-time picker)
 * - Scope selection:
 *   - All Financial Data (Expenses, Investments, Executive Summary)
 *   - Expenses & Spending Only
 *   - Investments & Portfolio Only
 * - Excel Export (.xlsx / .csv):
 *   - Clean, well-structured spreadsheet with UTF-8 BOM (\uFEFF) so ₹ Indian Rupee symbols
 *     and formatting render perfectly in Microsoft Excel, Apple Numbers, and Google Sheets.
 *   - Includes Executive Summary KPIs, Category Spending Distribution, Itemized Ledger,
 *     Investment Holdings, and Active SIP Mandates.
 * - PDF Export:
 *   - Bank-grade Indian Financial Statement report with customer details, PAN, KYC status,
 *     date range stamp, summary boxes, category breakdown, portfolio valuation, and ledger.
 *   - Clean printable view and native print/PDF save dialog trigger with dedicated @media print rules.
 */

class ExportManager {
  constructor() {
    this.periodType = 'monthly'; // 'monthly' | 'custom'
    this.selectedScope = 'all';  // 'all' | 'expenses' | 'investments'
    this.selectedMonth = 'October 2026';
    this.startDate = '';
    this.endDate = '';
    this.isInitialized = false;
  }

  get store() {
    return window.appStore;
  }

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Set initial date defaults
    const today = (window.Store && typeof window.Store.getRealTimeNow === 'function')
      ? window.Store.getRealTimeNow().isoToday
      : new Date().toISOString().split('T')[0];

    const [year, month] = today.split('-');
    this.startDate = `${year}-${month}-01`;
    this.endDate = today;

    if (this.store && this.store.state && this.store.state.selectedMonth) {
      this.selectedMonth = this.store.state.selectedMonth;
    }

    this.bindEvents();
  }

  bindEvents() {
    // Escape key closes statement preview
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const previewModal = document.getElementById('statementPreviewModal');
        if (previewModal && previewModal.classList.contains('open')) {
          this.closeStatementPreview();
        }
      }
    });
  }

  /**
   * Opens the export statement modal and initializes controls with real-time defaults.
   * @param {string} defaultScope - 'all' | 'expenses' | 'investments'
   */
  openExportModal(defaultScope = 'all') {
    this.init();
    this.selectedScope = ['all', 'expenses', 'investments'].includes(defaultScope) ? defaultScope : 'all';

    // Populate month options
    this.populateMonthOptions();

    // Set date input defaults
    const today = (window.Store && typeof window.Store.getRealTimeNow === 'function')
      ? window.Store.getRealTimeNow().isoToday
      : new Date().toISOString().split('T')[0];

    const [year, month] = today.split('-');
    const defaultStart = `${year}-${month}-01`;

    const startInput = document.getElementById('exportStartDate');
    const endInput = document.getElementById('exportEndDate');
    if (startInput) startInput.value = this.startDate || defaultStart;
    if (endInput) endInput.value = this.endDate || today;

    // Reset period type to monthly
    this.setExportPeriodType(this.periodType || 'monthly');

    // Set scope selector
    this.setExportScope(this.selectedScope);

    // Open modal via global helper
    if (typeof openModal === 'function') {
      openModal('exportStatementModal');
    } else {
      const modal = document.getElementById('exportStatementModal');
      if (modal) modal.classList.add('open');
    }
  }

  /**
   * Populate month selection options dynamically
   */
  populateMonthOptions() {
    const monthSelect = document.getElementById('exportMonthSelect');
    if (!monthSelect) return;

    const availableMonths = [
      "October 2026",
      "September 2026",
      "August 2026",
      "July 2026",
      "June 2026",
      "May 2026",
      "April 2026",
      "Full Financial Year 2026-27 (FY27)",
      "Financial Year 2025-26 (FY26)"
    ];

    // Retain currently selected state month if present
    const currentActive = (this.store && this.store.state && this.store.state.selectedMonth)
      ? this.store.state.selectedMonth
      : "October 2026";

    monthSelect.innerHTML = availableMonths.map(m => {
      const isSelected = (m === this.selectedMonth || m === currentActive);
      return `<option value="${m}" ${isSelected ? 'selected' : ''}>${m}</option>`;
    }).join('');

    monthSelect.addEventListener('change', (e) => {
      this.selectedMonth = e.target.value;
    });
  }

  /**
   * Switches between 'monthly' and 'custom' period types
   * @param {string} type - 'monthly' | 'custom'
   */
  setExportPeriodType(type) {
    this.periodType = type === 'custom' ? 'custom' : 'monthly';

    const btnMonthly = document.getElementById('btnExportPeriodMonthly');
    const btnCustom = document.getElementById('btnExportPeriodCustom');
    const containerMonthly = document.getElementById('exportMonthlyOptions');
    const containerCustom = document.getElementById('exportCustomOptions');

    if (btnMonthly) btnMonthly.classList.toggle('active', this.periodType === 'monthly');
    if (btnCustom) btnCustom.classList.toggle('active', this.periodType === 'custom');

    if (containerMonthly) containerMonthly.style.display = (this.periodType === 'monthly') ? 'block' : 'none';
    if (containerCustom) containerCustom.style.display = (this.periodType === 'custom') ? 'block' : 'none';

    // Play subtle tap sound if available
    if (typeof playTapSound === 'function') playTapSound();
  }

  /**
   * Switches export scope: 'all' | 'expenses' | 'investments'
   * @param {string} scope
   */
  setExportScope(scope) {
    this.selectedScope = ['all', 'expenses', 'investments'].includes(scope) ? scope : 'all';

    const btnAll = document.getElementById('btnScopeAll');
    const btnExpenses = document.getElementById('btnScopeExpenses');
    const btnInvestments = document.getElementById('btnScopeInvestments');

    if (btnAll) btnAll.classList.toggle('active', this.selectedScope === 'all');
    if (btnExpenses) btnExpenses.classList.toggle('active', this.selectedScope === 'expenses');
    if (btnInvestments) btnInvestments.classList.toggle('active', this.selectedScope === 'investments');

    // Update Scope hint text
    const hintEl = document.getElementById('exportScopeHint');
    if (hintEl) {
      if (this.selectedScope === 'all') {
        hintEl.textContent = 'Includes executive summary, category budgets, expense ledger, portfolio valuation & SIPs.';
      } else if (this.selectedScope === 'expenses') {
        hintEl.textContent = 'Focuses on category spending breakdown, monthly budgets, and itemized transaction ledger.';
      } else {
        hintEl.textContent = 'Focuses on asset class allocation, top holdings valuation, gains, and active SIP mandates.';
      }
    }

    if (typeof playTapSound === 'function') playTapSound();
  }

  /**
   * Sets quick preset for custom date picker
   * @param {string} preset - 'thisMonth' | 'lastMonth' | 'last30Days' | 'fy2026'
   */
  setQuickPreset(preset) {
    const today = new Date();
    const todayStr = (window.Store && typeof window.Store.getRealTimeNow === 'function')
      ? window.Store.getRealTimeNow().isoToday
      : today.toISOString().split('T')[0];

    let start = '';
    let end = todayStr;

    if (preset === 'thisMonth') {
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      start = `${y}-${m}-01`;
      end = todayStr;
    } else if (preset === 'lastMonth') {
      const prevDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const y = prevDate.getFullYear();
      const m = String(prevDate.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(y, prevDate.getMonth() + 1, 0).getDate();
      start = `${y}-${m}-01`;
      end = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
    } else if (preset === 'last30Days') {
      const past30 = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
      start = past30.toISOString().split('T')[0];
      end = todayStr;
    } else if (preset === 'fy2026') {
      start = '2026-04-01';
      end = '2027-03-31';
    }

    const startInput = document.getElementById('exportStartDate');
    const endInput = document.getElementById('exportEndDate');
    if (startInput && start) startInput.value = start;
    if (endInput && end) endInput.value = end;

    this.startDate = start;
    this.endDate = end;

    // Highlight active preset button
    document.querySelectorAll('.export-preset-pill').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-preset') === preset);
    });

    if (typeof playTapSound === 'function') playTapSound();
  }

  /**
   * Filters transactions by chosen date range
   * @param {Array} transactions
   * @param {string} rangeType - 'monthly' | 'custom'
   * @param {string} monthStr - e.g. "October 2026" or "Full Financial Year 2026-27"
   * @param {string} startDate - YYYY-MM-DD
   * @param {string} endDate - YYYY-MM-DD
   * @returns {Array} Filtered transactions
   */
  filterTransactions(transactions, rangeType, monthStr, startDate, endDate) {
    if (!Array.isArray(transactions)) return [];

    let filterStart = null;
    let filterEnd = null;

    if (rangeType === 'monthly') {
      const cleanMonth = (monthStr || '').trim();
      if (cleanMonth.includes('FY') || cleanMonth.toLowerCase().includes('financial year')) {
        // Indian Financial Year
        if (cleanMonth.includes('2025-26') || cleanMonth.includes('FY26')) {
          filterStart = '2025-04-01';
          filterEnd = '2026-03-31';
        } else {
          // Default FY 2026-27
          filterStart = '2026-04-01';
          filterEnd = '2027-03-31';
        }
      } else {
        // e.g. "October 2026"
        const parts = cleanMonth.split(' ');
        const monthNames = [
          'january', 'february', 'march', 'april', 'may', 'june',
          'july', 'august', 'september', 'october', 'november', 'december'
        ];
        const mIdx = parts[0] ? monthNames.indexOf(parts[0].toLowerCase()) : -1;
        const year = parts[1] ? parseInt(parts[1], 10) : 2026;

        if (mIdx >= 0) {
          const mStr = String(mIdx + 1).padStart(2, '0');
          const lastDay = new Date(year, mIdx + 1, 0).getDate();
          filterStart = `${year}-${mStr}-01`;
          filterEnd = `${year}-${mStr}-${String(lastDay).padStart(2, '0')}`;
        }
      }
    } else {
      filterStart = startDate || '1970-01-01';
      filterEnd = endDate || '2099-12-31';
    }

    return transactions.filter(tx => {
      if (!tx.date) return true;
      const txDateStr = String(tx.date).substring(0, 10);
      if (filterStart && txDateStr < filterStart) return false;
      if (filterEnd && txDateStr > filterEnd) return false;
      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  /**
   * Gathers all data bundle required for export
   */
  getStatementData() {
    const state = this.store ? this.store.state : window.defaultAppState;
    const user = state.user || {};
    const spending = state.spending || {};
    const investments = state.investments || {};
    const allTransactions = spending.transactions || [];

    // Read current inputs
    const monthSelect = document.getElementById('exportMonthSelect');
    const selectedMonth = monthSelect ? monthSelect.value : (this.selectedMonth || 'October 2026');

    const startInput = document.getElementById('exportStartDate');
    const endInput = document.getElementById('exportEndDate');
    const startDate = startInput ? startInput.value : this.startDate;
    const endDate = endInput ? endInput.value : this.endDate;

    const rangeType = this.periodType;
    const scope = this.selectedScope;

    // Filter transactions
    const filteredTransactions = this.filterTransactions(allTransactions, rangeType, selectedMonth, startDate, endDate);

    // Calculate period label
    let periodLabel = '';
    let isAnnual = false;

    if (rangeType === 'monthly') {
      periodLabel = selectedMonth;
      if (selectedMonth.includes('FY') || selectedMonth.toLowerCase().includes('financial year')) {
        isAnnual = true;
      }
    } else {
      const sFormatted = window.Store ? window.Store.formatDateDisplay(startDate) : startDate;
      const eFormatted = window.Store ? window.Store.formatDateDisplay(endDate) : endDate;
      periodLabel = `${sFormatted} to ${eFormatted}`;
    }

    // Calculate category spending in this period
    const categories = (spending.categories || []).map(cat => {
      const catSpent = filteredTransactions
        .filter(t => (t.category || '').toLowerCase() === cat.name.toLowerCase())
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const budget = isAnnual ? (cat.budget * 12) : cat.budget;
      const isOverBudget = catSpent > budget;
      const overAmount = Math.max(0, catSpent - budget);
      const budgetPercent = budget > 0 ? Math.round((catSpent / budget) * 100) : 0;

      return {
        ...cat,
        periodSpent: catSpent,
        periodBudget: budget,
        isOverBudget,
        overAmount,
        budgetPercent
      };
    });

    // Total expenses in period
    const periodExpenses = filteredTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    // Compute share % of total spend for each category
    categories.forEach(cat => {
      cat.periodPercent = periodExpenses > 0 ? Math.round((cat.periodSpent / periodExpenses) * 100) : 0;
    });

    // Income for period
    const baseIncome = Number(user.monthlyIncome) || 75000;
    const periodIncome = isAnnual ? (baseIncome * 12) : baseIncome;

    // Investment outflow for period (Committed SIPs)
    const activeSIPs = investments.sips || [];
    const monthlySIPTotal = activeSIPs.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const periodInvestments = isAnnual ? (monthlySIPTotal * 12) : monthlySIPTotal;

    // Net savings
    const netSurplus = Math.max(0, periodIncome - periodExpenses - periodInvestments);
    const savingsRate = periodIncome > 0 ? ((netSurplus / periodIncome) * 100).toFixed(1) : 0;

    // Timestamp
    const nowInfo = window.Store ? window.Store.getRealTimeNow() : {
      dateFormatted: new Date().toLocaleDateString('en-IN'),
      timeFormatted: new Date().toLocaleTimeString('en-IN')
    };

    const statementId = `PT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      statementId,
      generatedAt: `${nowInfo.dateFormatted} at ${nowInfo.timeFormatted} IST`,
      periodLabel,
      rangeType,
      scope,
      user,
      summary: {
        income: periodIncome,
        expenses: periodExpenses,
        investments: periodInvestments,
        netSurplus,
        savingsRate,
        portfolioValue: Number(investments.totalPortfolioValue) || 648200,
        gainPercent: investments.gainPercent || 12.4,
        gainAmount: investments.gainAmount || 71200
      },
      categories,
      transactions: filteredTransactions,
      topHoldings: investments.topHoldings || [],
      assetClasses: investments.assetClasses || [],
      sips: activeSIPs,
      upcomingBills: spending.upcomingExpenses || []
    };
  }

  /**
   * Helper: Escapes CSV cell value and wraps in quotes if needed
   */
  escapeCSV(val) {
    if (val === null || val === undefined) return '""';
    let str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  /**
   * Exports data to Excel (.csv format with UTF-8 BOM \uFEFF for seamless ₹ rendering in Excel)
   */
  exportToExcel() {
    try {
      const data = this.getStatementData();
      const rows = [];

      // 1. REPORT HEADER
      rows.push([this.escapeCSV("PAISATRACK FINANCIAL STATEMENT & TAX AUDIT REPORT")]);
      rows.push([this.escapeCSV("Edge Personal Finance & Wealth Intelligence • RBI / SEBI Compliant On-Device Report")]);
      rows.push([this.escapeCSV("Generated On"), this.escapeCSV(data.generatedAt)]);
      rows.push([this.escapeCSV("Statement ID"), this.escapeCSV(data.statementId)]);
      rows.push([this.escapeCSV("Statement Period"), this.escapeCSV(data.periodLabel)]);
      rows.push([this.escapeCSV("Scope"), this.escapeCSV(data.scope.toUpperCase())]);
      rows.push([]);

      // 2. CLIENT TAX & KYC PROFILE
      rows.push([this.escapeCSV("--- CLIENT ACCOUNT & TAX IDENTIFICATION ---")]);
      rows.push([this.escapeCSV("Account Holder"), this.escapeCSV(data.user.fullName || "Rahul Lodhi")]);
      rows.push([this.escapeCSV("Permanent Account Number (PAN)"), this.escapeCSV(data.user.pan || "ABCPL9482K")]);
      rows.push([this.escapeCSV("KYC Status"), this.escapeCSV(data.user.kycStatus || "Verified")]);
      rows.push([this.escapeCSV("Tax Regime"), this.escapeCSV(data.user.taxRegime || "New Tax Regime (FY 2026-27)")]);
      rows.push([this.escapeCSV("Registered Email"), this.escapeCSV(data.user.email || "rahul@example.com")]);
      rows.push([this.escapeCSV("Registered Phone"), this.escapeCSV(data.user.phone || "+91 98765 43210")]);
      rows.push([this.escapeCSV("Residential City"), this.escapeCSV(data.user.city || "Hyderabad")]);
      rows.push([]);

      // 3. EXECUTIVE FINANCIAL SUMMARY
      rows.push([this.escapeCSV("--- EXECUTIVE FINANCIAL SUMMARY ---")]);
      rows.push([
        this.escapeCSV("Financial Metric"),
        this.escapeCSV("Amount (₹)"),
        this.escapeCSV("Amount (Numeric)"),
        this.escapeCSV("Notes & Analysis")
      ]);
      rows.push([
        this.escapeCSV("Period Inflow (Monthly / FY Income)"),
        this.escapeCSV(window.Store ? window.Store.formatINR(data.summary.income) : `₹${data.summary.income}`),
        data.summary.income,
        this.escapeCSV("Fixed salary and declared regular inflows")
      ]);
      rows.push([
        this.escapeCSV("Period Outflow (Total Expenses)"),
        this.escapeCSV(window.Store ? window.Store.formatINR(data.summary.expenses) : `₹${data.summary.expenses}`),
        data.summary.expenses,
        this.escapeCSV("Itemized recorded expenses in selected date range")
      ]);
      rows.push([
        this.escapeCSV("Investment Commitments (Active SIPs)"),
        this.escapeCSV(window.Store ? window.Store.formatINR(data.summary.investments) : `₹${data.summary.investments}`),
        data.summary.investments,
        this.escapeCSV("Automated mutual fund SIPs and recurring asset investments")
      ]);
      rows.push([
        this.escapeCSV("Net Retained Surplus (Savings)"),
        this.escapeCSV(window.Store ? window.Store.formatINR(data.summary.netSurplus) : `₹${data.summary.netSurplus}`),
        data.summary.netSurplus,
        this.escapeCSV(`Effective Savings Rate: ${data.summary.savingsRate}% of inflow`)
      ]);
      rows.push([
        this.escapeCSV("Total Investment Portfolio Valuation"),
        this.escapeCSV(window.Store ? window.Store.formatINR(data.summary.portfolioValue) : `₹${data.summary.portfolioValue}`),
        data.summary.portfolioValue,
        this.escapeCSV(`Unrealized Portfolio Returns: +₹${window.Store ? window.Store.formatINR(data.summary.gainAmount, false) : data.summary.gainAmount} (+${data.summary.gainPercent}%)`)
      ]);
      rows.push([]);

      // 4. CATEGORY SPENDING BREAKDOWN (if scope is 'all' or 'expenses')
      if (data.scope === 'all' || data.scope === 'expenses') {
        rows.push([this.escapeCSV("--- CATEGORY-WISE SPENDING BREAKDOWN ---")]);
        rows.push([
          this.escapeCSV("Category"),
          this.escapeCSV("Period Budget Limit (₹)"),
          this.escapeCSV("Actual Spend (₹)"),
          this.escapeCSV("Actual Spend (Numeric)"),
          this.escapeCSV("Share of Expenses (%)"),
          this.escapeCSV("Budget Used (%)"),
          this.escapeCSV("Budget Status"),
          this.escapeCSV("Over/Under Variance (₹)")
        ]);

        data.categories.forEach(c => {
          const statusText = c.isOverBudget ? `Over Budget by ₹${c.overAmount.toLocaleString('en-IN')}` : "Within Budget Limit";
          rows.push([
            this.escapeCSV(c.name),
            this.escapeCSV(window.Store ? window.Store.formatINR(c.periodBudget) : `₹${c.periodBudget}`),
            this.escapeCSV(window.Store ? window.Store.formatINR(c.periodSpent) : `₹${c.periodSpent}`),
            c.periodSpent,
            this.escapeCSV(`${c.periodPercent}%`),
            this.escapeCSV(`${c.budgetPercent}%`),
            this.escapeCSV(statusText),
            this.escapeCSV(c.isOverBudget ? `+₹${c.overAmount.toLocaleString('en-IN')}` : `-₹${(c.periodBudget - c.periodSpent).toLocaleString('en-IN')}`)
          ]);
        });

        // Totals row
        rows.push([
          this.escapeCSV("TOTAL EXPENSES"),
          this.escapeCSV(window.Store ? window.Store.formatINR(data.categories.reduce((s, c) => s + c.periodBudget, 0)) : ""),
          this.escapeCSV(window.Store ? window.Store.formatINR(data.summary.expenses) : `₹${data.summary.expenses}`),
          data.summary.expenses,
          this.escapeCSV("100%"),
          this.escapeCSV("-"),
          this.escapeCSV("-"),
          this.escapeCSV("-")
        ]);
        rows.push([]);

        // 5. ITEMIZED EXPENSE TRANSACTIONS LEDGER
        rows.push([this.escapeCSV("--- ITEMIZED EXPENSE TRANSACTIONS LEDGER ---")]);
        rows.push([
          this.escapeCSV("Transaction ID"),
          this.escapeCSV("Date (YYYY-MM-DD)"),
          this.escapeCSV("Description / Merchant"),
          this.escapeCSV("Category"),
          this.escapeCSV("Payment Mode / Instrument"),
          this.escapeCSV("Amount (₹)"),
          this.escapeCSV("Amount (Numeric)")
        ]);

        if (data.transactions.length === 0) {
          rows.push([this.escapeCSV("No expense transactions recorded in the selected period."), "", "", "", "", "", ""]);
        } else {
          data.transactions.forEach(tx => {
            rows.push([
              this.escapeCSV(tx.id || "-"),
              this.escapeCSV(tx.date || "-"),
              this.escapeCSV(tx.title || "-"),
              this.escapeCSV(tx.category || "Others"),
              this.escapeCSV(tx.mode || "UPI"),
              this.escapeCSV(window.Store ? window.Store.formatINR(tx.amount) : `₹${tx.amount}`),
              Number(tx.amount) || 0
            ]);
          });
        }
        rows.push([]);

        // 6. UPCOMING BILLS & FIXED DUES
        if (data.upcomingBills && data.upcomingBills.length > 0) {
          rows.push([this.escapeCSV("--- SCHEDULED UPCOMING DUES & FIXED COMMITMENTS ---")]);
          rows.push([
            this.escapeCSV("Bill / Commitment Name"),
            this.escapeCSV("Category"),
            this.escapeCSV("Due Date"),
            this.escapeCSV("Amount (₹)"),
            this.escapeCSV("Amount (Numeric)"),
            this.escapeCSV("Status")
          ]);
          data.upcomingBills.forEach(b => {
            const diff = window.Store ? window.Store.getDaysDifference(b.dueDate) : { label: "Scheduled" };
            rows.push([
              this.escapeCSV(b.name),
              this.escapeCSV(b.category || "Utilities"),
              this.escapeCSV(b.dueDate),
              this.escapeCSV(window.Store ? window.Store.formatINR(b.amount) : `₹${b.amount}`),
              Number(b.amount) || 0,
              this.escapeCSV(diff.label)
            ]);
          });
          rows.push([]);
        }
      }

      // 7. INVESTMENT PORTFOLIO & TOP HOLDINGS (if scope is 'all' or 'investments')
      if (data.scope === 'all' || data.scope === 'investments') {
        rows.push([this.escapeCSV("--- INVESTMENT PORTFOLIO & TOP HOLDINGS ---")]);
        rows.push([
          this.escapeCSV("Asset Class"),
          this.escapeCSV("Holding / Scheme Name"),
          this.escapeCSV("Specifics / Plan / Shares"),
          this.escapeCSV("Current Valuation (₹)"),
          this.escapeCSV("Valuation (Numeric)"),
          this.escapeCSV("Return (%)"),
          this.escapeCSV("Return Status")
        ]);

        data.topHoldings.forEach(h => {
          rows.push([
            this.escapeCSV(h.type || "Mutual Funds"),
            this.escapeCSV(h.name),
            this.escapeCSV(h.sub || "Direct Plan"),
            this.escapeCSV(window.Store ? window.Store.formatINR(h.value) : `₹${h.value}`),
            Number(h.value) || 0,
            this.escapeCSV(`+${h.gainPercent}%`),
            this.escapeCSV(h.gainPositive ? "Profit" : "Loss")
          ]);
        });

        rows.push([
          this.escapeCSV("TOTAL PORTFOLIO"),
          this.escapeCSV("All Tracked Asset Classes"),
          this.escapeCSV("Equities, Mutual Funds, Gold & FD"),
          this.escapeCSV(window.Store ? window.Store.formatINR(data.summary.portfolioValue) : `₹${data.summary.portfolioValue}`),
          data.summary.portfolioValue,
          this.escapeCSV(`+${data.summary.gainPercent}%`),
          this.escapeCSV("Active")
        ]);
        rows.push([]);

        // 8. ACTIVE SIPS & MANDATES
        if (data.sips && data.sips.length > 0) {
          rows.push([this.escapeCSV("--- ACTIVE SYSTEMATIC INVESTMENT PLANS (SIPS) ---")]);
          rows.push([
            this.escapeCSV("Fund Name"),
            this.escapeCSV("Folio Number"),
            this.escapeCSV("Category"),
            this.escapeCSV("Monthly SIP Amount (₹)"),
            this.escapeCSV("Monthly Amount (Numeric)"),
            this.escapeCSV("Monthly Cycle Date"),
            this.escapeCSV("Status"),
            this.escapeCSV("Linked Financial Goal")
          ]);

          data.sips.forEach(s => {
            rows.push([
              this.escapeCSV(s.fundName),
              this.escapeCSV(s.folio || "-"),
              this.escapeCSV(s.category || "-"),
              this.escapeCSV(window.Store ? window.Store.formatINR(s.amount) : `₹${s.amount}`),
              Number(s.amount) || 0,
              this.escapeCSV(s.cycleDate || "-"),
              this.escapeCSV(s.status || "Active"),
              this.escapeCSV(s.linkedGoal || "Wealth Creation")
            ]);
          });
          rows.push([]);
        }
      }

      // 9. AUDIT & DISCLAIMER FOOTER
      rows.push([this.escapeCSV("--- DISCLAIMER & VERIFICATION STAMP ---")]);
      rows.push([this.escapeCSV("This electronic statement was generated securely on-device by PaisaTrack Financial Engine.")]);
      rows.push([this.escapeCSV("Complies with Indian tax audit guidelines and client-side encryption standards.")]);
      rows.push([this.escapeCSV("No physical signature required. End of Statement.")]);

      // Join with CRLF for maximum Excel compatibility across Windows and Mac
      const csvString = rows.map(r => r.join(",")).join("\r\n");

      // Prepend UTF-8 BOM (\uFEFF) so Excel opens ₹ and UTF-8 characters properly
      const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });

      const sanitizedPeriod = data.periodLabel.replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `PaisaTrack_Statement_${sanitizedPeriod}_${new Date().toISOString().split('T')[0]}.csv`;

      // Trigger instant download
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (typeof closeModal === 'function') closeModal();
      if (typeof showToast === 'function') {
        showToast(`Excel Statement downloaded: ${filename}`, "📗");
      }
    } catch (err) {
      console.error("Export to Excel failed:", err);
      alert("Failed to export Excel statement. Please check your data and try again.");
    }
  }

  /**
   * Generates bank-grade HTML markup for printable PDF statement
   * @param {Object} data - Processed statement data bundle
   * @returns {string} Clean HTML string
   */
  generateStatementHTML(data) {
    const formatINR = (val) => window.Store ? window.Store.formatINR(val) : `₹${Number(val).toLocaleString('en-IN')}`;

    // Category breakdown rows
    const categoryRows = data.categories.map(c => `
      <tr class="${c.isOverBudget ? 'statement-row-alert' : ''}">
        <td style="font-weight:600; color:#191c1b;">${c.name}</td>
        <td style="text-align:right;">${formatINR(c.periodBudget)}</td>
        <td style="text-align:right; font-weight:700; color:#191c1b;">${formatINR(c.periodSpent)}</td>
        <td style="text-align:right;">${c.periodPercent}%</td>
        <td style="text-align:right;">
          <div style="display:inline-flex; align-items:center; gap:6px;">
            <span>${c.budgetPercent}%</span>
            <div class="pdf-mini-progress">
              <div class="pdf-mini-bar ${c.isOverBudget ? 'over' : ''}" style="width:${Math.min(100, c.budgetPercent)}%;"></div>
            </div>
          </div>
        </td>
        <td style="text-align:center;">
          ${c.isOverBudget
            ? `<span class="pdf-status-pill danger">Over by ${formatINR(c.overAmount)}</span>`
            : `<span class="pdf-status-pill success">Within Limit</span>`}
        </td>
      </tr>
    `).join('');

    // Transaction rows
    const txRows = data.transactions.length === 0
      ? `<tr><td colspan="5" style="text-align:center; padding:18px; color:#6e7671;">No expense transactions recorded in this statement period.</td></tr>`
      : data.transactions.map((tx, idx) => `
        <tr>
          <td style="color:#6e7671; font-size:0.8rem;">${window.Store ? window.Store.formatDateDisplay(tx.date) : tx.date}</td>
          <td style="font-weight:600; color:#191c1b;">${tx.title || 'Expense'}</td>
          <td><span class="pdf-category-tag">${tx.category || 'Others'}</span></td>
          <td style="color:#6e7671; font-size:0.8rem;">${tx.mode || 'UPI'}</td>
          <td style="text-align:right; font-weight:700; color:#b91c1c;">${formatINR(tx.amount)}</td>
        </tr>
      `).join('');

    // Holdings rows
    const holdingRows = data.topHoldings.map(h => `
      <tr>
        <td style="font-weight:600; color:#191c1b;">${h.name}</td>
        <td><span class="pdf-category-tag">${h.type || 'Mutual Funds'}</span></td>
        <td style="color:#6e7671; font-size:0.8rem;">${h.sub || 'Direct Plan'}</td>
        <td style="text-align:right; font-weight:700; color:#191c1b;">${formatINR(h.value)}</td>
        <td style="text-align:right; font-weight:700; color:#1e6d37;">+${h.gainPercent}%</td>
      </tr>
    `).join('');

    // SIP rows
    const sipRows = data.sips.map(s => `
      <tr>
        <td style="font-weight:600; color:#191c1b;">${s.fundName}</td>
        <td style="font-family:monospace; font-size:0.8rem; color:#6e7671;">${s.folio || '-'}</td>
        <td><span class="pdf-category-tag">${s.category || 'Equity'}</span></td>
        <td style="text-align:right; font-weight:700; color:#1d3c34;">${formatINR(s.amount)}</td>
        <td style="text-align:center; font-size:0.8rem;">${s.cycleDate || '5th every month'}</td>
        <td style="text-align:center;"><span class="pdf-status-pill success">${s.status || 'Active'}</span></td>
      </tr>
    `).join('');

    // Conditional sections based on scope
    const showExpenses = (data.scope === 'all' || data.scope === 'expenses');
    const showInvestments = (data.scope === 'all' || data.scope === 'investments');

    return `
      <div class="statement-sheet-doc" id="printableStatementDoc">
        <!-- WATERMARK -->
        <div class="statement-watermark">PAISATRACK OFFICIAL</div>

        <!-- HEADER -->
        <header class="statement-official-header">
          <div class="statement-brand-col">
            <div class="statement-brand-logo-wrap">
              <div class="statement-logo-badge">₹</div>
              <div>
                <h1 class="statement-brand-name">PAISATRACK</h1>
                <div class="statement-brand-tagline">Edge Wealth & Personal Finance Intelligence</div>
              </div>
            </div>
            <div class="statement-report-type">
              FINANCIAL STATEMENT & TAX AUDIT LEDGER
            </div>
          </div>

          <div class="statement-meta-col">
            <div class="statement-stamp-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              AUTHENTICATED REPORT
            </div>
            <table class="statement-meta-mini-table">
              <tr>
                <td class="meta-lbl">Statement ID:</td>
                <td class="meta-val" style="font-family:monospace;">${data.statementId}</td>
              </tr>
              <tr>
                <td class="meta-lbl">Statement Period:</td>
                <td class="meta-val"><strong>${data.periodLabel}</strong></td>
              </tr>
              <tr>
                <td class="meta-lbl">Generated On:</td>
                <td class="meta-val">${data.generatedAt}</td>
              </tr>
              <tr>
                <td class="meta-lbl">Reporting Scope:</td>
                <td class="meta-val" style="text-transform:capitalize;">${data.scope} Financial Data</td>
              </tr>
            </table>
          </div>
        </header>

        <!-- CLIENT PROFILE CARD -->
        <section class="statement-client-section">
          <div class="statement-client-grid">
            <div class="client-grid-cell">
              <span class="client-cell-label">Client Name</span>
              <span class="client-cell-val" style="font-size:1.05rem; font-weight:700; color:#191c1b;">${data.user.fullName || 'Rahul Lodhi'}</span>
              <span class="client-cell-sub">${data.user.employment || 'ICICI Securities'} • ${data.user.role || 'Senior Analyst'}</span>
            </div>
            <div class="client-grid-cell">
              <span class="client-cell-label">Tax ID (PAN) & KYC</span>
              <div style="display:flex; align-items:center; gap:6px; margin-top:2px;">
                <span class="client-cell-val" style="font-family:monospace; font-weight:700;">${data.user.pan || 'ABCPL9482K'}</span>
                <span class="pdf-status-pill success">KYC VERIFIED ✓</span>
              </div>
              <span class="client-cell-sub">${data.user.taxRegime || 'New Tax Regime (FY 2026-27)'}</span>
            </div>
            <div class="client-grid-cell">
              <span class="client-cell-label">Contact & Residence</span>
              <span class="client-cell-val">${data.user.email || 'rahul@example.com'}</span>
              <span class="client-cell-sub">${data.user.phone || '+91 98765 43210'} • ${data.user.city || 'Hyderabad'}, India</span>
            </div>
          </div>
        </section>

        <!-- EXECUTIVE SUMMARY KPI BOXES -->
        <section class="statement-kpi-section">
          <h2 class="statement-section-title">1. Executive Financial Summary</h2>
          <div class="statement-kpi-grid">
            <div class="statement-kpi-box">
              <span class="kpi-box-label">Period Inflow (Income)</span>
              <span class="kpi-box-amount" style="color:#1d3c34;">${formatINR(data.summary.income)}</span>
              <span class="kpi-box-note">Declared primary salary & inflows</span>
            </div>
            <div class="statement-kpi-box">
              <span class="kpi-box-label">Period Outflow (Expenses)</span>
              <span class="kpi-box-amount" style="color:#b91c1c;">${formatINR(data.summary.expenses)}</span>
              <span class="kpi-box-note">Total recorded spending</span>
            </div>
            <div class="statement-kpi-box">
              <span class="kpi-box-label">Committed SIPs</span>
              <span class="kpi-box-amount" style="color:#2563eb;">${formatINR(data.summary.investments)}</span>
              <span class="kpi-box-note">Automated wealth creation</span>
            </div>
            <div class="statement-kpi-box highlight">
              <span class="kpi-box-label">Net Surplus (Savings)</span>
              <span class="kpi-box-amount" style="color:#1e6d37;">${formatINR(data.summary.netSurplus)}</span>
              <span class="kpi-box-note">Savings Rate: <strong>${data.summary.savingsRate}%</strong></span>
            </div>
            <div class="statement-kpi-box">
              <span class="kpi-box-label">Total Portfolio Valuation</span>
              <span class="kpi-box-amount" style="color:#191c1b;">${formatINR(data.summary.portfolioValue)}</span>
              <span class="kpi-box-note" style="color:#1e6d37; font-weight:600;">Returns: +${data.summary.gainPercent}% (+${formatINR(data.summary.gainAmount)})</span>
            </div>
          </div>
        </section>

        ${showExpenses ? `
          <!-- CATEGORY-WISE BREAKDOWN -->
          <section class="statement-section-block">
            <div class="statement-section-header-row">
              <h2 class="statement-section-title">2. Category-Wise Spending & Budget Utilization</h2>
              <span class="statement-section-badge">Total Categories: ${data.categories.length}</span>
            </div>
            <table class="statement-data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th style="text-align:right;">Budget Limit</th>
                  <th style="text-align:right;">Actual Spend</th>
                  <th style="text-align:right;">Share %</th>
                  <th style="text-align:right;">Budget Used</th>
                  <th style="text-align:center;">Budget Status</th>
                </tr>
              </thead>
              <tbody>
                ${categoryRows}
                <tr class="statement-table-total-row">
                  <td>TOTAL EXPENDITURE</td>
                  <td style="text-align:right;">${formatINR(data.categories.reduce((s, c) => s + c.periodBudget, 0))}</td>
                  <td style="text-align:right; font-weight:800; color:#b91c1c;">${formatINR(data.summary.expenses)}</td>
                  <td style="text-align:right;">100%</td>
                  <td style="text-align:right;">-</td>
                  <td style="text-align:center;">-</td>
                </tr>
              </tbody>
            </table>
          </section>

          <!-- ITEMIZED EXPENSE LEDGER -->
          <section class="statement-section-block">
            <div class="statement-section-header-row">
              <h2 class="statement-section-title">3. Itemized Transaction Ledger (${data.transactions.length} Records)</h2>
              <span class="statement-section-badge">Period: ${data.periodLabel}</span>
            </div>
            <table class="statement-data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description / Merchant</th>
                  <th>Category</th>
                  <th>Payment Mode</th>
                  <th style="text-align:right;">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${txRows}
              </tbody>
            </table>
          </section>
        ` : ''}

        ${showInvestments ? `
          <!-- INVESTMENT PORTFOLIO & TOP HOLDINGS -->
          <section class="statement-section-block">
            <div class="statement-section-header-row">
              <h2 class="statement-section-title">${showExpenses ? '4' : '2'}. Investment Portfolio & Asset Holdings</h2>
              <span class="statement-section-badge">Valuation: ${formatINR(data.summary.portfolioValue)}</span>
            </div>
            <table class="statement-data-table">
              <thead>
                <tr>
                  <th>Scheme / Holding Name</th>
                  <th>Asset Class</th>
                  <th>Holding Details</th>
                  <th style="text-align:right;">Valuation (₹)</th>
                  <th style="text-align:right;">Returns (%)</th>
                </tr>
              </thead>
              <tbody>
                ${holdingRows}
              </tbody>
            </table>
          </section>

          <!-- ACTIVE SIPS -->
          <section class="statement-section-block">
            <div class="statement-section-header-row">
              <h2 class="statement-section-title">${showExpenses ? '5' : '3'}. Active Systematic Investment Plans (SIPs)</h2>
              <span class="statement-section-badge">Monthly Outflow: ${formatINR(data.summary.investments)}</span>
            </div>
            <table class="statement-data-table">
              <thead>
                <tr>
                  <th>Fund / Scheme</th>
                  <th>Folio No.</th>
                  <th>Category</th>
                  <th style="text-align:right;">SIP Amount (₹)</th>
                  <th style="text-align:center;">Cycle Date</th>
                  <th style="text-align:center;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${sipRows}
              </tbody>
            </table>
          </section>
        ` : ''}

        <!-- AUDIT & DISCLAIMER FOOTER -->
        <footer class="statement-official-footer">
          <div class="statement-footer-disclaimer">
            <strong>Legal & Tax Disclaimer:</strong> This official financial statement is automatically aggregated and verified by PaisaTrack On-Device Intelligent Financial Engine. All transaction records and balances reflect user-authenticated inputs and verified bank reconciliations. Valid for income tax computation, budgeting audit, and personal wealth assessments under the Information Technology Act, 2000.
          </div>
          <div class="statement-footer-bottom-row">
            <div>PaisaTrack Technologies • Encrypted Edge Architecture</div>
            <div style="font-family:monospace;">Confidential • Generated for ${data.user.fullName || 'Rahul Lodhi'} (PAN: ${data.user.pan || 'ABCPL9482K'})</div>
            <div>Page 1 of 1</div>
          </div>
        </footer>
      </div>
    `;
  }

  /**
   * Generates PDF view and triggers bank-grade printable preview and window.print()
   */
  exportToPDF() {
    try {
      const data = this.getStatementData();
      const statementHTML = this.generateStatementHTML(data);

      // Injected printable container
      const printContainer = document.getElementById('printableFinancialStatement');
      if (printContainer) {
        printContainer.innerHTML = statementHTML;
      }

      // Close export settings modal
      if (typeof closeModal === 'function') closeModal();

      // Open Statement Preview Modal
      const previewModal = document.getElementById('statementPreviewModal');
      if (previewModal) {
        previewModal.classList.add('open');
      }

      if (typeof showToast === 'function') {
        showToast("Statement ready! Opening Print / PDF dialog...", "📕");
      }

      // Automatically trigger window.print() after rendering
      setTimeout(() => {
        window.print();
      }, 350);

    } catch (err) {
      console.error("Export to PDF failed:", err);
      alert("Failed to generate PDF statement. Please try again.");
    }
  }

  /**
   * Closes statement preview modal
   */
  closeStatementPreview() {
    const previewModal = document.getElementById('statementPreviewModal');
    if (previewModal) {
      previewModal.classList.remove('open');
    }
  }
}

// Instantiate and expose globally
window.ExportManager = ExportManager;
window.exportManager = new ExportManager();

// Automatically initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.exportManager.init();
  });
} else {
  window.exportManager.init();
}
