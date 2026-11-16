import { INITIAL_BUDGET_STATE } from '../data/seedData';
import type { BudgetState } from '../types/budget';

const STORAGE_KEY = 'clearledger_budget_state_v1';
const THEME_KEY = 'clearledger_theme_v1';

export type ThemeMode = 'light' | 'dark';

export function loadBudgetState(): BudgetState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_BUDGET_STATE;
    const parsed = JSON.parse(raw) as Partial<BudgetState>;
    if (
      !parsed ||
      !Array.isArray(parsed.transactions) ||
      !Array.isArray(parsed.categories)
    ) {
      return INITIAL_BUDGET_STATE;
    }
    return {
      currency: typeof parsed.currency === 'string' ? parsed.currency : 'USD',
      transactions: parsed.transactions,
      categories: parsed.categories,
      recurringBills: Array.isArray(parsed.recurringBills)
        ? parsed.recurringBills
        : INITIAL_BUDGET_STATE.recurringBills,
      savingsGoals: Array.isArray(parsed.savingsGoals)
        ? parsed.savingsGoals
        : INITIAL_BUDGET_STATE.savingsGoals,
    };
  } catch {
    return INITIAL_BUDGET_STATE;
  }
}

export function saveBudgetState(state: BudgetState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors in restricted environments
  }
}

export function clearBudgetState(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function loadTheme(): ThemeMode {
  try {
    const raw = window.localStorage.getItem(THEME_KEY);
    if (raw === 'dark' || raw === 'light') return raw;
  } catch {
    // Ignore storage errors
  }
  return 'light';
}

export function applyTheme(theme: ThemeMode): void {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Ignore storage errors
  }
}
