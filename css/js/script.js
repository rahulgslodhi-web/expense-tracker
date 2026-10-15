/**
 * Core Application Logic for Indian Personal Finance & Investment App
 * Features complete CRUD editing for Expenses, Investments (with Redemption),
 * Goals, Profile (with dynamic DOB-based age), and Asset Allocation filters.
 */

// Sound synthesis for subtle haptic feedback
function playTapSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch (e) {
    // AudioContext blocked or not supported
  }
}

// Show Toast
function showToast(message, icon = '✓') {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = 'toast-bubble';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span style="color:#d46b43;">${icon}</span> <span>${message}</span>`;
  toast.classList.add('show');
  playTapSound();
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

// Close any open modal
function closeModal() {
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.classList.remove('open');
  });
}

// Open specific modal
function openModal(modalId) {
  closeModal();
  if (modalId === 'exportDataModal' && !document.getElementById('exportDataModal')) {
    modalId = 'exportStatementModal';
  }
  const target = document.getElementById(modalId);
  if (target) {
    target.classList.add('open');
    playTapSound();

    if (modalId === 'addExpenseModal' && window.app && typeof window.app.setExpenseType === 'function') {
      window.app.setExpenseType('paid');
    }

    // Real-Time auto-fill for date inputs so they are never blank
    const today = Store.getRealTimeNow().isoToday;
    target.querySelectorAll('input[type="date"]').forEach(inp => {
      if (!inp.value) {
        inp.value = today;
      }
    });
  }
}

class FinanceApp {
  constructor() {
    this.store = window.appStore;
    this.currentTab = 'overview';
    this.spendingSubTab = 'category';
    this.investmentsSubTab = 'holdings';
    this.goalsSubTab = 'my-goals';
    this.investmentFilter = 'all'; // 'all', 'mf', 'eq', 'ot'
    this.activeGoalId = null;

    this.init();
  }

  init() {
    // Register store listener
    this.store.subscribe(() => {
      this.renderAll();
    });

    // Render initial state
    this.renderAll();
    this.setupEventListeners();

    // Start live clock updates
    setInterval(() => {
      this.updateRealTimeClock();
    }, 15000);
  }

  updateRealTimeClock() {
    const clockEl = document.getElementById('realtimeLiveClock');
    if (clockEl) {
      const nowInfo = Store.getRealTimeNow();
      clockEl.textContent = `${nowInfo.dateFormatted} • ${nowInfo.timeFormatted}`;
    }
  }

  renderAll() {
    this.updateRealTimeClock();
    this.renderOverview();
    this.renderSpending();
    this.renderInvestments();
    this.renderGoals();
    this.renderProfile();
    this.renderIncomeSources();
    if (window.authManager && typeof window.authManager.updateHeaderBadge === 'function') {
      window.authManager.updateHeaderBadge();
    }
  }

  // ----------------------------------------------------
  // 1. OVERVIEW SCREEN RENDER
  // ----------------------------------------------------
  renderOverview() {
    const s = this.store.state;
    const ov = s.overview;

    // Greeting & user name based on real-time hour
    const greetingEl = document.getElementById('overviewGreeting');
    if (greetingEl) {
      const greeting = Store.getGreeting();
      greetingEl.innerHTML = `${greeting}, ${s.user.fullName.split(' ')[0]} 👋`;
    }

    // Month Selector
    const monthEl = document.getElementById('overviewMonthText');
    if (monthEl) {
      monthEl.textContent = s.selectedMonth;
    }

    // Smart Alert Banner with Real-Time & Budget Triggers
    const alertContainer = document.getElementById('smartAlertContainer');
    if (alertContainer) {
      if (ov.alertBanner && ov.alertBanner.visible) {
        const msg = ov.alertBanner.message || ov.alertBanner.text;
        const isBudgetOverflow = ov.alertBanner.type === 'budget_overflow';
        alertContainer.innerHTML = `
          <div class="smart-alert-banner" onclick="app.handleBannerClick()" style="${isBudgetOverflow ? 'background:#fff5f5; border-color:#fecaca;' : ''}">
            <div class="alert-icon-wrap" style="${isBudgetOverflow ? 'background:#fee2e2; color:#dc2626;' : ''}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div class="alert-content-wrap">
              <span class="alert-message-text" style="${isBudgetOverflow ? 'color:#991b1b;' : ''}">${msg}</span>
            </div>
          </div>
        `;
      } else {
        alertContainer.innerHTML = '';
      }
    }

    // 4 Metrics Grid
    const incomeEl = document.getElementById('statIncome');
    const expensesEl = document.getElementById('statExpenses');
    const investedEl = document.getElementById('statInvested');
    const remainingEl = document.getElementById('statRemaining');

    if (incomeEl) incomeEl.textContent = Store.formatINR(ov.income);
    if (expensesEl) expensesEl.textContent = Store.formatINR(ov.expenses);
    if (investedEl) investedEl.textContent = Store.formatINR(ov.invested);
    if (remainingEl) remainingEl.textContent = Store.formatINR(ov.remaining);

    // Donut Chart: Total Income Bifurcation (Expenses, Investments, Remaining)
    ChartRenderer.renderDonut('incomeDonutContainer', ov.income, ov.expenses, ov.invested);

    // Upcoming Actions List
    const actionsListEl = document.getElementById('upcomingActionsList');
    if (actionsListEl) {
      if (!ov.upcomingActions || ov.upcomingActions.length === 0) {
        actionsListEl.innerHTML = `<div style="font-size:0.8rem; color:var(--text-muted); text-align:center; padding:12px;">No upcoming dues pending</div>`;
      } else {
        actionsListEl.innerHTML = ov.upcomingActions.map(act => {
          const isSip = act.type === 'sip';
          const isConfirmed = act.confirmed;
          return `
            <div class="upcoming-action-item">
              <div class="action-left-col">
                <div class="action-icon-pill ${isSip ? 'sip-type' : 'bill-type'}">
                  ${isSip ? `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                      <line x1="2" y1="10" x2="22" y2="10"></line>
                    </svg>
                  ` : `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                  `}
                </div>
                <div class="action-details">
                  <span class="action-title">${act.title}</span>
                  <span class="action-subtitle">${act.subtitle}</span>
                  <span class="action-amount-due">${Store.formatINR(act.amount)} • ${act.dueDate}</span>
                </div>
              </div>
              <div>
                ${isConfirmed ? `
                  <button class="btn-confirm-action confirmed-state" disabled>
                    ✓ Done
                  </button>
                ` : (isSip ? `
                  <button class="btn-confirm-action" onclick="app.confirmAction('${act.id}', '${act.type}')">
                    Confirm
                  </button>
                ` : `
                  <button class="btn-outline-action" onclick="app.confirmAction('${act.id}', '${act.type}')">
                    Mark Paid
                  </button>
                `)}
              </div>
            </div>
          `;
        }).join('');
      }
    }
  }

  // ----------------------------------------------------
  // 2. SPENDING SCREEN RENDER (With Edit & Delete)
  // ----------------------------------------------------
  renderSpending() {
    const s = this.store.state;
    const sp = s.spending;

    // Monthly Fixed Income & Discretionary Budget Calculation
    const totalFixed = (sp.fixedExpenses || []).reduce((acc, f) => acc + (Number(f.amount) || 0), 0);
    const discretionary = Math.max(0, s.user.monthlyIncome - totalFixed);

    const fixedIncomeEl = document.getElementById('spendingFixedIncomeDisplay');
    if (fixedIncomeEl) fixedIncomeEl.textContent = Store.formatINR(s.user.monthlyIncome);

    const totalFixedEl = document.getElementById('spendingTotalFixedExpenses');
    if (totalFixedEl) totalFixedEl.textContent = Store.formatINR(totalFixed);

    const discBudgetEl = document.getElementById('spendingDiscretionaryBudget');
    if (discBudgetEl) {
      discBudgetEl.textContent = Store.formatINR(discretionary);
      discBudgetEl.className = discretionary > 0 ? 'inflow-stat-val success' : 'inflow-stat-val warning';
    }

    // Month Selector
    const monthEl = document.getElementById('spendingMonthText');
    if (monthEl) monthEl.textContent = s.selectedMonth;

    // Total Expenses Display
    const totalExpEl = document.getElementById('spendingTotalNumber');
    if (totalExpEl) totalExpEl.textContent = Store.formatINR(sp.totalExpenses);

    const prevExpEl = document.getElementById('spendingPrevMonthText');
    if (prevExpEl) prevExpEl.textContent = `vs. last month (${Store.formatINR(sp.lastMonthExpenses)})`;

    const growthEl = document.getElementById('spendingGrowthPercent');
    if (growthEl) growthEl.innerHTML = `↑ ${sp.growthPercent}%`;

    // Sub-tab toggling
    const catContainer = document.getElementById('spendingCategoryListContainer');
    const txContainer = document.getElementById('spendingTxListContainer');

    if (catContainer && txContainer) {
      if (this.spendingSubTab === 'category') {
        catContainer.style.display = 'block';
        txContainer.style.display = 'none';

        // 1. Category Header with Set Budgets Action
        const headerHtml = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <div>
              <span style="font-size:0.82rem; font-weight:700; color:var(--text-secondary); text-transform:uppercase;">Category Limits & Spending</span>
            </div>
            <button class="btn-budget-adjust" onclick="app.openSetBudgetsModal()">⚙️ Set Budgets</button>
          </div>
        `;

        // 2. Over-Budget Alert Banner (if any category crosses its allocated limit)
        let alertHtml = '';
        if (sp.overBudgetCategories && sp.overBudgetCategories.length > 0) {
          const count = sp.overBudgetCategories.length;
          alertHtml = `
            <div class="category-budget-alert-banner">
              <div class="cat-alert-left">
                <span class="cat-alert-icon">⚠️</span>
                <div class="cat-alert-text">
                  <strong>${count === 1 ? 'Category Over Budget!' : `${count} Categories Over Budget!`}</strong>
                  <div>${sp.overBudgetCategories.map(c => `<strong>${c.name}</strong> exceeded monthly limit by ${Store.formatINR(c.overAmount)} (${c.budgetPercent}% used)`).join(' • ')}</div>
                </div>
              </div>
              <button class="btn-budget-adjust" style="background:#fee2e2; border-color:#fca5a5; color:#991b1b;" onclick="${count === 1 ? `app.openSingleCategoryBudgetModal('${sp.overBudgetCategories[0].id}')` : `app.openSetBudgetsModal()`}">Adjust</button>
            </div>
          `;
        }

        // 3. Render categories with limit meters and status pills
        const rowsHtml = sp.categories.map(cat => {
          let statusPill = '';
          let trackClass = 'ok';
          if (cat.isOverBudget) {
            statusPill = `<span class="cat-budget-pill over">⚠️ Over by ${Store.formatINR(cat.overAmount)}</span>`;
            trackClass = 'over';
          } else if (cat.budgetPercent >= 85) {
            statusPill = `<span class="cat-budget-pill warn">Near Limit (${cat.budgetPercent}%)</span>`;
            trackClass = 'warn';
          } else {
            statusPill = `<span class="cat-budget-pill ok">${cat.budgetPercent}% of ₹${cat.budget ? cat.budget.toLocaleString('en-IN') : '0'}</span>`;
            trackClass = 'ok';
          }

          return `
            <div class="category-row-item">
              <div class="category-left-wrap" onclick="app.filterExpensesByCategory('${cat.name}')">
                <div class="category-icon-bubble">
                  ${this.getCategoryIconSVG(cat.id)}
                </div>
                <div class="category-info-wrap">
                  <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                    <span class="category-row-title">${cat.name}</span>
                    ${statusPill}
                  </div>
                  <div class="category-progress-track">
                    <div class="category-progress-fill ${trackClass}" style="width: ${Math.min(100, cat.budgetPercent)}%;"></div>
                  </div>
                </div>
              </div>
              <div class="category-right-wrap">
                <div class="category-numbers" onclick="event.stopPropagation(); app.openSingleCategoryBudgetModal('${cat.id}')" title="Click to allot budget for ${cat.name}" style="cursor:pointer;">
                  <span class="category-amount-val">${Store.formatINR(cat.amount)}</span>
                  <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">Limit: <strong style="color:var(--brand-green); text-decoration:underline;">${Store.formatINR(cat.budget)}</strong> ✏️</div>
                </div>
                <button class="btn-mini-edit" style="font-size:0.68rem; padding:3px 8px; font-weight:600;" onclick="event.stopPropagation(); app.openSingleCategoryBudgetModal('${cat.id}')">Allot Limit</button>
              </div>
            </div>
          `;
        }).join('');

        catContainer.innerHTML = headerHtml + alertHtml + rowsHtml;
      } else {
        catContainer.style.display = 'none';
        txContainer.style.display = 'block';

        if (sp.transactions.length === 0) {
          txContainer.innerHTML = `
            <div class="app-card" style="text-align:center; padding:24px 16px;">
              <p style="font-size:0.88rem; color:var(--text-secondary); margin-bottom:12px;">No expenses logged yet.</p>
              <button class="btn-action-primary" style="padding:8px 18px; font-size:0.82rem;" onclick="app.openAddExpenseModal('paid')">+ Log Paid Expense</button>
            </div>
          `;
        } else {
          // Render transactions list WITH EDIT AND DELETE BUTTONS
          txContainer.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <span style="font-size:0.82rem; font-weight:700; color:var(--text-secondary); text-transform:uppercase;">Logged Expenses (${sp.transactions.length})</span>
              <button class="card-action-link" style="background:none; border:none;" onclick="app.openAddExpenseModal('paid')">+ Quick Add</button>
            </div>
            <div class="app-card" style="padding:8px 16px;">
              ${sp.transactions.map(tx => `
                <div class="transaction-item">
                  <div class="tx-left">
                    <div class="tx-icon-pill">
                      ${this.getCategoryIconSVG(tx.category.toLowerCase().split(' ')[0])}
                    </div>
                    <div class="tx-details">
                      <span class="tx-title">${tx.title}</span>
                      <span class="tx-meta">${tx.category} • ${Store.formatDateDisplay(tx.date)} • ${tx.mode}</span>
                      <div class="item-actions-row">
                        <button class="btn-mini-edit" onclick="app.openEditExpense('${tx.id}')">✏️ Edit</button>
                        <button class="btn-mini-delete" onclick="app.deleteExpense('${tx.id}')">🗑️ Delete</button>
                      </div>
                    </div>
                  </div>
                  <span class="tx-amount">- ${Store.formatINR(tx.amount)}</span>
                </div>
              `).join('')}
            </div>
          `;
        }
      }
    }

    // Fixed Expenses List
    const fixedListEl = document.getElementById('fixedExpensesList');
    if (fixedListEl) {
      if (!sp.fixedExpenses || sp.fixedExpenses.length === 0) {
        fixedListEl.innerHTML = `
          <div style="text-align:center; padding:18px 8px; color:var(--text-secondary); font-size:0.84rem;">
            No recurring fixed expenses logged yet.
            <div style="margin-top:8px;">
              <button class="inflow-manage-btn" onclick="openModal('addFixedExpenseModal')">+ Add Fixed Expense</button>
            </div>
          </div>
        `;
      } else {
        fixedListEl.innerHTML = sp.fixedExpenses.map(item => `
          <div class="fixed-item-row">
            <div class="action-left-col">
              <div class="category-icon-bubble" style="background:#f5efe4; color:#685844;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
              <div class="action-details">
                <span class="action-title">${item.name}</span>
                <span class="action-subtitle">${item.category} • ${item.recurrence}</span>
                <div class="item-actions-row">
                  <button class="btn-mini-edit" onclick="app.openEditFixedExpense('${item.id}')">✏️ Edit</button>
                  <button class="btn-mini-delete" onclick="app.deleteFixedExpense('${item.id}')">🗑️ Delete</button>
                </div>
              </div>
            </div>
            <span class="tx-amount" style="font-size:0.92rem; font-weight:700; color:var(--text-primary);">${Store.formatINR(item.amount)}</span>
          </div>
        `).join('');
      }
    }

    // Manage Fixed Modal Container
    const manageFixedContainer = document.getElementById('manageFixedListContainer');
    if (manageFixedContainer) {
      if (!sp.fixedExpenses || sp.fixedExpenses.length === 0) {
        manageFixedContainer.innerHTML = `<div style="text-align:center; padding:16px; font-size:0.85rem; color:var(--text-muted);">No fixed expenses found. Click "+ Add Bill" above.</div>`;
      } else {
        manageFixedContainer.innerHTML = sp.fixedExpenses.map(item => `
          <div class="income-source-item">
            <div class="income-source-left">
              <span class="income-source-title">${item.name}</span>
              <span class="income-source-type-pill">${item.category} • ${item.recurrence}</span>
            </div>
            <div class="income-source-right">
              <span class="income-source-amount" style="color:var(--text-primary);">${Store.formatINR(item.amount)}</span>
              <div class="item-actions-row">
                <button class="btn-mini-edit" onclick="app.openEditFixedExpense('${item.id}')">✏️ Edit</button>
                <button class="btn-mini-delete" onclick="app.deleteFixedExpense('${item.id}')">🗑️ Delete</button>
              </div>
            </div>
          </div>
        `).join('');
      }
    }

    // Upcoming Expenses List with Real-Time Due Calculation
    const upcomingExpEl = document.getElementById('upcomingExpensesList');
    if (upcomingExpEl) {
      if (!sp.upcomingExpenses || sp.upcomingExpenses.length === 0) {
        upcomingExpEl.innerHTML = `
          <div style="text-align:center; padding:18px 8px; color:var(--text-secondary); font-size:0.84rem;">
            No upcoming bills scheduled.
            <div style="margin-top:8px;">
              <button class="inflow-manage-btn" onclick="app.openAddExpenseModal('upcoming')">+ Schedule Upcoming Bill</button>
            </div>
          </div>
        `;
      } else {
        upcomingExpEl.innerHTML = sp.upcomingExpenses.map(up => {
          const diff = Store.getDaysDifference(up.dueDate);
          return `
            <div class="upcoming-action-item">
              <div class="action-left-col">
                <div class="action-icon-pill bill-type" style="${diff.isUrgent ? 'background:#fef2f2; color:#dc2626;' : ''}">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <div class="action-details">
                  <span class="action-title">${up.name}</span>
                  <span class="action-subtitle">Due ${Store.formatDateDisplay(up.dueDate)} • <strong style="color:${diff.badgeColor}">${diff.label}</strong></span>
                  <span class="action-amount-due">${Store.formatINR(up.amount)}</span>
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:6px;">
                <button class="btn-outline-action" onclick="app.payUpcomingBill('${up.id}', '${up.name}', ${up.amount})">
                  Pay Now
                </button>
                <button class="btn-mini-delete" style="padding:5px 8px;" onclick="app.deleteUpcomingBill('${up.id}', '${up.name}')" title="Delete bill">
                  🗑️
                </button>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  }

  // ----------------------------------------------------
  // 3. INVESTMENTS SCREEN RENDER (With Pie Chart & Filter)
  // ----------------------------------------------------
  renderInvestments() {
    const s = this.store.state;
    const inv = s.investments;

    // Total Portfolio Value
    const totalPortEl = document.getElementById('investmentsTotalValue');
    if (totalPortEl) totalPortEl.textContent = Store.formatINR(inv.totalPortfolioValue);

    const gainEl = document.getElementById('investmentsGainBadge');
    if (gainEl) gainEl.innerHTML = `▲ ${inv.gainPercent}%`;

    const gainAmountEl = document.getElementById('investmentsGainAmount');
    if (gainAmountEl) gainAmountEl.textContent = `+${Store.formatINR(inv.gainAmount)} (${inv.period})`;

    const asOfEl = document.getElementById('investmentsAsOfTag');
    if (asOfEl) asOfEl.textContent = `As of ${inv.asOfDate}`;

    // Sparkline Chart
    ChartRenderer.renderSparkline('investmentsSparklineContainer', [577000, 582000, 595000, 608000, 614000, 632000, inv.totalPortfolioValue]);

    // Sub-tab toggling
    const holdingsContainer = document.getElementById('invHoldingsContainer');
    const sipsContainer = document.getElementById('invSIPsContainer');
    const txContainer = document.getElementById('invTxContainer');

    if (holdingsContainer && sipsContainer && txContainer) {
      if (this.investmentsSubTab === 'holdings') {
        holdingsContainer.style.display = 'block';
        sipsContainer.style.display = 'none';
        txContainer.style.display = 'none';

        // 1. Asset Allocation Donut Chart
        ChartRenderer.renderAssetDonut('investmentAssetDonutContainer', inv.assetClasses, inv.totalPortfolioValue);

        // 2. Update filter pills active state
        document.querySelectorAll('#investmentFilterPills .filter-pill-btn').forEach(btn => {
          btn.classList.toggle('active', btn.getAttribute('data-filter') === this.investmentFilter);
        });

        // 3. Asset Classes Cards (Clickable filter)
        const assetClassList = document.getElementById('assetClassList');
        if (assetClassList) {
          assetClassList.innerHTML = inv.assetClasses.map(ac => {
            const isActive = this.investmentFilter === ac.id;
            return `
              <div class="asset-class-item ${isActive ? 'active-filter' : ''}" onclick="app.setInvestmentFilter('${ac.id}')" title="Click to view only ${ac.name}">
                <div class="asset-left">
                  <div class="asset-icon-box" style="background:${ac.bg}; color:${ac.color};">
                    ${this.getAssetIconSVG(ac.id)}
                  </div>
                  <div>
                    <span class="asset-name">${ac.name}</span>
                    <div style="font-size:0.72rem; color:var(--text-secondary);">${isActive ? '● Currently viewing' : 'Tap to filter'}</div>
                  </div>
                </div>
                <div class="asset-right">
                  <div class="asset-val">${Store.formatINR(ac.amount)}</div>
                  <div class="asset-pct">${ac.percent}% of portfolio</div>
                </div>
              </div>
            `;
          }).join('');
        }

        // 4. Top Holdings Section (Filtered by active filter + Redeem/Edit/Delete)
        const headerTitleEl = document.getElementById('holdingsListHeaderTitle');
        if (headerTitleEl) {
          if (this.investmentFilter === 'mf') headerTitleEl.textContent = 'Mutual Funds Holdings';
          else if (this.investmentFilter === 'eq') headerTitleEl.textContent = 'Equities Holdings';
          else if (this.investmentFilter === 'ot') headerTitleEl.textContent = 'Others / FDs / Gold Holdings';
          else headerTitleEl.textContent = 'All Holdings';
        }

        const filteredHoldings = inv.topHoldings.filter(h => {
          if (this.investmentFilter === 'all') return true;
          return h.assetClassId === this.investmentFilter;
        });

        const topHoldingsList = document.getElementById('topHoldingsList');
        if (topHoldingsList) {
          if (filteredHoldings.length === 0) {
            topHoldingsList.innerHTML = `
              <div style="text-align:center; padding:18px 12px; color:var(--text-muted); font-size:0.84rem;">
                No holdings found in this category.
                <div style="margin-top:8px;">
                  <button class="btn-action-primary" style="padding:6px 14px; font-size:0.78rem;" onclick="openModal('addInvestmentModal')">+ Add Investment</button>
                </div>
              </div>
            `;
          } else {
            topHoldingsList.innerHTML = filteredHoldings.map(h => `
              <div class="holding-item-row">
                <div class="holding-badge-avatar" style="background:${h.badgeBg};">
                  ${h.badgeLetter}
                </div>
                <div class="holding-info">
                  <span class="holding-name">${h.name}</span>
                  <span class="holding-sub">${h.sub}</span>
                  <div class="item-actions-row">
                    <button class="btn-mini-redeem" onclick="app.openRedeemHolding('${h.id}')">💸 Redeem</button>
                    <button class="btn-mini-edit" onclick="app.openEditHolding('${h.id}')">✏️ Edit</button>
                    <button class="btn-mini-delete" onclick="app.deleteHolding('${h.id}')">🗑️ Delete</button>
                  </div>
                </div>
                <div class="holding-val-col">
                  <div class="holding-total-val">${Store.formatINR(h.value)}</div>
                  <div class="holding-gain-badge">
                    ▲ ${h.gainPercent}%
                  </div>
                </div>
              </div>
            `).join('');
          }
        }
      } else if (this.investmentsSubTab === 'sips') {
        holdingsContainer.style.display = 'none';
        sipsContainer.style.display = 'block';
        txContainer.style.display = 'none';

        sipsContainer.innerHTML = `
          <div class="app-card">
            <div class="card-heading-row">
              <span class="card-title">Active SIP Schedules</span>
              <button class="btn-confirm-action" style="padding:4px 12px; font-size:0.75rem;" onclick="openModal('addSipModal')">+ New SIP</button>
            </div>
            ${inv.sips.map(sip => `
              <div class="upcoming-action-item">
                <div class="action-left-col">
                  <div class="action-icon-pill sip-type">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                      <polyline points="17 6 23 6 23 12"></polyline>
                    </svg>
                  </div>
                  <div class="action-details">
                    <span class="action-title">${sip.fundName}</span>
                    <span class="action-subtitle">${sip.cycleDate} • Goal: <strong>${sip.linkedGoal}</strong></span>
                    <span class="action-amount-due">${Store.formatINR(sip.amount)} / month</span>
                  </div>
                </div>
                <div style="text-align:right;">
                  <span class="status-pill on-track">${sip.status}</span>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        // Transactions / Redemptions
        holdingsContainer.style.display = 'none';
        sipsContainer.style.display = 'none';
        txContainer.style.display = 'block';

        txContainer.innerHTML = `
          <div class="app-card">
            <div class="card-heading-row">
              <span class="card-title">Investment & Redemption History</span>
            </div>
            ${inv.history.length === 0 ? `
              <div style="text-align:center; padding:16px; color:var(--text-muted); font-size:0.85rem;">No investment transactions recorded yet.</div>
            ` : inv.history.map(item => {
              const isRedeem = item.type.toLowerCase().includes('redeem') || item.type.toLowerCase().includes('sale');
              return `
                <div class="transaction-item">
                  <div class="tx-left">
                    <div class="tx-icon-pill" style="background:${isRedeem ? '#fdf0eb' : '#eaf5ec'}; color:${isRedeem ? '#a8421b' : '#1e6d37'};">
                      ${isRedeem ? `
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                      ` : `
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                      `}
                    </div>
                    <div class="tx-details">
                      <span class="tx-title">${item.fundName}</span>
                      <span class="tx-meta">${item.type} • ${item.date} • ${item.units}</span>
                    </div>
                  </div>
                  <span class="tx-amount" style="color:${isRedeem ? '#b8552f' : '#1e6d37'}; font-weight:700;">
                    ${isRedeem ? '-' : '+'} ${Store.formatINR(item.amount)}
                  </span>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }
    }
  }

  // Filter Investment holdings
  setInvestmentFilter(filterId) {
    if (this.investmentFilter === filterId && filterId !== 'all') {
      this.investmentFilter = 'all'; // Toggle back to all
    } else {
      this.investmentFilter = filterId;
    }
    playTapSound();
    this.renderInvestments();
    showToast(`Filtering: ${this.investmentFilter.toUpperCase()}`);
  }

  // ----------------------------------------------------
  // 4. GOALS SCREEN RENDER (With Edit & Delete)
  // ----------------------------------------------------
  renderGoals() {
    const s = this.store.state;
    const goals = s.goals;

    const myGoalsSection = document.getElementById('myGoalsTabSection');
    const aiHelperSection = document.getElementById('aiGoalHelperSection');

    if (myGoalsSection && aiHelperSection) {
      if (this.goalsSubTab === 'my-goals') {
        myGoalsSection.style.display = 'block';
        aiHelperSection.style.display = 'none';

        if (goals.length === 0) {
          myGoalsSection.innerHTML = `
            <div class="app-card" style="text-align:center; padding:24px 16px;">
              <p style="font-size:0.88rem; color:var(--text-secondary); margin-bottom:12px;">No savings goals created yet.</p>
              <button class="btn-action-primary" style="padding:8px 18px; font-size:0.84rem;" onclick="openModal('addGoalModal')">+ Create Your First Goal</button>
            </div>
          `;
        } else {
          myGoalsSection.innerHTML = goals.map(g => {
            let badgeClass = 'on-track';
            if (g.statusBadge === 'needs-attention') badgeClass = 'needs-attention';
            if (g.statusBadge === 'behind-plan') badgeClass = 'behind-plan';

            let progressFillColor = '#234d3d';
            if (g.statusBadge === 'needs-attention') progressFillColor = '#d97706';
            if (g.statusBadge === 'behind-plan') progressFillColor = '#dc2626';

            return `
              <div class="goal-item-card" onclick="app.openGoalDetails('${g.id}')">
                <div class="goal-card-top">
                  <div class="goal-title-wrap">
                    <div class="goal-icon-box" style="background:${g.bg}; color:${g.color};">
                      ${this.getGoalIconSVG(g.icon)}
                    </div>
                    <div>
                      <span class="goal-name-text">${g.title}</span>
                      <div class="goal-target-val">${Store.formatINR(g.targetAmount)}</div>
                    </div>
                  </div>
                  <span class="status-pill ${badgeClass}">${g.status}</span>
                </div>
                <div class="goal-progress-bar-bg">
                  <div class="goal-progress-fill" style="width: ${g.percent}%; background-color: ${progressFillColor};"></div>
                </div>
                <div class="goal-card-bottom">
                  <span class="goal-current-saved">${Store.formatINR(g.currentAmount)} saved</span>
                  <span class="goal-percent-txt">${g.percent}%</span>
                </div>
              </div>
            `;
          }).join('');
        }
      } else {
        myGoalsSection.style.display = 'none';
        aiHelperSection.style.display = 'block';
        this.runAICalculation();
      }
    }
  }

  // ----------------------------------------------------
  // 5. PROFILE SCREEN RENDER (With Dynamic Age & All Fields)
  // ----------------------------------------------------
  renderProfile() {
    const u = this.store.state.user;

    const nameEl = document.getElementById('profileUserName');
    if (nameEl) nameEl.textContent = u.fullName;

    const subEl = document.getElementById('profileUserSub');
    if (subEl) subEl.textContent = `${u.age} yrs • ${u.city}`;

    const emailEl = document.getElementById('profileUserEmail');
    if (emailEl) emailEl.textContent = u.email;

    // Financial Profile Details
    const incEl = document.getElementById('profileMonthlyIncome');
    if (incEl) incEl.textContent = Store.formatINR(u.monthlyIncome);

    const empEl = document.getElementById('profileEmployment');
    if (empEl) empEl.textContent = `${u.employment} • ${u.role}`;

    const riskEl = document.getElementById('profileRisk');
    if (riskEl) riskEl.textContent = u.riskProfile;

    const prefEl = document.getElementById('profilePref');
    if (prefEl) prefEl.textContent = u.investmentPreference;

    const taxEl = document.getElementById('profileTaxRegime');
    if (taxEl) taxEl.textContent = u.taxRegime;

    // Personal Details
    const fullNameEl = document.getElementById('profileFullName');
    if (fullNameEl) fullNameEl.textContent = u.fullName;

    const dobEl = document.getElementById('profileDOB');
    if (dobEl) dobEl.textContent = `${Store.formatDateDisplay(u.dob)} (Age: ${u.age} yrs)`;

    const phoneEl = document.getElementById('profilePhone');
    if (phoneEl) phoneEl.textContent = u.phone;

    const emailDisplayEl = document.getElementById('profileEmailDisplay');
    if (emailDisplayEl) emailDisplayEl.textContent = u.email;

    const panEl = document.getElementById('profilePAN');
    if (panEl) panEl.textContent = `${u.pan} (KYC ${u.kycStatus})`;

    // Account & Persistence Status Details
    const accNameEl = document.getElementById('profileActiveAccountName');
    if (accNameEl) accNameEl.textContent = u.fullName;

    const accEmailEl = document.getElementById('profileActiveAccountEmail');
    if (accEmailEl) accEmailEl.textContent = u.email || u.phone;

    const accTypePill = document.getElementById('profileAccountTypePill');
    if (accTypePill) {
      const isDemo = window.authManager && window.authManager.getActiveUser() && window.authManager.getActiveUser().isDemo;
      accTypePill.textContent = isDemo ? 'Demo Account' : 'Personal Verified Account';
      accTypePill.style.background = isDemo ? '#fef3d6' : '#eaf5ec';
      accTypePill.style.color = isDemo ? '#b45309' : '#1e6d37';
    }
  }

  // Dynamic Age calculation preview for DOB input
  updateDOBAgePreview(dobVal) {
    const age = Store.calculateAge(dobVal);
    const tag = document.getElementById('personalAgePreviewTag');
    if (tag) {
      tag.textContent = `Calculated Age: ${age} years`;
    }
  }

  // ----------------------------------------------------
  // EXPENSE CRUD HANDLERS
  // ----------------------------------------------------
  openEditExpense(txId) {
    const tx = this.store.state.spending.transactions.find(t => t.id === txId);
    if (!tx) return;

    document.getElementById('editExpenseId').value = tx.id;
    document.getElementById('editExpenseTitleInput').value = tx.title;
    document.getElementById('editExpenseAmountInput').value = tx.amount;
    document.getElementById('editExpenseCategorySelect').value = tx.category;
    document.getElementById('editExpenseModeSelect').value = tx.mode;
    document.getElementById('editExpenseDateInput').value = tx.date;

    openModal('editExpenseModal');
  }

  deleteExpense(txId) {
    const tx = this.store.state.spending.transactions.find(t => t.id === txId);
    if (!tx) return;

    if (confirm(`Are you sure you want to delete "${tx.title}" of ${Store.formatINR(tx.amount)}?`)) {
      this.store.deleteExpense(txId);
      showToast('Expense deleted and budget updated');
    }
  }

  openAddExpenseModal(type = 'paid') {
    openModal('addExpenseModal');
    this.setExpenseType(type);
  }

  setExpenseType(type = 'paid') {
    const hiddenTypeInput = document.getElementById('expenseTypeInput');
    const btnPaid = document.getElementById('btnTypePaid');
    const btnUpcoming = document.getElementById('btnTypeUpcoming');
    const modeGroup = document.getElementById('expenseModeGroup');
    const titleLabel = document.getElementById('expenseTitleLabel');
    const dateLabel = document.getElementById('expenseDateLabel');
    const submitBtn = document.getElementById('addExpenseSubmitBtn');
    const modalTitle = document.getElementById('addExpenseModalTitle');
    const modalSub = document.getElementById('addExpenseModalSub');
    const dateInput = document.getElementById('expenseDateInput');

    if (hiddenTypeInput) hiddenTypeInput.value = type;

    if (type === 'paid') {
      if (btnPaid) btnPaid.classList.add('active');
      if (btnUpcoming) btnUpcoming.classList.remove('active');
      if (modeGroup) modeGroup.style.display = 'block';
      if (titleLabel) titleLabel.textContent = 'Expense Title';
      if (dateLabel) dateLabel.textContent = 'Payment Date';
      if (submitBtn) submitBtn.textContent = 'Record Paid Expense';
      if (modalTitle) modalTitle.textContent = 'Log Paid Expense';
      if (modalSub) modalSub.textContent = 'Record an immediate expense deducted from balance';
    } else {
      if (btnPaid) btnPaid.classList.remove('active');
      if (btnUpcoming) btnUpcoming.classList.add('active');
      if (modeGroup) modeGroup.style.display = 'none';
      if (titleLabel) titleLabel.textContent = 'Bill / Due Name';
      if (dateLabel) dateLabel.textContent = 'Due Date';
      if (submitBtn) submitBtn.textContent = 'Schedule Upcoming Bill';
      if (modalTitle) modalTitle.textContent = 'Add Upcoming Bill / Due';
      if (modalSub) modalSub.textContent = 'Schedule a future due with real-time countdown alerts';
    }

    if (dateInput && !dateInput.value) {
      dateInput.value = Store.getRealTimeNow().isoToday;
    }
  }

  openSingleCategoryBudgetModal(catId) {
    const s = this.store.state;
    const cat = s.spending.categories.find(c => 
      c.id === catId || 
      c.id.toLowerCase() === (catId || '').toLowerCase() || 
      c.name.toLowerCase() === (catId || '').toLowerCase()
    );
    if (!cat) return;

    const modal = document.getElementById('singleCategoryBudgetModal');
    if (!modal) return;

    document.getElementById('singleCatIdInput').value = cat.id;
    document.getElementById('singleCatModalTitle').textContent = `Allot Budget: ${cat.name}`;
    document.getElementById('singleCatName').textContent = cat.name;
    document.getElementById('singleCatCurrentSpend').textContent = `Spent this month: ${Store.formatINR(cat.spent || cat.amount || 0)}`;

    const iconBubble = document.getElementById('singleCatIconBubble');
    if (iconBubble) {
      iconBubble.innerHTML = this.getCategoryIconSVG(cat.id);
    }

    const statusPill = document.getElementById('singleCatStatusPill');
    if (statusPill) {
      if (cat.isOverBudget) {
        statusPill.className = 'cat-budget-pill over';
        statusPill.textContent = `⚠️ Over by ${Store.formatINR(cat.overAmount)}`;
      } else if (cat.budgetPercent >= 85) {
        statusPill.className = 'cat-budget-pill warn';
        statusPill.textContent = `Near Limit (${cat.budgetPercent}% used)`;
      } else {
        statusPill.className = 'cat-budget-pill ok';
        statusPill.textContent = `On Track (${cat.budgetPercent}% used)`;
      }
    }

    const budgetInput = document.getElementById('singleCatBudgetInput');
    if (budgetInput) {
      budgetInput.value = cat.budget || 0;
    }

    // Render Quick presets chips
    const chipsContainer = document.getElementById('singleCatPresetChips');
    if (chipsContainer) {
      const curSpend = cat.spent || cat.amount || 0;
      const presets = [
        { label: `Match Spent (${Store.formatINR(curSpend)})`, val: Math.max(1000, Math.ceil(curSpend / 500) * 500) },
        { label: `₹3,000`, val: 3000 },
        { label: `₹5,000`, val: 5000 },
        { label: `₹8,000`, val: 8000 },
        { label: `₹10,000`, val: 10000 },
        { label: `₹15,000`, val: 15000 }
      ];

      chipsContainer.innerHTML = presets.map(p => `
        <button type="button" class="filter-pill-btn" style="padding:5px 12px; font-size:0.75rem; border-radius:16px;" onclick="document.getElementById('singleCatBudgetInput').value='${p.val}'; document.getElementById('singleCatBudgetInput').focus();">
          ${p.label}
        </button>
      `).join('');
    }

    openModal('singleCategoryBudgetModal');

    setTimeout(() => {
      if (budgetInput) {
        budgetInput.focus();
        budgetInput.select();
      }
    }, 150);
  }

  openSetBudgetsModal(focusCatId = null) {
    const s = this.store.state;
    const cats = s.spending.categories || [];
    const container = document.getElementById('categoryBudgetInputsContainer');
    const incomeDisplay = document.getElementById('budgetModalIncomeDisplay');
    const allocatedBadge = document.getElementById('budgetModalTotalAllocatedBadge');

    let totalAllocated = 0;
    cats.forEach(c => {
      totalAllocated += Number(c.budget || 0);
    });

    const income = s.user.monthlyIncome || 0;
    if (incomeDisplay) {
      incomeDisplay.textContent = Store.formatINR(income);
    }
    if (allocatedBadge) {
      const pct = income > 0 ? Math.round((totalAllocated / income) * 100) : 0;
      allocatedBadge.textContent = `Total Budget: ${Store.formatINR(totalAllocated)} (${pct}%)`;
      if (totalAllocated > income) {
        allocatedBadge.className = 'status-pill behind-plan';
      } else {
        allocatedBadge.className = 'status-pill on-track';
      }
    }

    if (container) {
      container.innerHTML = cats.map(c => `
        <div style="background:var(--bg-card); padding:10px 12px; border-radius:12px; border:1px solid var(--border-color); ${focusCatId === c.id ? 'border-color:var(--brand-gold); box-shadow:0 0 0 2px rgba(184,134,11,0.2);' : ''}">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <div class="category-icon-bubble" style="width:34px; height:34px; min-width:34px; display:flex; align-items:center; justify-content:center; background:#fcf0eb; color:#d46b43; border-radius:8px;">
                ${this.getCategoryIconSVG(c.id)}
              </div>
              <div>
                <strong style="font-size:0.86rem; color:var(--text-primary);">${c.name}</strong>
                <div style="font-size:0.72rem; color:var(--text-secondary);">Spent this month: ${Store.formatINR(c.amount || c.spent || 0)}</div>
              </div>
            </div>
            <span class="cat-budget-pill ${c.isOverBudget ? 'over' : 'ok'}">${c.isOverBudget ? 'Over Limit' : 'On Track'}</span>
          </div>
          <div class="input-with-currency">
            <input type="number" class="input-control category-budget-input" data-cat-id="${c.id}" value="${c.budget || 0}" min="0" step="500" placeholder="Monthly Limit (₹)" required>
          </div>
        </div>
      `).join('');

      const updateAllocatedSum = () => {
        let sum = 0;
        container.querySelectorAll('.category-budget-input').forEach(inp => {
          sum += Number(inp.value) || 0;
        });
        if (allocatedBadge) {
          const pct = income > 0 ? Math.round((sum / income) * 100) : 0;
          allocatedBadge.textContent = `Total Budget: ${Store.formatINR(sum)} (${pct}%)`;
          if (sum > income) {
            allocatedBadge.className = 'status-pill behind-plan';
          } else {
            allocatedBadge.className = 'status-pill on-track';
          }
        }
      };

      container.querySelectorAll('.category-budget-input').forEach(inp => {
        inp.addEventListener('input', updateAllocatedSum);
      });

      if (focusCatId) {
        setTimeout(() => {
          const targetInput = container.querySelector(`input[data-cat-id="${focusCatId}"]`);
          if (targetInput) {
            targetInput.focus();
            targetInput.select();
          }
        }, 150);
      }
    }

    openModal('setBudgetsModal');
  }

  deleteUpcomingBill(billId, name) {
    if (confirm(`Remove upcoming bill "${name}"?`)) {
      this.store.deleteUpcomingExpense(billId);
      showToast(`Removed bill: ${name}`);
    }
  }

  // ----------------------------------------------------
  // FIXED EXPENSES CRUD HANDLERS
  // ----------------------------------------------------
  openEditFixedExpense(fixId) {
    const fix = this.store.state.spending.fixedExpenses.find(f => f.id === fixId);
    if (!fix) return;

    document.getElementById('editFixId').value = fix.id;
    document.getElementById('editFixNameInput').value = fix.name;
    document.getElementById('editFixAmountInput').value = fix.amount;
    document.getElementById('editFixRecurrenceSelect').value = fix.recurrence || '1st every month';
    document.getElementById('editFixCategorySelect').value = fix.category || 'Utilities';

    const deleteBtn = document.getElementById('deleteFixBtn');
    if (deleteBtn) {
      deleteBtn.onclick = () => this.deleteFixedExpense(fix.id);
    }

    openModal('editFixedExpenseModal');
  }

  deleteFixedExpense(fixId) {
    const fix = this.store.state.spending.fixedExpenses.find(f => f.id === fixId);
    if (!fix) return;

    if (confirm(`Delete recurring fixed expense "${fix.name}" of ${Store.formatINR(fix.amount)}?`)) {
      this.store.deleteFixedExpense(fixId);
      closeModal();
      showToast(`Removed recurring bill "${fix.name}"`);
    }
  }

  // ----------------------------------------------------
  // INCOME SOURCES RENDER & CRUD HANDLERS
  // ----------------------------------------------------
  renderIncomeSources() {
    const s = this.store.state;
    const sources = s.user.incomeSources || [];

    const quickInput = document.getElementById('quickIncomeInput');
    if (quickInput) quickInput.value = s.user.monthlyIncome || '';

    const countBadge = document.getElementById('incomeSourcesCountBadge');
    if (countBadge) {
      countBadge.textContent = `${sources.length} ${sources.length === 1 ? 'Source' : 'Sources'} (Total ${Store.formatINR(s.user.monthlyIncome)})`;
    }

    const container = document.getElementById('incomeSourcesListContainer');
    if (container) {
      if (sources.length === 0) {
        container.innerHTML = `
          <div style="text-align:center; padding:16px; color:var(--text-muted); font-size:0.85rem;">
            No custom income sources added yet. Set your monthly income above or add a source below.
          </div>
        `;
      } else {
        container.innerHTML = sources.map(inc => `
          <div class="income-source-item">
            <div class="income-source-left">
              <span class="income-source-title">${inc.title}</span>
              <span class="income-source-type-pill">${inc.type || 'Fixed Income'} • ${inc.frequency || 'Monthly'}</span>
            </div>
            <div class="income-source-right">
              <span class="income-source-amount">${Store.formatINR(inc.amount)}</span>
              <div class="item-actions-row">
                <button class="btn-mini-edit" onclick="app.openEditIncome('${inc.id}')">✏️ Edit</button>
                <button class="btn-mini-delete" onclick="app.deleteIncome('${inc.id}')">🗑️ Delete</button>
              </div>
            </div>
          </div>
        `).join('');
      }
    }
  }

  openEditIncome(incId) {
    const inc = (this.store.state.user.incomeSources || []).find(i => i.id === incId);
    if (!inc) return;

    document.getElementById('editIncomeId').value = inc.id;
    document.getElementById('editIncomeTitleInput').value = inc.title;
    document.getElementById('editIncomeAmountInput').value = inc.amount;
    document.getElementById('editIncomeTypeSelect').value = inc.type || 'Fixed Salary';

    const deleteBtn = document.getElementById('deleteIncomeBtn');
    if (deleteBtn) {
      deleteBtn.onclick = () => this.deleteIncome(inc.id);
    }

    openModal('editIncomeModal');
  }

  deleteIncome(incId) {
    const inc = (this.store.state.user.incomeSources || []).find(i => i.id === incId);
    if (!inc) return;

    if (confirm(`Delete income source "${inc.title}" of ${Store.formatINR(inc.amount)}?`)) {
      this.store.deleteIncomeSource(incId);
      closeModal();
      showToast(`Removed income source "${inc.title}"`);
    }
  }

  // ----------------------------------------------------
  // INVESTMENT CRUD & REDEMPTION HANDLERS
  // ----------------------------------------------------
  openRedeemHolding(hldId) {
    const h = this.store.state.investments.topHoldings.find(item => item.id === hldId);
    if (!h) return;

    document.getElementById('redeemHoldingId').value = h.id;
    document.getElementById('redeemHoldingNameDisplay').textContent = h.name;
    document.getElementById('redeemHoldingBalanceDisplay').textContent = Store.formatINR(h.value);
    document.getElementById('redeemAmountInput').value = h.value;
    document.getElementById('redeemAmountInput').max = h.value;
    document.getElementById('redeemDateInput').value = new Date().toISOString().split('T')[0];

    openModal('redeemHoldingModal');
  }

  openEditHolding(hldId) {
    const h = this.store.state.investments.topHoldings.find(item => item.id === hldId);
    if (!h) return;

    document.getElementById('editHoldingId').value = h.id;
    document.getElementById('editHoldingNameInput').value = h.name;
    document.getElementById('editHoldingTypeSelect').value = h.type;
    document.getElementById('editHoldingValueInput').value = h.value;
    document.getElementById('editHoldingGainInput').value = h.gainPercent;

    openModal('editHoldingModal');
  }

  deleteHolding(hldId) {
    const h = this.store.state.investments.topHoldings.find(item => item.id === hldId);
    if (!h) return;

    if (confirm(`Are you sure you want to delete investment "${h.name}" of ${Store.formatINR(h.value)}?`)) {
      this.store.deleteHolding(hldId);
      showToast('Investment removed & portfolio updated');
    }
  }

  // ----------------------------------------------------
  // GOAL CRUD HANDLERS
  // ----------------------------------------------------
  openGoalDetails(goalId) {
    this.activeGoalId = goalId;
    const goal = this.store.state.goals.find(g => g.id === goalId);
    if (!goal) return;

    const modal = document.getElementById('goalDetailsModal');
    if (!modal) return;

    document.getElementById('goalDetailTitle').textContent = goal.title;
    document.getElementById('goalDetailTarget').textContent = Store.formatINR(goal.targetAmount);
    document.getElementById('goalDetailSaved').textContent = Store.formatINR(goal.currentAmount);
    document.getElementById('goalDetailPct').textContent = `${goal.percent}% Complete`;
    document.getElementById('goalDetailVehicle').textContent = goal.linkedVehicle;
    document.getElementById('goalDetailRecSIP').textContent = `${Store.formatINR(goal.recommendedMonthlySIP)} / mo`;
    document.getElementById('goalDetailDesc').textContent = goal.description;

    const contributeBtn = document.getElementById('goalDetailContributeBtn');
    contributeBtn.onclick = () => {
      const addAmt = prompt(`Enter amount to add to ${goal.title} (₹):`, "5000");
      if (addAmt && !isNaN(addAmt) && Number(addAmt) > 0) {
        this.store.contributeToGoal(goal.id, Number(addAmt));
        closeModal();
        showToast(`Added ${Store.formatINR(addAmt)} to ${goal.title}!`);
      }
    };

    const editBtn = document.getElementById('goalDetailEditBtn');
    editBtn.onclick = () => {
      this.openEditGoal(goal.id);
    };

    const deleteBtn = document.getElementById('goalDetailDeleteBtn');
    deleteBtn.onclick = () => {
      if (confirm(`Delete goal "${goal.title}"?`)) {
        this.store.deleteGoal(goal.id);
        closeModal();
        showToast('Goal deleted');
      }
    };

    openModal('goalDetailsModal');
  }

  openEditGoal(goalId) {
    const goal = this.store.state.goals.find(g => g.id === goalId);
    if (!goal) return;

    document.getElementById('editGoalId').value = goal.id;
    document.getElementById('editGoalTitleInput').value = goal.title;
    document.getElementById('editGoalTargetInput').value = goal.targetAmount;
    document.getElementById('editGoalCurrentInput').value = goal.currentAmount;
    document.getElementById('editGoalDeadlineInput').value = goal.deadline;
    document.getElementById('editGoalVehicleInput').value = goal.linkedVehicle;

    openModal('editGoalModal');
  }

  // ----------------------------------------------------
  // PROFILE EDIT OPENERS
  // ----------------------------------------------------
  openEditPersonalDetails() {
    const u = this.store.state.user;
    document.getElementById('editPersonalName').value = u.fullName;
    document.getElementById('editPersonalDOB').value = u.dob;
    document.getElementById('editPersonalCity').value = u.city;
    document.getElementById('editPersonalPhone').value = u.phone;
    document.getElementById('editPersonalEmail').value = u.email;
    document.getElementById('editPersonalPAN').value = u.pan;
    this.updateDOBAgePreview(u.dob);

    openModal('editPersonalDetailsModal');
  }

  openEditFinancialProfile() {
    const u = this.store.state.user;
    document.getElementById('editFinancialIncome').value = u.monthlyIncome;
    document.getElementById('editFinancialEmployment').value = u.employment;
    document.getElementById('editFinancialRole').value = u.role;
    document.getElementById('editFinancialRisk').value = u.riskProfile;
    document.getElementById('editFinancialPref').value = u.investmentPreference;
    document.getElementById('editFinancialTaxRegime').value = u.taxRegime;

    openModal('editFinancialProfileModal');
  }

  // ----------------------------------------------------
  // INTERACTIVE TAB ROUTING
  // ----------------------------------------------------
  switchTab(tabName) {
    this.currentTab = tabName;
    playTapSound();

    document.querySelectorAll('.app-screen-view').forEach(screen => {
      screen.classList.remove('active-tab');
    });

    const targetScreen = document.getElementById(`tab-${tabName}`);
    if (targetScreen) {
      targetScreen.classList.add('active-tab');
    }

    document.querySelectorAll('.nav-tab-item').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-tab') === tabName) {
        btn.classList.add('active');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  switchSpendingSubTab(subTab) {
    this.spendingSubTab = subTab;
    playTapSound();
    document.querySelectorAll('#spendingSegmentTabs .segment-tab-btn').forEach(b => {
      b.classList.remove('active');
      if (b.getAttribute('data-subtab') === subTab) b.classList.add('active');
    });
    this.renderSpending();
  }

  switchInvestmentsSubTab(subTab) {
    this.investmentsSubTab = subTab;
    playTapSound();
    document.querySelectorAll('#investmentsSegmentTabs .segment-tab-btn').forEach(b => {
      b.classList.remove('active');
      if (b.getAttribute('data-subtab') === subTab) b.classList.add('active');
    });
    this.renderInvestments();
  }

  switchGoalsSubTab(subTab) {
    this.goalsSubTab = subTab;
    playTapSound();
    document.querySelectorAll('#goalsSegmentTabs .segment-tab-btn').forEach(b => {
      b.classList.remove('active');
      if (b.getAttribute('data-subtab') === subTab) b.classList.add('active');
    });
    this.renderGoals();
  }

  handleBannerClick() {
    const banner = this.store.state.overview.alertBanner;
    if (banner && banner.visible) {
      const action = this.store.state.overview.upcomingActions.find(a => a.type === 'sip');
      if (action) {
        this.confirmAction(action.id, 'sip');
      } else {
        this.store.state.overview.alertBanner.visible = false;
        this.store.saveState();
        showToast('Notification cleared');
      }
    }
  }

  confirmAction(actionId, type) {
    if (type === 'sip') {
      this.store.confirmSIP(actionId);
      showToast('SIP Investment Confirmed & Portfolio Updated!', '₹');
    } else {
      this.store.markBillPaid(actionId);
      showToast('Bill Marked as Paid!', '✓');
    }
  }

  payUpcomingBill(billId, name, amount) {
    this.store.addExpense({
      title: `${name} Payment`,
      category: 'Utilities',
      amount: amount,
      mode: 'UPI Autopay'
    });

    this.store.state.spending.upcomingExpenses = this.store.state.spending.upcomingExpenses.filter(u => u.id !== billId);
    this.store.saveState();
    showToast(`Paid ${Store.formatINR(amount)} for ${name}!`);
  }

  filterExpensesByCategory(categoryName) {
    this.spendingSubTab = 'tx';
    document.querySelectorAll('#spendingSegmentTabs .segment-tab-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-subtab') === 'tx');
    });
    this.renderSpending();
    showToast(`Showing transactions for ${categoryName}`);
  }

  // ----------------------------------------------------
  // AI GOAL HELPER CALCULATION ENGINE
  // ----------------------------------------------------
  runAICalculation() {
    const targetInput = document.getElementById('aiCalcTargetAmount');
    const monthsInput = document.getElementById('aiCalcMonths');
    const returnInput = document.getElementById('aiCalcReturnRate');
    const currentInput = document.getElementById('aiCalcCurrentSaved');

    const targetAmount = Number(targetInput?.value || 500000);
    const months = Number(monthsInput?.value || 24);
    const annualRate = Number(returnInput?.value || 12);
    const currentSaved = Number(currentInput?.value || 100000);

    const monthlyRate = (annualRate / 100) / 12;
    const futureValueOfCurrent = currentSaved * Math.pow(1 + monthlyRate, months);
    const remainingTarget = Math.max(0, targetAmount - futureValueOfCurrent);

    let requiredMonthlySIP = 0;
    if (remainingTarget > 0) {
      if (monthlyRate > 0) {
        const factor = (Math.pow(1 + monthlyRate, months) - 1) * (1 + monthlyRate) / monthlyRate;
        requiredMonthlySIP = Math.round(remainingTarget / factor);
      } else {
        requiredMonthlySIP = Math.round(remainingTarget / months);
      }
    }

    const totalSIPInvestment = requiredMonthlySIP * months;
    const totalOutflow = currentSaved + totalSIPInvestment;
    const estimatedWealthGain = Math.max(0, targetAmount - totalOutflow);

    const sipResultEl = document.getElementById('aiCalcRecommendedSIP');
    if (sipResultEl) sipResultEl.textContent = Store.formatINR(requiredMonthlySIP) + ' / mo';

    const wealthGainEl = document.getElementById('aiCalcWealthGain');
    if (wealthGainEl) wealthGainEl.textContent = `Est. Returns: +${Store.formatINR(estimatedWealthGain)} (${annualRate}% p.a.)`;

    const velocityBadgeEl = document.getElementById('aiCalcVelocityBadge');
    if (velocityBadgeEl) {
      if (requiredMonthlySIP <= 15000) {
        velocityBadgeEl.className = 'status-pill on-track';
        velocityBadgeEl.textContent = 'Highly Achievable Pace';
      } else if (requiredMonthlySIP <= 35000) {
        velocityBadgeEl.className = 'status-pill needs-attention';
        velocityBadgeEl.textContent = 'Moderate Effort Pace';
      } else {
        velocityBadgeEl.className = 'status-pill behind-plan';
        velocityBadgeEl.textContent = 'Aggressive Contribution Needed';
      }
    }

    const adviceListEl = document.getElementById('aiCalcAdviceList');
    if (adviceListEl) {
      adviceListEl.innerHTML = `
        <div class="ai-insight-bullet">💡 <strong>Step-up SIP Hack:</strong> Increasing your monthly SIP by just 10% annually allows you to start with ${Store.formatINR(Math.round(requiredMonthlySIP * 0.78))}/mo instead.</div>
        <div class="ai-insight-bullet">🇮🇳 <strong>Indian Tax Shield:</strong> Under Section 112A, Long-Term Capital Gains (LTCG) on equity mutual funds up to ₹1.25 Lakh per year remain completely tax-exempt.</div>
        <div class="ai-insight-bullet">🎯 <strong>Asset Allocation:</strong> For a ${months}-month horizon, a split of 70% Flexi-Cap / Nifty 50 Index + 30% Short Duration Arbitrage is ideal.</div>
      `;
    }
  }

  // ----------------------------------------------------
  // EVENT LISTENERS & FORM SUBMISSIONS
  // ----------------------------------------------------
  setupEventListeners() {
    // Tab Bar click handlers
    document.querySelectorAll('.nav-tab-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // Spending Sub-tabs
    document.querySelectorAll('#spendingSegmentTabs .segment-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchSpendingSubTab(btn.getAttribute('data-subtab'));
      });
    });

    // Investments Sub-tabs
    document.querySelectorAll('#investmentsSegmentTabs .segment-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchInvestmentsSubTab(btn.getAttribute('data-subtab'));
      });
    });

    // Goals Sub-tabs
    document.querySelectorAll('#goalsSegmentTabs .segment-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchGoalsSubTab(btn.getAttribute('data-subtab'));
      });
    });

    // Month Selector Previous / Next
    document.querySelectorAll('.btn-prev-month').forEach(btn => {
      btn.addEventListener('click', () => {
        this.store.state.selectedMonth = "September 2026";
        this.store.saveState();
        showToast('Switched to September 2026');
      });
    });

    document.querySelectorAll('.btn-next-month').forEach(btn => {
      btn.addEventListener('click', () => {
        this.store.state.selectedMonth = "November 2026";
        this.store.saveState();
        showToast('Switched to November 2026');
      });
    });

    // 1. Add Expense Form (Supports both Paid Expense & Upcoming Due / Bill)
    const expenseForm = document.getElementById('addExpenseForm');
    if (expenseForm) {
      expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const type = document.getElementById('expenseTypeInput')?.value || 'paid';
        const title = document.getElementById('expenseTitleInput').value;
        const amount = document.getElementById('expenseAmountInput').value;
        const category = document.getElementById('expenseCategorySelect').value;
        const mode = document.getElementById('expenseModeSelect').value;
        const date = document.getElementById('expenseDateInput').value;

        if (title && amount) {
          if (type === 'paid') {
            this.store.addExpense({
              title,
              amount: Number(amount),
              category,
              mode,
              date: date || Store.getRealTimeNow().isoToday
            });
            closeModal();
            expenseForm.reset();
            showToast(`Logged paid expense of ${Store.formatINR(amount)}!`);
          } else {
            this.store.addUpcomingExpense({
              name: title,
              amount: Number(amount),
              category,
              dueDate: date || Store.getRealTimeNow().isoToday
            });
            closeModal();
            expenseForm.reset();
            showToast(`Scheduled upcoming bill: ${title} (${Store.formatINR(amount)})!`);
          }
        }
      });
    }

    // Set Category Budgets Form (All Categories)
    const setBudgetsForm = document.getElementById('setCategoryBudgetsForm');
    if (setBudgetsForm) {
      setBudgetsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const budgetMap = {};
        const inputs = setBudgetsForm.querySelectorAll('.category-budget-input');
        inputs.forEach(inp => {
          const catId = inp.getAttribute('data-cat-id');
          if (catId) {
            budgetMap[catId] = Number(inp.value) || 0;
          }
        });
        this.store.setAllCategoryBudgets(budgetMap);
        closeModal();
        showToast('Category monthly spending limits saved successfully!');
      });
    }

    // Single Category Budget Form Submission
    const singleCatBudgetForm = document.getElementById('singleCategoryBudgetForm');
    if (singleCatBudgetForm) {
      singleCatBudgetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const catId = document.getElementById('singleCatIdInput')?.value;
        const budget = document.getElementById('singleCatBudgetInput')?.value;

        if (catId) {
          this.store.setCategoryBudget(catId, budget);
          closeModal();
          const cat = this.store.state.spending.categories.find(c => c.id === catId);
          const catName = cat ? cat.name : "Category";
          showToast(`Budget for ${catName} set to ${Store.formatINR(budget)}!`);
        }
      });
    }

    // 2. Edit Expense Form
    const editExpenseForm = document.getElementById('editExpenseForm');
    if (editExpenseForm) {
      editExpenseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const txId = document.getElementById('editExpenseId').value;
        const title = document.getElementById('editExpenseTitleInput').value;
        const amount = document.getElementById('editExpenseAmountInput').value;
        const category = document.getElementById('editExpenseCategorySelect').value;
        const mode = document.getElementById('editExpenseModeSelect').value;
        const date = document.getElementById('editExpenseDateInput').value;

        this.store.editExpense(txId, {
          title,
          amount: Number(amount),
          category,
          mode,
          date
        });
        closeModal();
        showToast('Expense updated successfully!');
      });
    }

    // 3. Add Investment Form
    const investmentForm = document.getElementById('addInvestmentForm');
    if (investmentForm) {
      investmentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('invNameInput').value;
        const amount = document.getElementById('invAmountInput').value;
        const type = document.getElementById('invTypeSelect').value;
        const nav = document.getElementById('invNavInput').value;

        if (name && amount) {
          this.store.addInvestment({
            name,
            amount: Number(amount),
            type,
            nav
          });
          closeModal();
          investmentForm.reset();
          showToast(`Recorded investment of ${Store.formatINR(amount)}!`, '₹');
        }
      });
    }

    // 4. Edit Holding Form
    const editHoldingForm = document.getElementById('editHoldingForm');
    if (editHoldingForm) {
      editHoldingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const hldId = document.getElementById('editHoldingId').value;
        const name = document.getElementById('editHoldingNameInput').value;
        const type = document.getElementById('editHoldingTypeSelect').value;
        const value = document.getElementById('editHoldingValueInput').value;
        const gainPercent = document.getElementById('editHoldingGainInput').value;

        this.store.editHolding(hldId, {
          name,
          type,
          value,
          gainPercent
        });
        closeModal();
        showToast('Holding valuation updated!');
      });
    }

    // 5. Redeem Holding Form
    const redeemForm = document.getElementById('redeemHoldingForm');
    if (redeemForm) {
      redeemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const hldId = document.getElementById('redeemHoldingId').value;
        const amount = document.getElementById('redeemAmountInput').value;
        const date = document.getElementById('redeemDateInput').value;
        const dest = document.getElementById('redeemDestinationSelect').value;
        const notes = document.getElementById('redeemNotesInput').value;

        this.store.redeemHolding(hldId, amount, date, `${dest}${notes ? ' - ' + notes : ''}`);
        closeModal();
        showToast(`Redeemed ${Store.formatINR(amount)}! Credited to ${dest}`);
      });
    }

    // 6. Add SIP Form
    const sipForm = document.getElementById('addSipForm');
    if (sipForm) {
      sipForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fundName = document.getElementById('sipFundInput').value;
        const amount = document.getElementById('sipAmountInput').value;
        const dueDay = document.getElementById('sipDaySelect').value;
        const linkedGoal = document.getElementById('sipGoalSelect').value;

        if (fundName && amount) {
          this.store.addSIP({
            fundName,
            amount: Number(amount),
            dueDay,
            linkedGoal
          });
          closeModal();
          sipForm.reset();
          showToast(`Set up ${Store.formatINR(amount)} monthly SIP for ${fundName}!`, '✓');
        }
      });
    }

    // 7. Add Goal Form
    const goalForm = document.getElementById('addGoalForm');
    if (goalForm) {
      goalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('goalTitleInput').value;
        const targetAmount = document.getElementById('goalTargetInput').value;
        const currentAmount = document.getElementById('goalCurrentInput').value || 0;
        const deadline = document.getElementById('goalDeadlineInput').value;
        const linkedVehicle = document.getElementById('goalVehicleInput').value;

        if (title && targetAmount) {
          this.store.addGoal({
            title,
            targetAmount: Number(targetAmount),
            currentAmount: Number(currentAmount),
            deadline,
            linkedVehicle
          });
          closeModal();
          goalForm.reset();
          showToast(`Created goal: ${title}!`, '🎯');
        }
      });
    }

    // 8. Edit Goal Form
    const editGoalForm = document.getElementById('editGoalForm');
    if (editGoalForm) {
      editGoalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const goalId = document.getElementById('editGoalId').value;
        const title = document.getElementById('editGoalTitleInput').value;
        const targetAmount = document.getElementById('editGoalTargetInput').value;
        const currentAmount = document.getElementById('editGoalCurrentInput').value;
        const deadline = document.getElementById('editGoalDeadlineInput').value;
        const linkedVehicle = document.getElementById('editGoalVehicleInput').value;

        this.store.editGoal(goalId, {
          title,
          targetAmount,
          currentAmount,
          deadline,
          linkedVehicle
        });
        closeModal();
        showToast('Goal parameters updated!');
      });
    }

    // 9. Edit Personal Details Form
    const personalForm = document.getElementById('editPersonalDetailsForm');
    if (personalForm) {
      personalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fullName = document.getElementById('editPersonalName').value;
        const dob = document.getElementById('editPersonalDOB').value;
        const city = document.getElementById('editPersonalCity').value;
        const phone = document.getElementById('editPersonalPhone').value;
        const email = document.getElementById('editPersonalEmail').value;
        const pan = document.getElementById('editPersonalPAN').value;

        this.store.updatePersonalDetails({
          fullName,
          dob,
          city,
          phone,
          email,
          pan
        });

        closeModal();
        showToast('Personal details and age updated!');
      });
    }

    // 10. Edit Financial Profile Form
    const finProfileForm = document.getElementById('editFinancialProfileForm');
    if (finProfileForm) {
      finProfileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const monthlyIncome = document.getElementById('editFinancialIncome').value;
        const employment = document.getElementById('editFinancialEmployment').value;
        const role = document.getElementById('editFinancialRole').value;
        const riskProfile = document.getElementById('editFinancialRisk').value;
        const investmentPreference = document.getElementById('editFinancialPref').value;
        const taxRegime = document.getElementById('editFinancialTaxRegime').value;

        this.store.updateFinancialProfile({
          monthlyIncome,
          employment,
          role,
          riskProfile,
          investmentPreference,
          taxRegime
        });

        closeModal();
        showToast('Financial profile and baseline income updated!');
      });
    }

    // 11. Start Fresh / Custom Setup Form
    const startFreshForm = document.getElementById('startFreshForm');
    if (startFreshForm) {
      startFreshForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('freshUserName').value;
        const city = document.getElementById('freshUserCity').value;
        const income = document.getElementById('freshUserIncome').value;

        this.store.startFresh({
          name,
          city,
          income
        });
        closeModal();
        showToast(`Setup completed for ${name}! Ready to add your investments & expenses.`);
      });
    }

    // 12. Add Fixed Recurring Expense Form
    const addFixForm = document.getElementById('addFixedExpenseForm');
    if (addFixForm) {
      addFixForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('addFixNameInput').value;
        const amount = document.getElementById('addFixAmountInput').value;
        const recurrence = document.getElementById('addFixRecurrenceSelect').value;
        const category = document.getElementById('addFixCategorySelect').value;

        if (name && amount) {
          this.store.addFixedExpense({
            name,
            amount: Number(amount),
            recurrence,
            category
          });
          closeModal();
          addFixForm.reset();
          showToast(`Added fixed bill: ${name} (${Store.formatINR(amount)})!`);
        }
      });
    }

    // 13. Edit Fixed Recurring Expense Form
    const editFixForm = document.getElementById('editFixedExpenseForm');
    if (editFixForm) {
      editFixForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fixId = document.getElementById('editFixId').value;
        const name = document.getElementById('editFixNameInput').value;
        const amount = document.getElementById('editFixAmountInput').value;
        const recurrence = document.getElementById('editFixRecurrenceSelect').value;
        const category = document.getElementById('editFixCategorySelect').value;

        this.store.editFixedExpense(fixId, {
          name,
          amount: Number(amount),
          recurrence,
          category
        });
        closeModal();
        showToast(`Updated fixed bill: ${name}!`);
      });
    }

    // 14. Quick Set Monthly Income Form
    const quickIncomeForm = document.getElementById('setQuickIncomeForm');
    if (quickIncomeForm) {
      quickIncomeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = document.getElementById('quickIncomeInput').value;
        if (amount) {
          this.store.setMonthlyIncome(Number(amount));
          closeModal();
          showToast(`Monthly fixed income set to ${Store.formatINR(amount)}!`);
        }
      });
    }

    // 15. Add Income Source Form
    const addIncomeForm = document.getElementById('addIncomeSourceForm');
    if (addIncomeForm) {
      addIncomeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('newIncomeTitleInput').value;
        const amount = document.getElementById('newIncomeAmountInput').value;
        const type = document.getElementById('newIncomeTypeSelect').value;

        if (title && amount) {
          this.store.addIncomeSource({
            title,
            amount: Number(amount),
            type,
            frequency: "Monthly"
          });
          addIncomeForm.reset();
          showToast(`Added income source "${title}" (${Store.formatINR(amount)})!`);
        }
      });
    }

    // 16. Edit Income Stream Form
    const editIncomeForm = document.getElementById('editIncomeForm');
    if (editIncomeForm) {
      editIncomeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const incId = document.getElementById('editIncomeId').value;
        const title = document.getElementById('editIncomeTitleInput').value;
        const amount = document.getElementById('editIncomeAmountInput').value;
        const type = document.getElementById('editIncomeTypeSelect').value;

        this.store.editIncomeSource(incId, {
          title,
          amount: Number(amount),
          type
        });
        closeModal();
        showToast(`Updated income stream "${title}"!`);
      });
    }

    // AI Calculator dynamic inputs
    ['aiCalcTargetAmount', 'aiCalcMonths', 'aiCalcReturnRate', 'aiCalcCurrentSaved'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.runAICalculation());
      }
    });

    // Close modals on backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          closeModal();
        }
      });
    });
  }

  // ----------------------------------------------------
  // SVG ICON HELPERS
  // ----------------------------------------------------
  getCategoryIconSVG(catId) {
    switch (catId) {
      case 'food':
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>`;
      case 'rent':
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>`;
      case 'shopping':
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`;
      case 'transport':
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>`;
      case 'utilities':
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`;
      case 'lifestyle':
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
      default:
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>`;
    }
  }

  getAssetIconSVG(assetId) {
    if (assetId === 'mf') {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>`;
    } else if (assetId === 'eq') {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`;
    } else {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>`;
    }
  }

  getGoalIconSVG(iconName) {
    switch (iconName) {
      case 'shield':
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
      case 'home':
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`;
      case 'plane':
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"></path></svg>`;
      case 'car':
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>`;
      default:
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="12 6 12 12 16 14"></polygon></svg>`;
    }
  }

  openExportModal(scope = 'all') {
    if (window.exportManager && typeof window.exportManager.openExportModal === 'function') {
      window.exportManager.openExportModal(scope);
    }
  }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  window.app = new FinanceApp();
  window.app.openExportModal = (scope = 'all') => {
    if (window.exportManager && typeof window.exportManager.openExportModal === 'function') {
      window.exportManager.openExportModal(scope);
    }
  };
});
