/**
 * Data store & state management for the Indian Personal Finance App
 * Seeded with data matching the high-fidelity dashboard mockup
 * Fully editable: dynamic additions, deletions, redemptions, fixed expenses & fixed income sources
 */

const STORAGE_KEY = 'EXPENSE_APP_INDIAN_FINANCE_v3';

const defaultAppState = {
  user: {
    fullName: "Rahul Lodhi",
    dob: "2002-06-28", // 28 Jun 2002 -> 24 years in 2026
    age: 24,
    city: "Hyderabad",
    phone: "+91 98765 43210",
    email: "rahul@example.com",
    monthlyIncome: 75000,
    incomeSources: [
      { id: "inc-1", title: "Primary Salary (ICICI Securities)", amount: 75000, frequency: "Monthly", type: "Fixed Salary" }
    ],
    employment: "ICICI Securities",
    role: "Senior Financial Analyst",
    riskProfile: "Moderate",
    investmentPreference: "Mutual Funds, Equities",
    pan: "ABCPL9482K",
    kycStatus: "Verified",
    taxRegime: "New Tax Regime (FY 2026-27)"
  },
  selectedMonth: "October 2026",
  overview: {
    income: 75000,
    expenses: 32400,
    invested: 18000,
    remaining: 24600,
    alertBanner: {
      id: "alert-sip-1",
      visible: true,
      text: "Your SIP of ₹10,000 for Parag Parikh Flexi Cap is due on 5th Oct. Confirm now →",
      fundName: "Parag Parikh Flexi Cap Fund",
      amount: 10000,
      dueDate: "5 Oct 2026"
    },
    upcomingActions: [
      {
        id: "act-1",
        type: "sip",
        title: "SIP Due",
        subtitle: "Parag Parikh Flexi Cap",
        amount: 10000,
        dueDate: "5 Oct",
        actionText: "Confirm",
        confirmed: false
      },
      {
        id: "act-2",
        type: "bill",
        title: "Electricity Bill",
        subtitle: "TSSPDCL Hyderabad",
        amount: 2400,
        dueDate: "8 Oct",
        actionText: "Mark Paid",
        confirmed: false
      },
      {
        id: "act-3",
        type: "sip",
        title: "SIP Due",
        subtitle: "UTI Nifty 50 Index Fund",
        amount: 5000,
        dueDate: "10 Oct",
        actionText: "Confirm",
        confirmed: false
      }
    ]
  },
  spending: {
    totalExpenses: 32400,
    lastMonthExpenses: 29000,
    growthPercent: 12,
    categories: [
      { id: "food", name: "Food & Dining", amount: 8500, budget: 8000, percent: 26, icon: "utensils", color: "#d46b43", bg: "#fcf0eb" },
      { id: "rent", name: "Rent & Housing", amount: 8500, budget: 10000, percent: 26, icon: "home", color: "#d46b43", bg: "#fcf0eb" },
      { id: "shopping", name: "Shopping", amount: 4200, budget: 5000, percent: 13, icon: "shopping-bag", color: "#d46b43", bg: "#fcf0eb" },
      { id: "transport", name: "Transport", amount: 3100, budget: 4000, percent: 10, icon: "car", color: "#d46b43", bg: "#fcf0eb" },
      { id: "utilities", name: "Utilities", amount: 2400, budget: 3000, percent: 7, icon: "zap", color: "#d46b43", bg: "#fcf0eb" },
      { id: "lifestyle", name: "Lifestyle", amount: 3700, budget: 4000, percent: 11, icon: "heart", color: "#d46b43", bg: "#fcf0eb" },
      { id: "others", name: "Others", amount: 2000, budget: 2500, percent: 6, icon: "more-horizontal", color: "#d46b43", bg: "#fcf0eb" }
    ],
    fixedExpenses: [
      { id: "fix-1", name: "House Rent", amount: 8500, recurrence: "1st every month", category: "Rent & Housing" },
      { id: "fix-2", name: "Cook & Maid", amount: 4500, recurrence: "1st every month", category: "Food & Dining" },
      { id: "fix-3", name: "ACT Fibernet Broadband", amount: 1199, recurrence: "10th every month", category: "Utilities" },
      { id: "fix-4", name: "Netflix & Spotify Premium", amount: 999, recurrence: "15th every month", category: "Lifestyle" }
    ],
    upcomingExpenses: [
      { id: "up-1", name: "Apartment Maintenance", amount: 2200, dueDate: "2026-10-15", category: "Rent & Housing" },
      { id: "up-2", name: "Electricity Bill (TSSPDCL)", amount: 2400, dueDate: "2026-10-18", category: "Utilities" },
      { id: "up-3", name: "ACT Fibernet Broadband", amount: 1199, dueDate: "2026-10-20", category: "Utilities" },
      { id: "up-4", name: "Adani Gas Pipeline", amount: 650, dueDate: "2026-10-28", category: "Utilities" }
    ],
    transactions: [
      { id: "tx-1", title: "Nature's Basket Organic Groceries", category: "Food & Dining", amount: 1840, date: "2026-10-03", mode: "Google Pay UPI", icon: "utensils" },
      { id: "tx-2", title: "Uber Premier to Hitec City", category: "Transport", amount: 420, date: "2026-10-02", mode: "Paytm UPI", icon: "car" },
      { id: "tx-3", title: "Zara Casual Shirt & Trousers", category: "Shopping", amount: 2890, date: "2026-10-01", mode: "HDFC Millennia Credit Card", icon: "shopping-bag" },
      { id: "tx-4", title: "October House Rent", category: "Rent & Housing", amount: 8500, date: "2026-10-01", mode: "HDFC NetBanking (NEFT)", icon: "home" },
      { id: "tx-5", title: "Cult.fit Monthly Membership", category: "Lifestyle", amount: 1500, date: "2026-09-29", mode: "Credit Card", icon: "heart" },
      { id: "tx-6", title: "Swiggy Gourmet Dinner", category: "Food & Dining", amount: 940, date: "2026-09-28", mode: "UPI", icon: "utensils" },
      { id: "tx-7", title: "Blue Tokai Coffee & Bakery", category: "Food & Dining", amount: 650, date: "2026-09-26", mode: "UPI", icon: "coffee" }
    ]
  },
  investments: {
    totalPortfolioValue: 648200,
    gainPercent: 12.4,
    gainAmount: 71200,
    period: "1Y",
    asOfDate: "1 Oct 2026",
    selectedFilter: "all", // "all", "mf", "eq", "ot"
    assetClasses: [
      { id: "mf", name: "Mutual Funds", amount: 432500, percent: 66.7, icon: "trending-up", color: "#1d3c34", bg: "#e6efe9" },
      { id: "eq", name: "Equities", amount: 195700, percent: 30.2, icon: "bar-chart-2", color: "#2563eb", bg: "#eff6ff" },
      { id: "ot", name: "Others (Gold / PPF / FD)", amount: 19000, percent: 3.1, icon: "more-horizontal", color: "#d97706", bg: "#fef3c7" }
    ],
    topHoldings: [
      {
        id: "hld-1",
        name: "Parag Parikh Flexi Cap Fund",
        sub: "Direct Plan • Growth (NAV: ₹78.4)",
        value: 152300,
        gainPercent: 14.2,
        gainPositive: true,
        type: "Mutual Funds",
        assetClassId: "mf",
        badgeLetter: "PP",
        badgeBg: "#ef4444"
      },
      {
        id: "hld-2",
        name: "UTI Nifty 50 Index Fund",
        sub: "Direct Plan • Growth (NAV: ₹172.6)",
        value: 121800,
        gainPercent: 11.4,
        gainPositive: true,
        type: "Mutual Funds",
        assetClassId: "mf",
        badgeLetter: "UTI",
        badgeBg: "#0284c7"
      },
      {
        id: "hld-3",
        name: "HDFC Bank",
        sub: "50 shares • Avg: ₹1,452.00",
        value: 78500,
        gainPercent: 8.1,
        gainPositive: true,
        type: "Equities",
        assetClassId: "eq",
        badgeLetter: "HDFC",
        badgeBg: "#dc2626"
      },
      {
        id: "hld-4",
        name: "ICICI Prudential Tech Fund",
        sub: "Direct Plan • Sectoral",
        value: 48200,
        gainPercent: 16.5,
        gainPositive: true,
        type: "Mutual Funds",
        assetClassId: "mf",
        badgeLetter: "ICICI",
        badgeBg: "#ea580c"
      },
      {
        id: "hld-5",
        name: "Reliance Industries",
        sub: "12 shares • Avg: ₹2,510.00",
        value: 31700,
        gainPercent: 6.4,
        gainPositive: true,
        type: "Equities",
        assetClassId: "eq",
        badgeLetter: "RIL",
        badgeBg: "#059669"
      },
      {
        id: "hld-6",
        name: "Sovereign Gold Bond (SGB)",
        sub: "3.5 Grams • 2.5% p.a. interest",
        value: 19000,
        gainPercent: 15.0,
        gainPositive: true,
        type: "Others",
        assetClassId: "ot",
        badgeLetter: "SGB",
        badgeBg: "#d97706"
      }
    ],
    sips: [
      {
        id: "sip-item-1",
        fundName: "Parag Parikh Flexi Cap Fund",
        category: "Equity - Flexi Cap",
        amount: 10000,
        cycleDate: "5th of every month",
        nextDue: "5 Oct 2026",
        status: "Active",
        linkedGoal: "Europe Trip",
        folio: "PPFAS-849201"
      },
      {
        id: "sip-item-2",
        fundName: "UTI Nifty 50 Index Fund",
        category: "Large Cap Index",
        amount: 5000,
        cycleDate: "10th of every month",
        nextDue: "10 Oct 2026",
        status: "Active",
        linkedGoal: "Home Renovation",
        folio: "UTI-301948"
      },
      {
        id: "sip-item-3",
        fundName: "Mirae Asset Large Cap Fund",
        category: "Large Cap Equity",
        amount: 3000,
        cycleDate: "15th of every month",
        nextDue: "15 Oct 2026",
        status: "Active",
        linkedGoal: "New Car",
        folio: "MIRA-994812"
      }
    ],
    history: [
      { id: "ih-1", fundName: "Parag Parikh Flexi Cap Fund", amount: 10000, type: "SIP Auto-Debit", date: "05 Sep 2026", units: "128.45", nav: "₹77.85" },
      { id: "ih-2", fundName: "UTI Nifty 50 Index Fund", amount: 5000, type: "SIP Auto-Debit", date: "10 Sep 2026", units: "29.15", nav: "₹171.50" },
      { id: "ih-3", fundName: "HDFC Bank (Lump-sum)", amount: 25000, type: "Lump Sum Stock Buy", date: "18 Aug 2026", units: "17 shares", nav: "₹1,470.00" }
    ]
  },
  goals: [
    {
      id: "goal-1",
      title: "Emergency Fund",
      targetAmount: 300000,
      currentAmount: 120000,
      percent: 40,
      status: "On Track",
      statusBadge: "on-track",
      icon: "shield",
      color: "#234d3d",
      bg: "#eaf3ed",
      deadline: "Dec 2027",
      linkedVehicle: "HDFC Liquid Fund & Savings Vault",
      recommendedMonthlySIP: 8500,
      description: "6 months of household fixed expenses and security cushion."
    },
    {
      id: "goal-2",
      title: "Home Renovation",
      targetAmount: 1000000,
      currentAmount: 250000,
      percent: 25,
      status: "Needs Attention",
      statusBadge: "needs-attention",
      icon: "home",
      color: "#d97706",
      bg: "#fef3c7",
      deadline: "Aug 2028",
      linkedVehicle: "Balanced Advantage Fund & Hybrid Debt",
      recommendedMonthlySIP: 24500,
      description: "Living room remodeling, modular kitchen upgrade, and interior fittings."
    },
    {
      id: "goal-3",
      title: "Europe Trip",
      targetAmount: 500000,
      currentAmount: 180000,
      percent: 36,
      status: "On Track",
      statusBadge: "on-track",
      icon: "plane",
      color: "#0284c7",
      bg: "#e0f2fe",
      deadline: "Jun 2027",
      linkedVehicle: "Parag Parikh Flexi Cap Fund",
      recommendedMonthlySIP: 12000,
      description: "14-day holiday covering Switzerland, Italy, and Paris."
    },
    {
      id: "goal-4",
      title: "New Car",
      targetAmount: 800000,
      currentAmount: 100000,
      percent: 13,
      status: "Behind Plan",
      statusBadge: "behind-plan",
      icon: "car",
      color: "#dc2626",
      bg: "#fee2e2",
      deadline: "Nov 2027",
      linkedVehicle: "Short-Term Debt + Fixed Deposit",
      recommendedMonthlySIP: 22000,
      description: "Down payment & on-road costs for a new electric/compact SUV."
    }
  ]
};

window.defaultAppState = defaultAppState;

class Store {
  constructor() {
    this.listeners = [];
    this.state = this.loadState();
  }

  sanitizeState(parsed) {
    if (!parsed || typeof parsed !== 'object') {
      const fresh = JSON.parse(JSON.stringify(defaultAppState));
      fresh.user.age = Store.calculateAge(fresh.user.dob);
      return fresh;
    }

    if (parsed.user && parsed.user.dob) {
      parsed.user.age = Store.calculateAge(parsed.user.dob);
    }
    if (parsed.user && !parsed.user.incomeSources) {
      parsed.user.incomeSources = [
        { id: "inc-1", title: "Primary Salary / Income", amount: parsed.user.monthlyIncome || 75000, frequency: "Monthly", type: "Fixed Salary" }
      ];
    }
    if (!parsed.spending) parsed.spending = JSON.parse(JSON.stringify(defaultAppState.spending));
    if (!parsed.spending.categories) parsed.spending.categories = defaultAppState.spending.categories;
    const defaultBudgets = { food: 8000, rent: 10000, shopping: 5000, transport: 4000, utilities: 3000, lifestyle: 4000, others: 2500 };
    parsed.spending.categories.forEach(c => {
      if (c.budget === undefined || c.budget === null) {
        c.budget = defaultBudgets[c.id] || 5000;
      }
    });
    if (!parsed.spending.fixedExpenses) {
      parsed.spending.fixedExpenses = defaultAppState.spending.fixedExpenses || [];
    }
    if (!parsed.spending.upcomingExpenses) {
      parsed.spending.upcomingExpenses = defaultAppState.spending.upcomingExpenses || [];
    }
    if (!parsed.spending.transactions) {
      parsed.spending.transactions = [];
    }
    if (!parsed.investments) {
      parsed.investments = JSON.parse(JSON.stringify(defaultAppState.investments));
    }
    if (!parsed.investments.assetClasses) {
      parsed.investments.assetClasses = defaultAppState.investments.assetClasses;
    }
    if (!parsed.investments.topHoldings) {
      parsed.investments.topHoldings = [];
    }
    if (!parsed.investments.sips) {
      parsed.investments.sips = [];
    }
    if (!parsed.goals) {
      parsed.goals = defaultAppState.goals || [];
    }
    if (!parsed.overview) {
      parsed.overview = JSON.parse(JSON.stringify(defaultAppState.overview));
    }
    return parsed;
  }

  loadState() {
    // 1. Check if AuthManager has an active user's state
    if (window.authManager && typeof window.authManager.loadActiveUserState === 'function') {
      const authState = window.authManager.loadActiveUserState();
      if (authState) {
        return this.sanitizeState(authState);
      }
    }

    // 2. Check legacy storage key
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return this.sanitizeState(parsed);
      }
    } catch (e) {
      console.warn("Could not load from localStorage, using default state", e);
    }

    // 3. Fallback to default state
    const fresh = JSON.parse(JSON.stringify(defaultAppState));
    fresh.user.age = Store.calculateAge(fresh.user.dob);
    return fresh;
  }

  saveState() {
    try {
      // 1. Dual-layer save via AuthManager (LocalStorage user key + IndexedDB PaisaTrackDB)
      if (window.authManager && typeof window.authManager.saveActiveUserState === 'function') {
        window.authManager.saveActiveUserState(this.state);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      }
    } catch (e) {
      console.error("Failed to save state", e);
    }
    this.notify();
  }

  switchUser(newState) {
    this.state = this.sanitizeState(newState);
    this.recalculateTotals();
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => l(this.state));
  }

  resetToDefault() {
    this.state = JSON.parse(JSON.stringify(defaultAppState));
    this.state.user.age = Store.calculateAge(this.state.user.dob);
    this.recalculateTotals();
    this.saveState();
  }

  startFresh(userSetup = {}) {
    const income = Number(userSetup.income) || 60000;
    const name = userSetup.name || "User";
    const city = userSetup.city || "Mumbai";

    this.state = JSON.parse(JSON.stringify(defaultAppState));
    this.state.user.fullName = name;
    this.state.user.city = city;
    this.state.user.monthlyIncome = income;
    this.state.user.incomeSources = [
      { id: "inc-1", title: "Fixed Monthly Income", amount: income, frequency: "Monthly", type: "Fixed Salary" }
    ];
    this.state.overview.income = income;
    this.state.overview.invested = 0;
    this.state.overview.expenses = 0;
    this.state.overview.remaining = income;
    this.state.spending.transactions = [];
    this.state.spending.categories.forEach(c => c.amount = 0);
    this.state.spending.fixedExpenses = [];
    this.state.investments.topHoldings = [];
    this.state.investments.history = [];
    this.state.investments.sips = [];
    this.state.investments.assetClasses.forEach(a => a.amount = 0);
    this.state.investments.totalPortfolioValue = 0;
    this.state.investments.gainAmount = 0;
    this.state.goals = [];
    this.state.overview.upcomingActions = [];
    this.state.overview.alertBanner.visible = false;

    this.recalculateTotals();
    this.saveState();
  }

  static formatINR(val, withSymbol = true) {
    const num = Math.round(Number(val) || 0);
    const formatted = num.toLocaleString('en-IN');
    return withSymbol ? `₹${formatted}` : formatted;
  }

  static calculateAge(dobStr) {
    if (!dobStr) return 24;
    const birth = new Date(dobStr);
    if (isNaN(birth.getTime())) return 24;
    const now = new Date();
    const currentYear = now.getFullYear() < 2026 ? 2026 : now.getFullYear();
    let age = currentYear - birth.getFullYear();
    const m = (now.getMonth()) - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return Math.max(0, age);
  }

  static formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  static getDaysDifference(targetDateStr) {
    if (!targetDateStr) {
      return { days: 0, label: "Scheduled", statusClass: "on-track", isUrgent: false, badgeColor: "#685844" };
    }
    const target = new Date(targetDateStr);
    if (isNaN(target.getTime())) {
      return { days: 0, label: targetDateStr, statusClass: "on-track", isUrgent: false, badgeColor: "#685844" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compTarget = new Date(target);
    compTarget.setHours(0, 0, 0, 0);

    const diffTime = compTarget.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const overdue = Math.abs(diffDays);
      return {
        days: diffDays,
        label: `Overdue by ${overdue} ${overdue === 1 ? 'day' : 'days'}!`,
        statusClass: "behind-plan",
        isUrgent: true,
        badgeColor: "#dc2626"
      };
    } else if (diffDays === 0) {
      return {
        days: 0,
        label: "Due Today!",
        statusClass: "behind-plan",
        isUrgent: true,
        badgeColor: "#dc2626"
      };
    } else if (diffDays === 1) {
      return {
        days: 1,
        label: "Due Tomorrow",
        statusClass: "needs-attention",
        isUrgent: true,
        badgeColor: "#d97706"
      };
    } else if (diffDays <= 3) {
      return {
        days: diffDays,
        label: `Due in ${diffDays} days`,
        statusClass: "needs-attention",
        isUrgent: true,
        badgeColor: "#d97706"
      };
    } else {
      return {
        days: diffDays,
        label: `Due in ${diffDays} days`,
        statusClass: "on-track",
        isUrgent: false,
        badgeColor: "#1e6d37"
      };
    }
  }

  static getRealTimeNow() {
    const now = new Date();
    const dateOptions = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    return {
      dateFormatted: now.toLocaleDateString('en-IN', dateOptions),
      timeFormatted: now.toLocaleTimeString('en-IN', timeOptions),
      isoToday: now.toISOString().split('T')[0],
      hour: now.getHours()
    };
  }

  static getGreeting() {
    const hr = new Date().getHours();
    if (hr < 12) return "Good Morning";
    if (hr < 17) return "Good Afternoon";
    return "Good Evening";
  }

  // ==========================================
  // FIXED EXPENSES: Add, Edit, Delete
  // ==========================================
  addFixedExpense(fix) {
    const newFix = {
      id: "fix-" + Date.now(),
      name: fix.name,
      amount: Number(fix.amount),
      recurrence: fix.recurrence || "1st every month",
      category: fix.category || "Utilities"
    };
    this.state.spending.fixedExpenses.push(newFix);
    this.saveState();
  }

  editFixedExpense(fixId, updated) {
    const fix = this.state.spending.fixedExpenses.find(f => f.id === fixId);
    if (!fix) return;
    if (updated.name) fix.name = updated.name;
    if (updated.amount !== undefined) fix.amount = Number(updated.amount);
    if (updated.recurrence) fix.recurrence = updated.recurrence;
    if (updated.category) fix.category = updated.category;
    this.saveState();
  }

  deleteFixedExpense(fixId) {
    this.state.spending.fixedExpenses = this.state.spending.fixedExpenses.filter(f => f.id !== fixId);
    this.saveState();
  }

  // ==========================================
  // INCOME & INCOME SOURCES: Add, Edit, Delete
  // ==========================================
  setMonthlyIncome(amount) {
    const inc = Number(amount) || 0;
    this.state.user.monthlyIncome = inc;
    this.state.overview.income = inc;
    if (!this.state.user.incomeSources || this.state.user.incomeSources.length === 0) {
      this.state.user.incomeSources = [
        { id: "inc-1", title: "Primary Fixed Income", amount: inc, frequency: "Monthly", type: "Fixed Salary" }
      ];
    } else {
      this.state.user.incomeSources[0].amount = inc;
    }
    this.recalculateTotals();
    this.saveState();
  }

  addIncomeSource(source) {
    if (!this.state.user.incomeSources) this.state.user.incomeSources = [];
    const newInc = {
      id: "inc-" + Date.now(),
      title: source.title || "Additional Income",
      amount: Number(source.amount) || 0,
      frequency: source.frequency || "Monthly",
      type: source.type || "Other Income"
    };
    this.state.user.incomeSources.push(newInc);
    this.recalculateTotals();
    this.saveState();
  }

  editIncomeSource(incId, updated) {
    if (!this.state.user.incomeSources) return;
    const inc = this.state.user.incomeSources.find(i => i.id === incId);
    if (!inc) return;
    if (updated.title) inc.title = updated.title;
    if (updated.amount !== undefined) inc.amount = Number(updated.amount);
    if (updated.type) inc.type = updated.type;
    if (updated.frequency) inc.frequency = updated.frequency;
    this.recalculateTotals();
    this.saveState();
  }

  deleteIncomeSource(incId) {
    if (!this.state.user.incomeSources) return;
    this.state.user.incomeSources = this.state.user.incomeSources.filter(i => i.id !== incId);
    this.recalculateTotals();
    this.saveState();
  }

  // ==========================================
  // EXPENSE ACTIONS: Add, Edit, Delete
  // ==========================================
  addExpense(expense) {
    const amount = Number(expense.amount);
    const category = expense.category || "Others";

    const newTx = {
      id: "tx-" + Date.now(),
      title: expense.title,
      category: category,
      amount: amount,
      date: expense.date || new Date().toISOString().split('T')[0],
      mode: expense.mode || "UPI",
      icon: expense.icon || "receipt"
    };

    this.state.spending.transactions.unshift(newTx);
    this.recalculateTotals();
    this.saveState();
  }

  editExpense(txId, updated) {
    const tx = this.state.spending.transactions.find(t => t.id === txId);
    if (!tx) return;

    tx.title = updated.title || tx.title;
    tx.amount = Number(updated.amount) || tx.amount;
    tx.category = updated.category || tx.category;
    tx.mode = updated.mode || tx.mode;
    tx.date = updated.date || tx.date;

    this.recalculateTotals();
    this.saveState();
  }

  deleteExpense(txId) {
    this.state.spending.transactions = this.state.spending.transactions.filter(t => t.id !== txId);
    this.recalculateTotals();
    this.saveState();
  }

  // ==========================================
  // CATEGORY BUDGET ACTIONS
  // ==========================================
  setCategoryBudget(catId, budget) {
    const search = String(catId || '').toLowerCase().trim();
    const cat = this.state.spending.categories.find(c => 
      c.id.toLowerCase() === search || 
      c.name.toLowerCase() === search ||
      c.name.toLowerCase().includes(search)
    );
    if (cat) {
      cat.budget = Number(budget) >= 0 ? Number(budget) : 0;
      this.recalculateTotals();
      this.saveState();
    }
  }

  setAllCategoryBudgets(budgetMap) {
    this.state.spending.categories.forEach(c => {
      if (budgetMap[c.id] !== undefined) {
        c.budget = Number(budgetMap[c.id]) || 0;
      }
    });
    this.recalculateTotals();
    this.saveState();
  }

  // ==========================================
  // UPCOMING EXPENSES ACTIONS
  // ==========================================
  addUpcomingExpense(expense) {
    const amount = Number(expense.amount) || 0;
    const category = expense.category || "Utilities";
    const dueDate = expense.dueDate || new Date().toISOString().split('T')[0];

    const newBill = {
      id: "up-" + Date.now(),
      name: expense.name || expense.title,
      amount: amount,
      dueDate: dueDate,
      category: category,
      urgent: expense.urgent || false
    };

    if (!this.state.spending.upcomingExpenses) {
      this.state.spending.upcomingExpenses = [];
    }
    this.state.spending.upcomingExpenses.unshift(newBill);

    // Also add to overview upcoming actions
    this.state.overview.upcomingActions.unshift({
      id: "act-up-" + Date.now(),
      type: "bill",
      title: "Upcoming Bill",
      subtitle: newBill.name,
      amount: newBill.amount,
      dueDate: Store.formatDateDisplay(dueDate),
      rawDueDate: dueDate,
      actionText: "Mark Paid",
      confirmed: false
    });

    this.recalculateTotals();
    this.saveState();
  }

  deleteUpcomingExpense(upId) {
    if (!this.state.spending.upcomingExpenses) return;
    this.state.spending.upcomingExpenses = this.state.spending.upcomingExpenses.filter(u => u.id !== upId);
    this.recalculateTotals();
    this.saveState();
  }

  // ==========================================
  // INVESTMENT ACTIONS: Add, Edit, Delete, Redeem
  // ==========================================
  addInvestment(inv) {
    const amount = Number(inv.amount);
    const type = inv.type || "Mutual Funds";
    let assetClassId = "mf";
    if (type.toLowerCase().includes("equit") || type.toLowerCase().includes("stock")) {
      assetClassId = "eq";
    } else if (type.toLowerCase().includes("gold") || type.toLowerCase().includes("other") || type.toLowerCase().includes("fd")) {
      assetClassId = "ot";
    }

    this.state.investments.history.unshift({
      id: "ih-" + Date.now(),
      fundName: inv.name,
      amount: amount,
      type: "Lump-Sum Buy",
      date: Store.formatDateDisplay(inv.date || new Date()),
      units: inv.units || "-",
      nav: inv.nav ? `₹${inv.nav}` : "-"
    });

    let holding = this.state.investments.topHoldings.find(h => h.name.toLowerCase() === inv.name.toLowerCase());
    if (holding) {
      holding.value += amount;
    } else {
      this.state.investments.topHoldings.push({
        id: "hld-" + Date.now(),
        name: inv.name,
        sub: `${type} • Direct`,
        value: amount,
        gainPercent: 0,
        gainPositive: true,
        type: type,
        assetClassId: assetClassId,
        badgeLetter: inv.name.substring(0, 3).toUpperCase(),
        badgeBg: assetClassId === 'mf' ? '#1d3c34' : (assetClassId === 'eq' ? '#0284c7' : '#d97706')
      });
    }

    this.state.overview.invested += amount;
    this.recalculateTotals();
    this.saveState();
  }

  editHolding(hldId, updated) {
    const h = this.state.investments.topHoldings.find(item => item.id === hldId);
    if (!h) return;

    if (updated.name) h.name = updated.name;
    if (updated.value !== undefined) h.value = Number(updated.value);
    if (updated.gainPercent !== undefined) h.gainPercent = Number(updated.gainPercent);
    if (updated.type) {
      h.type = updated.type;
      h.assetClassId = updated.type.toLowerCase().includes("equit") ? "eq" : (updated.type.toLowerCase().includes("other") ? "ot" : "mf");
    }

    this.recalculateTotals();
    this.saveState();
  }

  deleteHolding(hldId) {
    this.state.investments.topHoldings = this.state.investments.topHoldings.filter(h => h.id !== hldId);
    this.recalculateTotals();
    this.saveState();
  }

  redeemHolding(hldId, redeemAmount, date, notes) {
    const h = this.state.investments.topHoldings.find(item => item.id === hldId);
    if (!h) return;

    const amount = Math.min(Number(redeemAmount) || 0, h.value);
    if (amount <= 0) return;

    h.value -= amount;

    this.state.investments.history.unshift({
      id: "ih-" + Date.now(),
      fundName: h.name,
      amount: amount,
      type: "Redemption / Sale",
      date: Store.formatDateDisplay(date || new Date()),
      units: notes || "Funds credited to Bank Account",
      nav: "Redeemed"
    });

    if (h.value <= 0) {
      this.state.investments.topHoldings = this.state.investments.topHoldings.filter(item => item.id !== hldId);
    }

    this.recalculateTotals();
    this.saveState();
  }

  // ==========================================
  // GOALS ACTIONS
  // ==========================================
  addGoal(goal) {
    const target = Number(goal.targetAmount);
    const current = Number(goal.currentAmount || 0);
    const percent = Math.min(100, Math.round((current / target) * 100));

    let status = "On Track";
    let statusBadge = "on-track";
    if (percent < 20) {
      status = "Behind Plan";
      statusBadge = "behind-plan";
    } else if (percent < 35) {
      status = "Needs Attention";
      statusBadge = "needs-attention";
    }

    const newGoal = {
      id: "goal-" + Date.now(),
      title: goal.title,
      targetAmount: target,
      currentAmount: current,
      percent: percent,
      status: status,
      statusBadge: statusBadge,
      icon: goal.icon || "shield",
      color: goal.color || "#234d3d",
      bg: goal.bg || "#eaf3ed",
      deadline: goal.deadline || "Dec 2027",
      linkedVehicle: goal.linkedVehicle || "SIP in Mutual Funds",
      recommendedMonthlySIP: goal.recommendedMonthlySIP || Math.round(target / 24),
      description: goal.description || "Goal tracked through disciplined savings."
    };

    this.state.goals.push(newGoal);
    this.saveState();
  }

  editGoal(goalId, updated) {
    const g = this.state.goals.find(item => item.id === goalId);
    if (!g) return;

    if (updated.title) g.title = updated.title;
    if (updated.targetAmount) g.targetAmount = Number(updated.targetAmount);
    if (updated.currentAmount !== undefined) g.currentAmount = Number(updated.currentAmount);
    if (updated.deadline) g.deadline = updated.deadline;
    if (updated.linkedVehicle) g.linkedVehicle = updated.linkedVehicle;
    if (updated.description) g.description = updated.description;

    g.percent = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
    if (g.percent >= 40) {
      g.status = "On Track";
      g.statusBadge = "on-track";
    } else if (g.percent >= 25) {
      g.status = "Needs Attention";
      g.statusBadge = "needs-attention";
    } else {
      g.status = "Behind Plan";
      g.statusBadge = "behind-plan";
    }

    this.saveState();
  }

  deleteGoal(goalId) {
    this.state.goals = this.state.goals.filter(g => g.id !== goalId);
    this.saveState();
  }

  contributeToGoal(goalId, amount) {
    const goal = this.state.goals.find(g => g.id === goalId);
    if (!goal) return;

    goal.currentAmount += Number(amount);
    goal.percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
    
    if (goal.percent >= 40) {
      goal.status = "On Track";
      goal.statusBadge = "on-track";
    } else if (goal.percent >= 25) {
      goal.status = "Needs Attention";
      goal.statusBadge = "needs-attention";
    } else {
      goal.status = "Behind Plan";
      goal.statusBadge = "behind-plan";
    }

    this.saveState();
  }

  // ==========================================
  // PROFILE ACTIONS
  // ==========================================
  updatePersonalDetails(details) {
    this.state.user.fullName = details.fullName || this.state.user.fullName;
    this.state.user.dob = details.dob || this.state.user.dob;
    this.state.user.age = Store.calculateAge(this.state.user.dob);
    this.state.user.city = details.city || this.state.user.city;
    this.state.user.phone = details.phone || this.state.user.phone;
    this.state.user.email = details.email || this.state.user.email;
    this.state.user.pan = details.pan || this.state.user.pan;

    this.saveState();
  }

  updateFinancialProfile(profile) {
    if (profile.monthlyIncome !== undefined) {
      const inc = Number(profile.monthlyIncome);
      this.state.user.monthlyIncome = inc;
      this.state.overview.income = inc;
      if (this.state.user.incomeSources && this.state.user.incomeSources.length > 0) {
        this.state.user.incomeSources[0].amount = inc;
      }
    }
    if (profile.employment) this.state.user.employment = profile.employment;
    if (profile.role) this.state.user.role = profile.role;
    if (profile.riskProfile) this.state.user.riskProfile = profile.riskProfile;
    if (profile.investmentPreference) this.state.user.investmentPreference = profile.investmentPreference;
    if (profile.taxRegime) this.state.user.taxRegime = profile.taxRegime;

    this.recalculateTotals();
    this.saveState();
  }

  // ==========================================
  // SIP ACTIONS
  // ==========================================
  addSIP(sip) {
    const newSip = {
      id: "sip-item-" + Date.now(),
      fundName: sip.fundName,
      category: sip.category || "Equity Fund",
      amount: Number(sip.amount),
      cycleDate: `${sip.dueDay || 5}th of every month`,
      nextDue: `${sip.dueDay || 5} Oct 2026`,
      status: "Active",
      linkedGoal: sip.linkedGoal || "General Wealth",
      folio: "FOLIO-" + Math.floor(100000 + Math.random() * 900000)
    };
    this.state.investments.sips.push(newSip);

    this.state.overview.upcomingActions.push({
      id: "act-" + Date.now(),
      type: "sip",
      title: "SIP Due",
      subtitle: sip.fundName,
      amount: Number(sip.amount),
      dueDate: `${sip.dueDay || 5} Oct`,
      actionText: "Confirm",
      confirmed: false
    });

    this.saveState();
  }

  confirmSIP(actionId) {
    const action = this.state.overview.upcomingActions.find(a => a.id === actionId);
    if (!action) return;

    action.confirmed = true;
    this.state.overview.invested += action.amount;

    this.state.investments.history.unshift({
      id: "ih-" + Date.now(),
      fundName: action.subtitle,
      amount: action.amount,
      type: "SIP Payment Confirmed",
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      units: (action.amount / 78.4).toFixed(2),
      nav: "₹78.40"
    });

    let holding = this.state.investments.topHoldings.find(h => h.name.toLowerCase().includes(action.subtitle.toLowerCase().split(' ')[0]));
    if (holding) {
      holding.value += action.amount;
    }

    if (this.state.overview.alertBanner.visible && this.state.overview.alertBanner.fundName.includes("Parag Parikh")) {
      this.state.overview.alertBanner.visible = false;
    }

    this.recalculateTotals();
    this.saveState();
  }

  markBillPaid(actionId) {
    const action = this.state.overview.upcomingActions.find(a => a.id === actionId);
    if (!action) return;

    action.confirmed = true;

    this.state.spending.transactions.unshift({
      id: "tx-" + Date.now(),
      title: `${action.subtitle} Payment`,
      category: "Utilities",
      amount: action.amount,
      date: new Date().toISOString().split('T')[0],
      mode: "UPI Autopay",
      icon: "zap"
    });

    this.recalculateTotals();
    this.saveState();
  }

  // ==========================================
  // TOTALS RECALCULATION
  // ==========================================
  recalculateTotals() {
    // 1. Recalculate Income from Income Sources if present
    if (this.state.user.incomeSources && this.state.user.incomeSources.length > 0) {
      const totalIncome = this.state.user.incomeSources.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
      this.state.overview.income = totalIncome;
      this.state.user.monthlyIncome = totalIncome;
    } else if (this.state.user.incomeSources && this.state.user.incomeSources.length === 0) {
      this.state.overview.income = 0;
      this.state.user.monthlyIncome = 0;
    }

    // 2. Spending totals from transactions & Category Budgets
    this.state.spending.categories.forEach(c => c.amount = 0);
    let totalExp = 0;

    this.state.spending.transactions.forEach(tx => {
      const amt = Number(tx.amount) || 0;
      totalExp += amt;

      const cat = this.state.spending.categories.find(c => c.name.toLowerCase() === (tx.category || '').toLowerCase());
      if (cat) {
        cat.amount += amt;
      } else {
        const others = this.state.spending.categories.find(c => c.id === 'others');
        if (others) others.amount += amt;
      }
    });

    this.state.spending.totalExpenses = totalExp;
    this.state.overview.expenses = totalExp;

    const defaultBudgets = { food: 8000, rent: 10000, shopping: 5000, transport: 4000, utilities: 3000, lifestyle: 4000, others: 2500 };
    const overBudgetCategories = [];

    this.state.spending.categories.forEach(c => {
      c.percent = totalExp > 0 ? Math.round((c.amount / totalExp) * 100) : 0;
      if (c.budget === undefined || c.budget === null) {
        c.budget = defaultBudgets[c.id] || 5000;
      }
      c.spent = c.amount;
      c.isOverBudget = c.spent > c.budget;
      c.overAmount = Math.max(0, c.spent - c.budget);
      c.budgetPercent = c.budget > 0 ? Math.round((c.spent / c.budget) * 100) : 0;

      if (c.isOverBudget) {
        overBudgetCategories.push(c);
      }
    });

    this.state.spending.overBudgetCategories = overBudgetCategories;

    // Real-Time Trigger Evaluation for Alert Banner
    const urgentBill = (this.state.spending.upcomingExpenses || []).find(b => {
      const diff = Store.getDaysDifference(b.dueDate);
      return diff.isUrgent;
    });

    if (overBudgetCategories.length > 0) {
      const topOver = overBudgetCategories[0];
      this.state.overview.alertBanner = {
        visible: true,
        type: "budget_overflow",
        title: "Category Budget Exceeded!",
        message: `${topOver.name} spending (${Store.formatINR(topOver.spent)}) exceeded monthly limit of ${Store.formatINR(topOver.budget)} by ${Store.formatINR(topOver.overAmount)}.`,
        ctaText: "Review Budgets",
        linkTab: "spending"
      };
    } else if (urgentBill) {
      const diff = Store.getDaysDifference(urgentBill.dueDate);
      this.state.overview.alertBanner = {
        visible: true,
        type: "bill_due",
        title: "Upcoming Bill Reminder",
        message: `${urgentBill.name} (${Store.formatINR(urgentBill.amount)}) is ${diff.label.toLowerCase()}.`,
        ctaText: "Pay Now",
        linkTab: "spending"
      };
    }

    // 3. Investment Holdings totals & Asset Class allocations
    let totalMF = 0;
    let totalEQ = 0;
    let totalOT = 0;

    this.state.investments.topHoldings.forEach(h => {
      const val = Number(h.value) || 0;
      if (h.assetClassId === 'eq' || h.type.toLowerCase().includes('equit')) {
        totalEQ += val;
      } else if (h.assetClassId === 'ot' || h.type.toLowerCase().includes('gold') || h.type.toLowerCase().includes('other')) {
        totalOT += val;
      } else {
        totalMF += val;
      }
    });

    const totalPortfolio = totalMF + totalEQ + totalOT;
    this.state.investments.totalPortfolioValue = totalPortfolio;

    const mfClass = this.state.investments.assetClasses.find(a => a.id === 'mf');
    const eqClass = this.state.investments.assetClasses.find(a => a.id === 'eq');
    const otClass = this.state.investments.assetClasses.find(a => a.id === 'ot');

    if (mfClass) {
      mfClass.amount = totalMF;
      mfClass.percent = totalPortfolio > 0 ? Number(((totalMF / totalPortfolio) * 100).toFixed(1)) : 0;
    }
    if (eqClass) {
      eqClass.amount = totalEQ;
      eqClass.percent = totalPortfolio > 0 ? Number(((totalEQ / totalPortfolio) * 100).toFixed(1)) : 0;
    }
    if (otClass) {
      otClass.amount = totalOT;
      otClass.percent = totalPortfolio > 0 ? Number(((totalOT / totalPortfolio) * 100).toFixed(1)) : 0;
    }

    // 4. Overview Remaining Balance
    const inc = Number(this.state.overview.income) || 0;
    const inv = Number(this.state.overview.invested) || 0;
    const exp = Number(this.state.overview.expenses) || 0;
    this.state.overview.remaining = Math.max(0, inc - exp - inv);
  }
}

window.appStore = new Store();
