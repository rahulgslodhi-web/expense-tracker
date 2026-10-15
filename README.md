# Indian Personal & Household Finance & Investment Web App 🇮🇳

A standard, responsive mobile-first web application built specifically for the Indian financial ecosystem that fills the browser viewport edge-to-edge with a fixed bottom navigation bar.

---

## 🌟 Key Features & Architecture

### 1. Edge-to-Edge Responsive Web Layout
- **Full Viewport Responsive Design**: Fills the entire browser viewport edge-to-edge on mobile devices, with flexible max-width container formatting for tablet and desktop viewports.
- **Fixed Full-Width Bottom Navigation Bar**: Anchored to the bottom of the screen with iOS safe-area support (`env(safe-area-inset-bottom)`), providing 1-tap switching across all 5 main tabs.
- **₹ (INR) Currency Standard**: All metrics, charts, tables, and logs use Indian Rupee currency formatting (`₹` symbol and Indian comma notation).

---

## 2. Comprehensive 5 Main Tabs & Full Editing Functionality

1. **Overview Dashboard**:
   - Monthly summary snapshot: **Income (₹75,000)**, **Expenses (₹32,400)**, **Invested (₹18,000)**, **Remaining (₹24,600)**.
   - **Interactive Income Bifurcation Donut Chart**:
     - Visualizes monthly income breakdown into **Expenses % and ₹**, **Investments % and ₹**, and **Remaining Savings % and ₹**.
     - Deficit warnings if monthly outflows exceed income.
   - **Smart Alert Banner with Real-Time Due & Budget Triggers**:
     - Live synchronized alert triggering based on real-time clock and over-budget thresholds.
     - Urgent notices for upcoming SIPs (*"Your SIP of ₹10,000 for Parag Parikh Flexi Cap is due today. Confirm now →"*) and category budget overruns (*"⚠️ Budget Alert: Food & Dining is exceeding its limit by ₹500"*).
   - **Due/Pending Action Prompts**: Action cards with interactive **"Confirm"** and **"Mark Paid"** buttons that immediately update your monthly invested/expense totals, remaining balance, and donut chart.
   - **Live Clock Badge**: Real-time synchronized date and time display (`Wed, 15 Oct 2026 • 1:15 AM`) with live pulsing status indicator.
   - **📥 Export Financial Statement & Reports**: Prominent export card at the bottom of the dashboard to generate and download official Excel and PDF statements.

2. **Spending & Expenses Tracker**:
   - **Monthly Fixed Income & Inflow Tracker**: Dedicated card displaying monthly fixed income, total recurring fixed bills, and discretionary leftover buffer, with direct access to manage income streams.
   - Total monthly expenses with previous month growth comparison (`↑ 12% vs last month`).
   - **Category Budget Allocation & Overspending Alerts**:
     - Set monthly spending limits (budget caps) for each category (Food & Dining, Shopping, Transport, Rent, Utilities, Lifestyle, Others).
     - Dedicated **"Allot Limit"** button and clickable limit text on each category row to allot a budget for that specific category with 1-tap preset chips (`Match Spent`, `₹5,000`, `₹8,000`, `₹10,000`, `₹15,000`).
     - If spending in any category crosses its allocated limit, a prominent **Warning / Alert Banner** appears directly on the spending screen (*"⚠️ Over-Budget Warning: Food & Dining is over budget by ₹500"*).
     - Visual category cards display clear status pills (`Over Limit`, `Near Limit`, `% of budget`) and color-coded progress bars (red for over budget, amber for near limit, green for on track).
     - Dedicated **"⚙️ Set Category Budgets"** modal to review total allocated budget against total monthly income baseline.
   - **Expense Type Selector & Split Buttons (Already Paid vs Upcoming Due / Bill)**:
     - In the "Log Expense" modal, an intuitive segmented toggle allows switching between **"Already Paid"** and **"Upcoming Due / Bill"**.
     - In **"Already Paid"** mode: Selects payment method (Google Pay UPI, PhonePe, Credit Cards, Net Banking, Cash), auto-fills payment date, and deducts immediately from monthly cash flow.
     - In **"Upcoming Due / Bill"** mode: Prompts for due date, hides immediate payment modes, and automatically schedules the item with real-time due alerts and reminders.
     - Dedicated split buttons on the spending screen title bar (`🕒 + Upcoming Bill` and `+ Log Expense`) provide instantaneous 1-tap access.
   - **Real-Time Date, Time & Dynamic Due Triggers**:
     - Automatically pulls the actual real-time date into all date picker inputs so they are never left blank or require manual backfilling.
     - Dynamically computes real-time days remaining for every upcoming bill (`Due Today!`, `Due Tomorrow`, `Due in 3 days`, `Overdue by X days!`), complete with color-coded urgency badges.
   - **Full Expense Deletion & Editing**:
     - In the **"Transactions & Edit"** sub-tab, each logged expense has **"✏️ Edit"** and **"🗑️ Delete"** actions.
     - Editing or deleting an expense automatically recalculates category amounts, total monthly expenses, remaining income balance, and redraws the Overview pie chart.
   - **Fixed Expenses (Recurring Bills) Management**:
     - Manage and track recurring monthly bills (Rent, Cook & Maid, Broadband, OTT, EMIs).
     - **"+ Add Fixed"**: Quick modal to add new recurring bills with due day/cycle, category, and monthly ₹ amount.
     - **"✏️ Edit" & "🗑️ Delete"**: Edit amounts, bill names, due cycles, or remove fixed bills at any time.
   - **Multiple Fixed Income Streams Management**:
     - Quick-set total monthly income baseline.
     - Add and manage multiple income streams (Fixed Salary, Rental Income, Freelance / Consulting, Family Business, Dividends).
     - Each income source has **"✏️ Edit"** and **"🗑️ Delete"** controls, automatically updating total monthly income, remaining budget, and the Overview pie chart.
   - **Upcoming Bills & Dues** with calendar tags and due-soon alert badges (*"Due in 3 days"*).

3. **Investments & SIP Tracker**:
   - Total Portfolio Value tracking (`₹6,48,200`) with gain metrics (`▲ 12.4% +₹71,200`) and `"As of 1 Oct 2026"` freshness tag.
   - **Asset Allocation Donut Chart**:
     - Visualizes portfolio bifurcation into **Equities**, **Mutual Funds**, and **Others (FDs, Gold, Emergency Buffer)**.
   - **Interactive Asset Class Filtering**:
     - Filter pills (`All Assets`, `Mutual Funds`, `Equities`, `Others / FDs / Gold`) and clickable asset class cards.
     - Clicking **"Mutual Funds"** isolates and displays only Mutual Fund holdings; clicking **"Equities"** displays only Direct Stocks; clicking **"Others"** displays FDs, Gold, Emergency buffers.
   - **Holdings Management, Editing & Redemption**:
     - **💸 Redeem**: Liquidate/withdraw funds (partial or full) from any holding, specifying amount, date, and credit destination (Bank Account / Emergency Vault). Automatically updates portfolio valuation, records in redemption history, and re-renders asset allocation.
     - **✏️ Edit**: Modify asset name, current value, or gain %.
     - **🗑️ Delete**: Delete any holding entered mistakenly.
   - Active **SIP Schedules** with automated cycle dates.
   - Dual action CTAs: `"Add Investment"` (lump-sum) and `"Set Up SIP"` (monthly mandate).

4. **Goals & AI Assistant Vaults**:
   - Goal vaults (*Emergency Fund, Home Renovation, Europe Trip, New Car*) with progress bars and dynamic status badges (`On Track`, `Needs Attention`, `Behind Plan`).
   - Mountain vector hero banner: *"Turn your dreams into a plan"*.
   - **Goal Editing & Deletion**:
     - Open any goal to view details, contribute funds, **"✏️ Edit Goal"**, or **"🗑️ Delete Goal"**.
   - **AI Goal Helper Engine**: Compound monthly SIP calculator that computes recommended monthly contributions based on target amounts, timeline (months), and expected returns (% p.a.), complete with feasibility ratings and strategic Indian investing tips.

5. **Profile & Personal Details**:
   - **Dynamic Date of Birth & Age Calculation**:
     - Select any Date of Birth in the date picker; age is accurately calculated automatically (e.g. 28 Jun 2002 -> 24 years).
   - **Full Profile Customization**:
     - **Edit Personal Details**: Full Name, Date of Birth, Age, City, Phone Number, Email, PAN Card.
     - **Edit Financial Profile**: Monthly Income Baseline (₹), Employer, Designation/Role, Risk Profile, Investment Preferences, Tax Regime.
   - **Account & Cloud Persistence Hub**:
     - Displays active account ID, dual-layer storage status (LocalStorage + IndexedDB), 1-tap account switching, and backup/restore controls.
   - **🚀 Setup Custom Situation / Start Fresh**:
     - Modal for new users to enter their custom name, city, and income baseline, clearing prefilled demo data to start tracking real household finances.
   - **↺ Reset**: Restore the rich default Indian demo data at any time.

---

## 🔒 3. Persistent Storage, Accounts & Authentication (Never Lose Data)

- **Dual-Layer Indestructible Storage**:
  - **Layer 1 (LocalStorage)**: Instantaneous, zero-latency synchronous reads and writes for smooth mobile navigation.
  - **Layer 2 (IndexedDB `PaisaTrackDB`)**: High-capacity persistent object stores (`user_accounts` and `user_financial_data`). If a user's mobile browser (iOS Safari, Android Chrome) clears cache or unloads tabs, the application self-heals by fetching the latest state directly from IndexedDB.
  - **Persistent Storage Permission**: Requests `navigator.storage.persist()` to prevent the mobile OS from evicting stored client data during memory cleanup.
- **Account Management & Authentication**:
  - Pre-seeded account: `Rahul Lodhi` (`rahul@example.com` / PIN: `1234`).
  - **Sign Up / Register**: Create new accounts with Name, Email, Phone, 4-digit PIN/Password, and starting monthly income. Each account has its own isolated financial ledger.
  - **Log In & Session Resumption**: Users remain securely logged in across app restarts, reboots, and browser tab closes.
  - **Account Switcher**: Easily switch between multiple family members or personal/business profiles on the same device with 1 tap.
- **Portable Backup & Device Transfer**:
  - **📥 Download Device Backup (JSON)**: Exports your complete financial ledger into a portable file.
  - **📋 Copy to Clipboard**: 1-tap copy to transfer data via messaging or email.
  - **📤 Restore from File / Paste**: Upload a backup JSON file or paste backup text to restore all past data onto a new smartphone or computer.

---

## 📊 4. Financial Statement Export Engine (Excel & PDF)

Located at the bottom of the **Overview Dashboard** (and accessible via Spending and Profile tabs):

- **Flexible Period Filtering**:
  - **Monthly Option**: Choose any month (e.g., October 2026, September 2026, August 2026, etc.) or full Indian Financial Years (FY 2026-27, FY 2025-26).
  - **Custom Date Range Option**: Select any arbitrary start date and end date with auto-filled real-time calendar pickers and quick presets (*"This Month"*, *"Last Month"*, *"Last 30 Days"*, *"FY YTD"*).
- **Scope Selection**:
  - Complete Financial Statement (Income, Spending by Category, Transactions, Investments & SIPs, Goals).
  - Expenses & Spending Only.
  - Investments & Portfolio Only.
- **Dual Export Formats**:
  1. 📗 **Excel Export (.xlsx / .csv)**:
     - Formatted with UTF-8 Byte Order Mark (`\uFEFF`) so Microsoft Excel (Windows/Mac), Apple Numbers, and Google Sheets natively render the ₹ Indian Rupee symbol and numbers without encoding bugs.
     - Includes Executive Summary, KYC details, Category Budget vs. Actual spend table with variances, Itemized Transaction Ledger, and Investment Portfolio Holdings.
  2. 📕 **Bank-Grade PDF Statement & Print Engine**:
     - Generates an official, print-ready Indian Financial Statement document with PaisaTrack header, confidential watermark, PAN & KYC badge, KPI summary cards, budget utilization tables, and detailed transaction ledger.
     - Styled with `@media print` rules for clean, borderless A4 PDF saving or wireless printing on iOS/Android and desktop browsers.

---

## 🚀 How to Run

Open [index.html](file:///Users/rahullodhi/Desktop/expense/index.html) directly in any web browser, or serve it locally:

```bash
python3 -m http.server 8080
```
Then visit `http://localhost:8080`.
