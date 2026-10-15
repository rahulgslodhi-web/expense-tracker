/**
 * PaisaTrack - Authentication & Dual-Layer Persistent Storage Engine
 * Dual-Layer: Synchronous LocalStorage + Asynchronous IndexedDB (PaisaTrackDB)
 * Ensures user data survives browser cache clears, tab closures, and device reboots.
 */

(function () {
  'use strict';

  const DB_NAME = 'PaisaTrackDB';
  const DB_VERSION = 1;
  const STORE_ACCOUNTS = 'user_accounts';
  const STORE_FINANCIAL = 'user_financial_data';

  const SESSION_KEY = 'paisa_active_session';
  const REGISTRY_KEY = 'paisa_users_registry';
  const DATA_KEY_PREFIX = 'paisa_data_';
  const LEGACY_KEY = 'EXPENSE_APP_INDIAN_FINANCE_v3';
  const DEFAULT_USER_ID = 'user_rahul_lodhi';

  const DEMO_ACCOUNT = {
    id: DEFAULT_USER_ID,
    fullName: 'Rahul Lodhi',
    email: 'rahul@example.com',
    phone: '9876543210',
    pin: '1234',
    monthlyIncome: 75000,
    city: 'Hyderabad',
    employment: 'ICICI Securities',
    role: 'Senior Financial Analyst',
    createdAt: '2026-10-01T09:00:00.000Z',
    isDemo: true
  };

  class AuthManager {
    constructor() {
      this.db = null;
      this.dbReadyPromise = null;
      this.currentUser = null;
      this.isPersistentStorageGranted = false;

      // Initialize early storage state
      this.initDB();
      this.requestPersistentStorage();
      this.initRegistryAndSession();
    }

    // ==========================================
    // INDEXEDDB ENGINE
    // ==========================================
    initDB() {
      if (this.dbReadyPromise) return this.dbReadyPromise;

      this.dbReadyPromise = new Promise((resolve) => {
        if (!window.indexedDB) {
          console.warn('[PaisaTrack Auth] IndexedDB is not supported in this browser. Falling back strictly to LocalStorage.');
          resolve(null);
          return;
        }

        try {
          const req = window.indexedDB.open(DB_NAME, DB_VERSION);

          req.onupgradeneeded = (event) => {
            const db = event.target.result;
            // Store 1: User account credentials & profile
            if (!db.objectStoreNames.contains(STORE_ACCOUNTS)) {
              const accountStore = db.createObjectStore(STORE_ACCOUNTS, { keyPath: 'id' });
              accountStore.createIndex('by_email', 'email', { unique: false });
              accountStore.createIndex('by_phone', 'phone', { unique: false });
            }
            // Store 2: User financial state (expenses, investments, SIPs, budgets)
            if (!db.objectStoreNames.contains(STORE_FINANCIAL)) {
              db.createObjectStore(STORE_FINANCIAL, { keyPath: 'userId' });
            }
          };

          req.onsuccess = (event) => {
            this.db = event.target.result;
            console.log('[PaisaTrack Auth] IndexedDB initialized successfully:', DB_NAME);
            this.syncIndexedDBWithLocalStorage();
            resolve(this.db);
          };

          req.onerror = (event) => {
            console.warn('[PaisaTrack Auth] IndexedDB open error, relying on LocalStorage:', event.target.error);
            resolve(null);
          };
        } catch (e) {
          console.warn('[PaisaTrack Auth] Exception initializing IndexedDB:', e);
          resolve(null);
        }
      });

      return this.dbReadyPromise;
    }

    async requestPersistentStorage() {
      try {
        if (navigator.storage && navigator.storage.persist) {
          const isPersisted = await navigator.storage.persist();
          this.isPersistentStorageGranted = isPersisted;
          console.log(`[PaisaTrack Storage] Storage persistence granted: ${isPersisted}`);
        }
      } catch (e) {
        // Ignore in restricted environments
      }
    }

    async idbPut(storeName, data) {
      const db = await this.initDB();
      if (!db) return false;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          const req = store.put(data);
          req.onsuccess = () => resolve(true);
          req.onerror = () => resolve(false);
        } catch (e) {
          resolve(false);
        }
      });
    }

    async idbGet(storeName, key) {
      const db = await this.initDB();
      if (!db) return null;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          const req = store.get(key);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        } catch (e) {
          resolve(null);
        }
      });
    }

    async idbGetAll(storeName) {
      const db = await this.initDB();
      if (!db) return [];
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        } catch (e) {
          resolve([]);
        }
      });
    }

    async idbDelete(storeName, key) {
      const db = await this.initDB();
      if (!db) return false;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          const req = store.delete(key);
          req.onsuccess = () => resolve(true);
          req.onerror = () => resolve(false);
        } catch (e) {
          resolve(false);
        }
      });
    }

    // ==========================================
    // REGISTRY & SESSION MANAGEMENT
    // ==========================================
    initRegistryAndSession() {
      // 1. Load or initialize user registry in localStorage
      let users = this.getUsersRegistry();
      if (!users || users.length === 0) {
        users = [JSON.parse(JSON.stringify(DEMO_ACCOUNT))];
        this.saveUsersRegistry(users);
      } else {
        // Ensure default demo account exists
        const hasDemo = users.some(u => u.id === DEFAULT_USER_ID);
        if (!hasDemo) {
          users.unshift(JSON.parse(JSON.stringify(DEMO_ACCOUNT)));
          this.saveUsersRegistry(users);
        }
      }

      // 2. Resolve Active Session
      let session = null;
      try {
        const rawSession = localStorage.getItem(SESSION_KEY);
        if (rawSession) {
          session = JSON.parse(rawSession);
        }
      } catch (e) {
        console.warn('[PaisaTrack Auth] Corrupted session in localStorage');
      }

      let activeUser = null;
      if (session && session.userId) {
        activeUser = users.find(u => u.id === session.userId);
      }

      // Fallback to Demo Account if no session or user not found
      if (!activeUser) {
        activeUser = users.find(u => u.id === DEFAULT_USER_ID) || DEMO_ACCOUNT;
        this.setActiveSession(activeUser.id, true);
      }

      this.currentUser = activeUser;

      // 3. Migrate legacy localStorage state if active is Rahul Lodhi
      this.migrateLegacyDataIfApplicable();
    }

    migrateLegacyDataIfApplicable() {
      try {
        const userKey = DATA_KEY_PREFIX + DEFAULT_USER_ID;
        const currentData = localStorage.getItem(userKey);
        const legacyData = localStorage.getItem(LEGACY_KEY);

        if (!currentData && legacyData) {
          // Adopt existing legacy data into Rahul Lodhi's account
          localStorage.setItem(userKey, legacyData);
          console.log('[PaisaTrack Auth] Successfully migrated legacy data to Rahul Lodhi account.');
        }
      } catch (e) {
        console.warn('[PaisaTrack Auth] Migration check skipped', e);
      }
    }

    async syncIndexedDBWithLocalStorage() {
      try {
        // 1. Sync accounts to IndexedDB
        const users = this.getUsersRegistry();
        for (const user of users) {
          await this.idbPut(STORE_ACCOUNTS, user);
        }

        // 2. Check if IndexedDB has accounts that are missing in LocalStorage (recovery scenario)
        const idbAccounts = await this.idbGetAll(STORE_ACCOUNTS);
        if (idbAccounts && idbAccounts.length > users.length) {
          const merged = [...users];
          idbAccounts.forEach(idbAcc => {
            if (!merged.some(m => m.id === idbAcc.id)) {
              merged.push(idbAcc);
            }
          });
          this.saveUsersRegistry(merged);
        }

        // 3. Sync active user financial data to IndexedDB
        if (this.currentUser) {
          const userKey = DATA_KEY_PREFIX + this.currentUser.id;
          const raw = localStorage.getItem(userKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            await this.idbPut(STORE_FINANCIAL, {
              userId: this.currentUser.id,
              state: parsed,
              updatedAt: Date.now()
            });
          } else {
            // Check if IndexedDB has the state (e.g. if LocalStorage was cleared)
            const idbData = await this.idbGet(STORE_FINANCIAL, this.currentUser.id);
            if (idbData && idbData.state) {
              console.log('[PaisaTrack Auth] Auto-healed state from IndexedDB into LocalStorage!');
              localStorage.setItem(userKey, JSON.stringify(idbData.state));
              if (window.appStore && typeof window.appStore.switchUser === 'function') {
                window.appStore.switchUser(idbData.state);
              }
            }
          }
        }
      } catch (e) {
        console.warn('[PaisaTrack Auth] Background sync error:', e);
      }
    }

    getUsersRegistry() {
      try {
        const raw = localStorage.getItem(REGISTRY_KEY);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) return list;
        }
      } catch (e) {
        console.warn('[PaisaTrack Auth] Error reading users registry');
      }
      return [];
    }

    saveUsersRegistry(usersList) {
      try {
        localStorage.setItem(REGISTRY_KEY, JSON.stringify(usersList));
      } catch (e) {
        console.error('[PaisaTrack Auth] Could not save users registry to localStorage', e);
      }
      // Async mirror to IndexedDB
      usersList.forEach(u => {
        this.idbPut(STORE_ACCOUNTS, u).catch(() => {});
      });
    }

    getActiveUser() {
      if (!this.currentUser) {
        this.initRegistryAndSession();
      }
      return this.currentUser || DEMO_ACCOUNT;
    }

    getActiveUserId() {
      return (this.currentUser && this.currentUser.id) ? this.currentUser.id : DEFAULT_USER_ID;
    }

    setActiveSession(userId, rememberMe = true) {
      try {
        const session = {
          userId: userId,
          rememberMe: rememberMe,
          token: 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
          lastLogin: new Date().toISOString()
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } catch (e) {
        console.warn('[PaisaTrack Auth] Could not persist session', e);
      }
    }

    clearSession() {
      try {
        localStorage.removeItem(SESSION_KEY);
      } catch (e) {}
    }

    // ==========================================
    // STORE SYNCHRONIZATION HOOKS
    // ==========================================
    loadActiveUserState() {
      const userId = this.getActiveUserId();
      const key = DATA_KEY_PREFIX + userId;

      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          return JSON.parse(raw);
        }
      } catch (e) {
        console.warn('[PaisaTrack Auth] Failed to read user state from LocalStorage', e);
      }

      // Check if fallback legacy key exists for Rahul Lodhi
      if (userId === DEFAULT_USER_ID) {
        try {
          const legacy = localStorage.getItem(LEGACY_KEY);
          if (legacy) {
            const parsed = JSON.parse(legacy);
            localStorage.setItem(key, legacy);
            return parsed;
          }
        } catch (e) {}
      }

      return null;
    }

    saveActiveUserState(state) {
      const userId = this.getActiveUserId();
      const key = DATA_KEY_PREFIX + userId;

      // 1. Synchronous LocalStorage write (instant)
      try {
        const serialized = JSON.stringify(state);
        localStorage.setItem(key, serialized);

        // Keep legacy key mirrored if active account is demo
        if (userId === DEFAULT_USER_ID) {
          localStorage.setItem(LEGACY_KEY, serialized);
        }
      } catch (e) {
        console.error('[PaisaTrack Auth] Synchronous LocalStorage save failed:', e);
      }

      // 2. Asynchronous IndexedDB persistent write (survives cache trim)
      this.idbPut(STORE_FINANCIAL, {
        userId: userId,
        state: state,
        updatedAt: Date.now()
      }).catch(err => {
        console.warn('[PaisaTrack Auth] IDB financial state write error:', err);
      });

      // 3. Keep account metadata in sync if user edited their profile in settings
      if (state.user && this.currentUser) {
        let changed = false;
        if (state.user.fullName && state.user.fullName !== this.currentUser.fullName) {
          this.currentUser.fullName = state.user.fullName;
          changed = true;
        }
        if (state.user.email && state.user.email !== this.currentUser.email) {
          this.currentUser.email = state.user.email;
          changed = true;
        }
        if (state.user.phone && state.user.phone !== this.currentUser.phone) {
          this.currentUser.phone = state.user.phone;
          changed = true;
        }
        if (state.user.monthlyIncome && state.user.monthlyIncome !== this.currentUser.monthlyIncome) {
          this.currentUser.monthlyIncome = state.user.monthlyIncome;
          changed = true;
        }

        if (changed) {
          const registry = this.getUsersRegistry();
          const idx = registry.findIndex(u => u.id === this.currentUser.id);
          if (idx !== -1) {
            registry[idx] = { ...registry[idx], ...this.currentUser };
            this.saveUsersRegistry(registry);
          }
        }
      }

      this.updateHeaderBadge();
    }

    // ==========================================
    // ACCOUNT ACTIONS: REGISTER, LOGIN, LOGOUT
    // ==========================================
    registerUser({ fullName, email, phone, pin, monthlyIncome }) {
      const cleanName = (fullName || '').trim();
      const cleanEmail = (email || '').toLowerCase().trim();
      const cleanPhone = (phone || '').replace(/\s+/g, '').trim();
      const cleanPin = String(pin || '').trim();
      const incomeNum = Math.max(0, Number(monthlyIncome) || 50000);

      if (!cleanName) {
        return { success: false, message: 'Please enter your Full Name.' };
      }
      if (!cleanEmail && !cleanPhone) {
        return { success: false, message: 'Please enter an Email Address or Phone Number.' };
      }
      if (!cleanPin || cleanPin.length < 4) {
        return { success: false, message: 'Please enter a 4-digit PIN or password.' };
      }

      const registry = this.getUsersRegistry();

      // Check duplicate email or phone
      const duplicate = registry.find(u => {
        if (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail) return true;
        if (cleanPhone && u.phone && u.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, '')) return true;
        return false;
      });

      if (duplicate) {
        return {
          success: false,
          message: `An account with this ${cleanEmail === duplicate.email ? 'Email' : 'Phone'} is already registered. Please Log In.`
        };
      }

      const newUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const newAccount = {
        id: newUserId,
        fullName: cleanName,
        email: cleanEmail || `${cleanPhone}@phone.paisatrack.in`,
        phone: cleanPhone || 'Not Provided',
        pin: cleanPin,
        monthlyIncome: incomeNum,
        city: 'Mumbai',
        employment: 'Private Sector',
        role: 'Professional',
        createdAt: new Date().toISOString(),
        isDemo: false
      };

      // Add to registry
      registry.push(newAccount);
      this.saveUsersRegistry(registry);

      // Create tailored clean financial state
      const freshState = this.createInitialUserState(newAccount);
      this.currentUser = newAccount;
      this.setActiveSession(newUserId, true);

      // Persist new state
      this.saveActiveUserState(freshState);

      // Switch appStore state if running
      if (window.appStore && typeof window.appStore.switchUser === 'function') {
        window.appStore.switchUser(freshState);
      }

      this.updateHeaderBadge();
      return { success: true, user: newAccount };
    }

    loginUser({ identifier, pin, rememberMe = true }) {
      const cleanIdent = (identifier || '').toLowerCase().trim();
      const cleanPin = String(pin || '').trim();

      if (!cleanIdent) {
        return { success: false, message: 'Please enter your registered Email or Phone number.' };
      }
      if (!cleanPin) {
        return { success: false, message: 'Please enter your 4-digit PIN or password.' };
      }

      const registry = this.getUsersRegistry();
      const cleanPhoneDigits = cleanIdent.replace(/\D/g, '');

      const found = registry.find(u => {
        const userEmail = (u.email || '').toLowerCase().trim();
        const userPhoneDigits = (u.phone || '').replace(/\D/g, '');
        return userEmail === cleanIdent || (cleanPhoneDigits.length >= 7 && userPhoneDigits.endsWith(cleanPhoneDigits));
      });

      if (!found) {
        return { success: false, message: 'Account not found. Please register or check your credentials.' };
      }

      if (found.pin !== cleanPin) {
        return { success: false, message: 'Incorrect PIN. Please try again.' };
      }

      this.currentUser = found;
      this.setActiveSession(found.id, rememberMe);

      // Load user state
      let state = this.loadActiveUserState();
      if (!state) {
        state = this.createInitialUserState(found);
        this.saveActiveUserState(state);
      }

      if (window.appStore && typeof window.appStore.switchUser === 'function') {
        window.appStore.switchUser(state);
      }

      this.updateHeaderBadge();
      return { success: true, user: found };
    }

    loginAsDemo() {
      const registry = this.getUsersRegistry();
      let demoAcc = registry.find(u => u.id === DEFAULT_USER_ID);
      if (!demoAcc) {
        demoAcc = JSON.parse(JSON.stringify(DEMO_ACCOUNT));
        registry.unshift(demoAcc);
        this.saveUsersRegistry(registry);
      }

      this.currentUser = demoAcc;
      this.setActiveSession(DEFAULT_USER_ID, true);

      let state = this.loadActiveUserState();
      if (!state && window.defaultAppState) {
        state = JSON.parse(JSON.stringify(window.defaultAppState));
        this.saveActiveUserState(state);
      }

      if (window.appStore && typeof window.appStore.switchUser === 'function') {
        window.appStore.switchUser(state);
      }

      this.updateHeaderBadge();
      return { success: true, user: demoAcc };
    }

    logout() {
      this.clearSession();
      // Switch back to demo user
      this.loginAsDemo();
      return { success: true };
    }

    switchAccount(userId) {
      const registry = this.getUsersRegistry();
      const target = registry.find(u => u.id === userId);
      if (!target) {
        return { success: false, message: 'Account not found.' };
      }

      this.currentUser = target;
      this.setActiveSession(target.id, true);

      let state = this.loadActiveUserState();
      if (!state) {
        state = this.createInitialUserState(target);
        this.saveActiveUserState(state);
      }

      if (window.appStore && typeof window.appStore.switchUser === 'function') {
        window.appStore.switchUser(state);
      }

      this.updateHeaderBadge();
      return { success: true, user: target };
    }

    deleteAccount(userId) {
      if (userId === DEFAULT_USER_ID) {
        return { success: false, message: 'The demo guest account cannot be deleted.' };
      }

      let registry = this.getUsersRegistry();
      registry = registry.filter(u => u.id !== userId);
      this.saveUsersRegistry(registry);

      // Clean local storage & IndexedDB
      try {
        localStorage.removeItem(DATA_KEY_PREFIX + userId);
      } catch (e) {}
      this.idbDelete(STORE_ACCOUNTS, userId).catch(() => {});
      this.idbDelete(STORE_FINANCIAL, userId).catch(() => {});

      if (this.currentUser && this.currentUser.id === userId) {
        this.loginAsDemo();
      }

      return { success: true };
    }

    // ==========================================
    // BACKUP & RESTORE ENGINE
    // ==========================================
    exportBackup() {
      const activeUser = this.getActiveUser();
      const state = window.appStore ? window.appStore.state : this.loadActiveUserState();

      const backupPackage = {
        app: 'PaisaTrack',
        schemaVersion: '2.1',
        exportedAt: new Date().toISOString(),
        currency: 'INR',
        user: {
          id: activeUser.id,
          fullName: activeUser.fullName,
          email: activeUser.email,
          phone: activeUser.phone,
          pin: activeUser.pin,
          monthlyIncome: activeUser.monthlyIncome,
          createdAt: activeUser.createdAt
        },
        financialData: state
      };

      const jsonStr = JSON.stringify(backupPackage, null, 2);

      // Trigger automatic file download
      try {
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cleanName = (activeUser.fullName || 'User').replace(/[^a-zA-Z0-9]/g, '_');
        const dateStr = new Date().toISOString().split('T')[0];
        a.download = `PaisaTrack_Backup_${cleanName}_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (e) {
        console.warn('[PaisaTrack Auth] File download failed, falling back to copy', e);
      }

      return jsonStr;
    }

    async copyBackupToClipboard() {
      const activeUser = this.getActiveUser();
      const state = window.appStore ? window.appStore.state : this.loadActiveUserState();

      const backupPackage = {
        app: 'PaisaTrack',
        schemaVersion: '2.1',
        exportedAt: new Date().toISOString(),
        currency: 'INR',
        user: activeUser,
        financialData: state
      };

      const jsonStr = JSON.stringify(backupPackage, null, 2);

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(jsonStr);
        return true;
      }
      return false;
    }

    restoreBackup(jsonStringOrObject) {
      try {
        let pkg = jsonStringOrObject;
        if (typeof pkg === 'string') {
          pkg = JSON.parse(pkg);
        }

        if (!pkg || !pkg.financialData) {
          return { success: false, message: 'Invalid backup file. Missing financial data schema.' };
        }

        const restoredUser = pkg.user || {
          id: 'user_' + Date.now(),
          fullName: (pkg.financialData.user && pkg.financialData.user.fullName) || 'Restored User',
          email: (pkg.financialData.user && pkg.financialData.user.email) || 'restored@example.com',
          phone: (pkg.financialData.user && pkg.financialData.user.phone) || '9876543210',
          pin: '1234',
          monthlyIncome: (pkg.financialData.user && pkg.financialData.user.monthlyIncome) || 60000,
          createdAt: new Date().toISOString()
        };

        // Add or update account in registry
        const registry = this.getUsersRegistry();
        const existingIdx = registry.findIndex(u => u.id === restoredUser.id);
        if (existingIdx !== -1) {
          registry[existingIdx] = restoredUser;
        } else {
          registry.push(restoredUser);
        }
        this.saveUsersRegistry(registry);

        this.currentUser = restoredUser;
        this.setActiveSession(restoredUser.id, true);

        // Save financial state
        this.saveActiveUserState(pkg.financialData);

        // Switch live store
        if (window.appStore && typeof window.appStore.switchUser === 'function') {
          window.appStore.switchUser(pkg.financialData);
        }

        this.updateHeaderBadge();
        return { success: true, user: restoredUser };
      } catch (e) {
        return { success: false, message: 'Failed to parse backup data: ' + e.message };
      }
    }

    // ==========================================
    // INITIAL CLEAN STATE BUILDER
    // ==========================================
    createInitialUserState(account) {
      const inc = Number(account.monthlyIncome) || 50000;
      const rentBudget = Math.round(inc * 0.30);
      const foodBudget = Math.round(inc * 0.20);
      const shoppingBudget = Math.round(inc * 0.10);
      const transportBudget = Math.round(inc * 0.08);
      const utilitiesBudget = Math.round(inc * 0.07);
      const lifestyleBudget = Math.round(inc * 0.10);
      const othersBudget = Math.round(inc * 0.05);

      return {
        user: {
          fullName: account.fullName,
          dob: "1998-05-15",
          age: 28,
          city: account.city || "Mumbai",
          phone: account.phone || "+91 98765 00000",
          email: account.email || "user@example.com",
          monthlyIncome: inc,
          incomeSources: [
            {
              id: "inc-" + Date.now(),
              title: "Primary Salary / Main Inflow",
              amount: inc,
              frequency: "Monthly",
              type: "Fixed Salary"
            }
          ],
          employment: account.employment || "Private Sector",
          role: account.role || "Professional",
          riskProfile: "Moderate",
          investmentPreference: "Mutual Funds, Fixed Deposits",
          pan: "ABCDE1234F",
          kycStatus: "Verified",
          taxRegime: "New Tax Regime (FY 2026-27)"
        },
        selectedMonth: "October 2026",
        overview: {
          income: inc,
          expenses: 0,
          invested: 0,
          remaining: inc,
          alertBanner: {
            id: "alert-welcome",
            visible: true,
            type: "welcome",
            title: "Welcome to PaisaTrack!",
            message: `Account created for ${account.fullName}. Your data is automatically backed up in real-time.`,
            ctaText: "Add First Expense",
            linkTab: "spending"
          },
          upcomingActions: []
        },
        spending: {
          totalExpenses: 0,
          lastMonthExpenses: 0,
          growthPercent: 0,
          categories: [
            { id: "food", name: "Food & Dining", amount: 0, budget: foodBudget, percent: 0, icon: "utensils", color: "#d46b43", bg: "#fcf0eb" },
            { id: "rent", name: "Rent & Housing", amount: 0, budget: rentBudget, percent: 0, icon: "home", color: "#d46b43", bg: "#fcf0eb" },
            { id: "shopping", name: "Shopping", amount: 0, budget: shoppingBudget, percent: 0, icon: "shopping-bag", color: "#d46b43", bg: "#fcf0eb" },
            { id: "transport", name: "Transport", amount: 0, budget: transportBudget, percent: 0, icon: "car", color: "#d46b43", bg: "#fcf0eb" },
            { id: "utilities", name: "Utilities", amount: 0, budget: utilitiesBudget, percent: 0, icon: "zap", color: "#d46b43", bg: "#fcf0eb" },
            { id: "lifestyle", name: "Lifestyle", amount: 0, budget: lifestyleBudget, percent: 0, icon: "heart", color: "#d46b43", bg: "#fcf0eb" },
            { id: "others", name: "Others", amount: 0, budget: othersBudget, percent: 0, icon: "more-horizontal", color: "#d46b43", bg: "#fcf0eb" }
          ],
          fixedExpenses: [],
          upcomingExpenses: [],
          transactions: []
        },
        investments: {
          totalPortfolioValue: 0,
          gainPercent: 0,
          gainAmount: 0,
          period: "1Y",
          asOfDate: "Today",
          selectedFilter: "all",
          assetClasses: [
            { id: "mf", name: "Mutual Funds", amount: 0, percent: 0, icon: "trending-up", color: "#1d3c34", bg: "#e6efe9" },
            { id: "eq", name: "Equities", amount: 0, percent: 0, icon: "bar-chart-2", color: "#2563eb", bg: "#eff6ff" },
            { id: "ot", name: "Others (Gold / PPF / FD)", amount: 0, percent: 0, icon: "more-horizontal", color: "#d97706", bg: "#fef3c7" }
          ],
          topHoldings: [],
          history: [],
          sips: []
        },
        goals: [
          {
            id: "goal-" + Date.now(),
            title: "Emergency Contingency Fund",
            targetAmount: inc * 6,
            currentAmount: 0,
            targetDate: "2027-12-31",
            category: "Emergency",
            icon: "shield",
            recommendedMonthlySIP: Math.round((inc * 6) / 14),
            description: "Safety cushion equal to 6 months of expenses and salary."
          }
        ]
      };
    }

    // ==========================================
    // UI MODAL & HEADER HELPERS
    // ==========================================
    updateHeaderBadge() {
      const u = this.getActiveUser();
      const avatarEl = document.getElementById('headerUserAvatar');
      const nameEl = document.getElementById('headerUserName');
      const badgeEl = document.getElementById('headerUserSyncBadge');

      if (avatarEl) {
        const parts = (u.fullName || 'User').trim().split(/\s+/);
        const initials = parts.length > 1
          ? (parts[0][0] + parts[1][0]).toUpperCase()
          : parts[0].substring(0, 2).toUpperCase();
        avatarEl.textContent = initials;
      }

      if (nameEl) {
        const parts = (u.fullName || 'User').trim().split(/\s+/);
        const shortName = parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0];
        nameEl.textContent = shortName;
      }

      if (badgeEl) {
        badgeEl.setAttribute('title', `Active: ${u.fullName} • IndexedDB & LocalStorage Synced`);
      }
    }

    openAuthModal(tab = 'account') {
      if (typeof window.openModal === 'function') {
        window.openModal('authModal');
      } else {
        const modal = document.getElementById('authModal');
        if (modal) modal.classList.add('open');
      }
      this.switchModalTab(tab);
    }

    switchModalTab(tabName) {
      // Toggle tab buttons
      document.querySelectorAll('.auth-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-authtab') === tabName);
      });

      // Toggle tab panes
      const panes = {
        account: document.getElementById('authTabAccount'),
        login: document.getElementById('authTabLogin'),
        signup: document.getElementById('authTabSignup'),
        backup: document.getElementById('authTabBackup')
      };

      Object.keys(panes).forEach(k => {
        if (panes[k]) {
          panes[k].classList.toggle('active', k === tabName);
        }
      });

      const titleEl = document.getElementById('authModalTitle');
      const subEl = document.getElementById('authModalSubtitle');

      if (tabName === 'account') {
        if (titleEl) titleEl.textContent = 'Account & Switcher';
        if (subEl) subEl.textContent = 'Manage device profiles & cloud memory';
        this.renderAccountsList();
      } else if (tabName === 'login') {
        if (titleEl) titleEl.textContent = 'Log In to PaisaTrack';
        if (subEl) subEl.textContent = 'Access your personal ledger with your PIN';
      } else if (tabName === 'signup') {
        if (titleEl) titleEl.textContent = 'Create New Account';
        if (subEl) subEl.textContent = 'Isolated profile with custom income & budgets';
      } else if (tabName === 'backup') {
        if (titleEl) titleEl.textContent = 'Cloud & File Backup';
        if (subEl) subEl.textContent = 'Export or restore data anytime across devices';
      }
    }

    renderAccountsList() {
      const listContainer = document.getElementById('authAccountsList');
      if (!listContainer) return;

      const registry = this.getUsersRegistry();
      const activeId = this.getActiveUserId();

      let html = '';
      registry.forEach(acc => {
        const isActive = acc.id === activeId;
        const parts = (acc.fullName || 'User').trim().split(/\s+/);
        const initials = parts.length > 1
          ? (parts[0][0] + parts[1][0]).toUpperCase()
          : parts[0].substring(0, 2).toUpperCase();

        const formattedIncome = Number(acc.monthlyIncome || 0).toLocaleString('en-IN');

        html += `
          <div class="auth-account-card ${isActive ? 'is-active' : ''}">
            <div class="auth-account-avatar">${initials}</div>
            <div class="auth-account-info">
              <div class="auth-account-name-row">
                <span class="auth-account-name">${acc.fullName}</span>
                ${isActive ? '<span class="active-pill">Active</span>' : ''}
                ${acc.isDemo ? '<span class="demo-pill">Demo</span>' : ''}
              </div>
              <span class="auth-account-meta">${acc.email || acc.phone} • ₹${formattedIncome}/mo</span>
            </div>
            <div class="auth-account-actions">
              ${!isActive ? `<button type="button" class="btn-account-switch" onclick="authManager.handleSwitchClick('${acc.id}')">Switch</button>` : '<span class="synced-check">✓ Active</span>'}
              ${!acc.isDemo && !isActive ? `<button type="button" class="btn-account-delete" onclick="authManager.handleDeleteClick('${acc.id}')" title="Delete account">🗑️</button>` : ''}
            </div>
          </div>
        `;
      });

      listContainer.innerHTML = html;
    }

    handleSwitchClick(userId) {
      const res = this.switchAccount(userId);
      if (res.success) {
        if (typeof window.showToast === 'function') {
          window.showToast(`Switched account to ${res.user.fullName}!`, '✓');
        }
        if (typeof window.closeModal === 'function') {
          window.closeModal();
        }
      } else {
        if (typeof window.showToast === 'function') {
          window.showToast(res.message, '⚠️');
        }
      }
    }

    handleDeleteClick(userId) {
      if (confirm('Are you sure you want to remove this account and its data from this device?')) {
        const res = this.deleteAccount(userId);
        if (res.success) {
          this.renderAccountsList();
          if (typeof window.showToast === 'function') {
            window.showToast('Account removed from device', '🗑️');
          }
        }
      }
    }

    // ==========================================
    // DOM FORM BINDINGS
    // ==========================================
    setupDOMListeners() {
      // 1. Login Form Submit
      const loginForm = document.getElementById('authLoginForm');
      if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const identifier = document.getElementById('loginIdentifierInput')?.value;
          const pin = document.getElementById('loginPinInput')?.value;
          const rememberMe = document.getElementById('loginRememberMeCheck')?.checked ?? true;

          const res = this.loginUser({ identifier, pin, rememberMe });
          if (res.success) {
            loginForm.reset();
            if (typeof window.showToast === 'function') {
              window.showToast(`Welcome back, ${res.user.fullName}!`, '🎉');
            }
            if (typeof window.closeModal === 'function') {
              window.closeModal();
            }
          } else {
            const errEl = document.getElementById('loginErrorNotice');
            if (errEl) {
              errEl.textContent = res.message;
              errEl.style.display = 'block';
            }
            if (typeof window.showToast === 'function') {
              window.showToast(res.message, '⚠️');
            }
          }
        });
      }

      // 2. Signup Form Submit
      const signupForm = document.getElementById('authSignupForm');
      if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const fullName = document.getElementById('signupNameInput')?.value;
          const email = document.getElementById('signupEmailInput')?.value;
          const phone = document.getElementById('signupPhoneInput')?.value;
          const pin = document.getElementById('signupPinInput')?.value;
          const monthlyIncome = document.getElementById('signupIncomeInput')?.value;

          const res = this.registerUser({ fullName, email, phone, pin, monthlyIncome });
          if (res.success) {
            signupForm.reset();
            if (typeof window.showToast === 'function') {
              window.showToast(`Account created for ${res.user.fullName}!`, '🚀');
            }
            if (typeof window.closeModal === 'function') {
              window.closeModal();
            }
          } else {
            const errEl = document.getElementById('signupErrorNotice');
            if (errEl) {
              errEl.textContent = res.message;
              errEl.style.display = 'block';
            }
            if (typeof window.showToast === 'function') {
              window.showToast(res.message, '⚠️');
            }
          }
        });
      }

      // 3. Backup Download Button
      const btnExport = document.getElementById('btnExportBackup');
      if (btnExport) {
        btnExport.addEventListener('click', () => {
          this.exportBackup();
          if (typeof window.showToast === 'function') {
            window.showToast('Backup JSON file downloaded to device!', '📥');
          }
        });
      }

      // 4. Backup Copy to Clipboard Button
      const btnCopyBackup = document.getElementById('btnCopyBackupJSON');
      if (btnCopyBackup) {
        btnCopyBackup.addEventListener('click', async () => {
          const copied = await this.copyBackupToClipboard();
          if (copied) {
            if (typeof window.showToast === 'function') {
              window.showToast('Backup JSON copied to clipboard!', '📋');
            }
          } else {
            if (typeof window.showToast === 'function') {
              window.showToast('Unable to access clipboard. Please use Download.', '⚠️');
            }
          }
        });
      }

      // 5. Restore Backup File Input
      const fileInput = document.getElementById('restoreBackupFileInput');
      if (fileInput) {
        fileInput.addEventListener('change', (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = (event) => {
            const content = event.target.result;
            const res = this.restoreBackup(content);
            if (res.success) {
              fileInput.value = '';
              if (typeof window.showToast === 'function') {
                window.showToast(`Data restored successfully! Logged in as ${res.user.fullName}.`, '🎉');
              }
              if (typeof window.closeModal === 'function') {
                window.closeModal();
              }
            } else {
              if (typeof window.showToast === 'function') {
                window.showToast(res.message, '⚠️');
              }
            }
          };
          reader.readAsText(file);
        });
      }

      // 6. Restore from Textarea (Mobile fail-safe)
      const btnPasteRestore = document.getElementById('btnPasteRestore');
      if (btnPasteRestore) {
        btnPasteRestore.addEventListener('click', () => {
          const textarea = document.getElementById('restoreJSONTextarea');
          const val = textarea?.value?.trim();
          if (!val) {
            if (typeof window.showToast === 'function') {
              window.showToast('Please paste backup JSON code first.', '⚠️');
            }
            return;
          }
          const res = this.restoreBackup(val);
          if (res.success) {
            if (textarea) textarea.value = '';
            if (typeof window.showToast === 'function') {
              window.showToast(`Data restored successfully! Logged in as ${res.user.fullName}.`, '🎉');
            }
            if (typeof window.closeModal === 'function') {
              window.closeModal();
            }
          } else {
            if (typeof window.showToast === 'function') {
              window.showToast(res.message, '⚠️');
            }
          }
        });
      }

      // 7. Quick Demo Login button
      const btnQuickDemo = document.getElementById('btnQuickDemoLogin');
      if (btnQuickDemo) {
        btnQuickDemo.addEventListener('click', () => {
          this.loginAsDemo();
          if (typeof window.showToast === 'function') {
            window.showToast('Logged into Rahul Lodhi sample account!', '✓');
          }
          if (typeof window.closeModal === 'function') {
            window.closeModal();
          }
        });
      }

      // 8. Logout button
      const btnLogout = document.getElementById('btnLogoutAction');
      if (btnLogout) {
        btnLogout.addEventListener('click', () => {
          this.logout();
          if (typeof window.showToast === 'function') {
            window.showToast('Logged out. Switched to guest mode.', '👋');
          }
          if (typeof window.closeModal === 'function') {
            window.closeModal();
          }
        });
      }

      this.updateHeaderBadge();
    }
  }

  // Instantiate and bind to window
  window.authManager = new AuthManager();

  // Setup DOM listeners once document is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.authManager.setupDOMListeners();
    });
  } else {
    window.authManager.setupDOMListeners();
  }

})();
