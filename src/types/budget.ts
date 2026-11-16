export type TransactionType = 'expense' | 'income';

export type NavSection = 'overview' | 'transactions' | 'budgets' | 'recurring' | 'goals';

export type BudgetStatus = 'on-track' | 'near-limit' | 'over-budget';

export type RecurringFrequency = 'monthly' | 'weekly' | 'yearly';

export interface BudgetCategory {
  id: string;
  name: string;
  limit: number;
  color: string;
  kind: TransactionType;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // Always positive; direction determined by type
  type: TransactionType;
  categoryId: string;
  account: string;
  notes?: string;
}

export interface TransactionInput {
  date: string;
  description: string;
  amount: string | number;
  type: TransactionType;
  categoryId: string;
  account: string;
  notes?: string;
}

export interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  account: string;
  frequency: RecurringFrequency;
  nextDueDate: string; // YYYY-MM-DD
  lastPaidDate?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
}

export interface BudgetState {
  transactions: Transaction[];
  categories: BudgetCategory[];
  recurringBills: RecurringBill[];
  savingsGoals: SavingsGoal[];
  currency: string;
}

export interface TransactionFilters {
  monthKey?: string;
  search?: string;
  type?: 'all' | TransactionType;
  categoryId?: string;
  account?: string;
  sortBy?: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
}

export interface MonthlySummary {
  monthKey: string;
  totalBudget: number;
  totalSpent: number;
  totalIncome: number;
  netCashflow: number;
  remainingBudget: number;
  savingsRate: number;
  utilizationPct: number;
}

export interface CategoryBreakdownItem {
  category: BudgetCategory;
  spent: number;
  limit: number;
  remaining: number;
  pct: number;
  status: BudgetStatus;
  transactionCount: number;
}

export interface DailyCashflowPoint {
  day: number;
  date: string;
  income: number;
  expense: number;
}

export interface MonthlyTrendPoint {
  monthKey: string;
  label: string;
  income: number;
  expense: number;
  net: number;
}
