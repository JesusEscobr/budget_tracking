import type {
  BudgetCategory,
  BudgetStatus,
  CategoryBreakdownItem,
  DailyCashflowPoint,
  MonthlySummary,
  MonthlyTrendPoint,
  RecurringFrequency,
  Transaction,
  TransactionFilters,
  TransactionInput,
} from '../types/budget';

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const MONTH_NAMES_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  options?: { signed?: boolean; compact?: boolean }
): string {
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: options?.compact && abs >= 1000 && abs % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(abs);

  if (options?.signed) {
    if (amount > 0) return `+${formatted}`;
    if (amount < 0) return `-${formatted}`;
    return formatted;
  }
  return amount < 0 ? `-${formatted}` : formatted;
}

export function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function formatMonthLabel(monthKey: string, style: 'long' | 'short' = 'long'): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const monthIdx = Number(monthStr) - 1;
  const year = Number(yearStr);
  if (!Number.isInteger(monthIdx) || monthIdx < 0 || monthIdx > 11 || !Number.isInteger(year)) {
    return monthKey;
  }
  const names = style === 'long' ? MONTH_NAMES_LONG : MONTH_NAMES_SHORT;
  return `${names[monthIdx]} ${year}`;
}

export function formatShortDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const monthIdx = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  if (monthIdx < 0 || monthIdx > 11 || !Number.isFinite(day)) return dateStr;
  return `${MONTH_NAMES_SHORT[monthIdx]} ${day}`;
}

export function getAvailableMonths(transactions: Transaction[], anchorMonth: string): string[] {
  const set = new Set<string>([anchorMonth]);
  for (const tx of transactions) {
    const key = getMonthKey(tx.date);
    if (/^\d{4}-\d{2}$/.test(key)) {
      set.add(key);
    }
  }
  return Array.from(set).sort((a, b) => b.localeCompare(a));
}

export function shiftMonthKey(monthKey: string, deltaMonths: number): string {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + deltaMonths, 1));
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilters
): Transaction[] {
  const searchLower = filters.search?.trim().toLowerCase() ?? '';
  const filtered = transactions.filter((tx) => {
    if (filters.monthKey && filters.monthKey !== 'all' && getMonthKey(tx.date) !== filters.monthKey) {
      return false;
    }
    if (filters.type && filters.type !== 'all' && tx.type !== filters.type) {
      return false;
    }
    if (filters.categoryId && filters.categoryId !== 'all' && tx.categoryId !== filters.categoryId) {
      return false;
    }
    if (filters.account && filters.account !== 'all' && tx.account !== filters.account) {
      return false;
    }
    if (searchLower) {
      const matchDesc = tx.description.toLowerCase().includes(searchLower);
      const matchAccount = tx.account.toLowerCase().includes(searchLower);
      const matchNotes = (tx.notes ?? '').toLowerCase().includes(searchLower);
      if (!matchDesc && !matchAccount && !matchNotes) {
        return false;
      }
    }
    return true;
  });

  const sortBy = filters.sortBy ?? 'date-desc';
  return [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'date-asc':
        return a.date.localeCompare(b.date) || a.id.localeCompare(b.id);
      case 'amount-desc':
        return b.amount - a.amount || b.date.localeCompare(a.date);
      case 'amount-asc':
        return a.amount - b.amount || b.date.localeCompare(a.date);
      case 'date-desc':
      default:
        return b.date.localeCompare(a.date) || b.id.localeCompare(a.id);
    }
  });
}

export function computeMonthlySummary(
  transactions: Transaction[],
  categories: BudgetCategory[],
  monthKey: string
): MonthlySummary {
  const monthTx = transactions.filter((tx) => getMonthKey(tx.date) === monthKey);
  let totalSpent = 0;
  let totalIncome = 0;

  for (const tx of monthTx) {
    if (tx.type === 'expense') {
      totalSpent += tx.amount;
    } else if (tx.type === 'income') {
      totalIncome += tx.amount;
    }
  }

  const totalBudget = categories
    .filter((c) => c.kind === 'expense')
    .reduce((sum, c) => sum + c.limit, 0);

  const netCashflow = Math.round((totalIncome - totalSpent) * 100) / 100;
  const remainingBudget = Math.round((totalBudget - totalSpent) * 100) / 100;
  const savingsRate =
    totalIncome > 0 ? Math.round(((totalIncome - totalSpent) / totalIncome) * 1000) / 10 : 0;
  const utilizationPct =
    totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 1000) / 10 : 0;

  return {
    monthKey,
    totalBudget: Math.round(totalBudget * 100) / 100,
    totalSpent: Math.round(totalSpent * 100) / 100,
    totalIncome: Math.round(totalIncome * 100) / 100,
    netCashflow,
    remainingBudget,
    savingsRate,
    utilizationPct,
  };
}

export function getBudgetStatus(spent: number, limit: number): BudgetStatus {
  if (limit <= 0) {
    return spent > 0 ? 'over-budget' : 'on-track';
  }
  if (spent > limit) return 'over-budget';
  if (spent / limit >= 0.8) return 'near-limit';
  return 'on-track';
}

export function computeCategoryBreakdown(
  transactions: Transaction[],
  categories: BudgetCategory[],
  monthKey: string
): CategoryBreakdownItem[] {
  const monthExpenses = transactions.filter(
    (tx) => tx.type === 'expense' && getMonthKey(tx.date) === monthKey
  );

  const spendByCat = new Map<string, { spent: number; count: number }>();
  for (const tx of monthExpenses) {
    const prev = spendByCat.get(tx.categoryId) ?? { spent: 0, count: 0 };
    spendByCat.set(tx.categoryId, {
      spent: prev.spent + tx.amount,
      count: prev.count + 1,
    });
  }

  return categories
    .filter((cat) => cat.kind === 'expense')
    .map((category) => {
      const entry = spendByCat.get(category.id) ?? { spent: 0, count: 0 };
      const spent = Math.round(entry.spent * 100) / 100;
      const remaining = Math.round((category.limit - spent) * 100) / 100;
      const pct =
        category.limit > 0
          ? Math.round((spent / category.limit) * 1000) / 10
          : spent > 0
            ? 100
            : 0;
      const status = getBudgetStatus(spent, category.limit);

      return {
        category,
        spent,
        limit: category.limit,
        remaining,
        pct,
        status,
        transactionCount: entry.count,
      };
    })
    .sort((a, b) => b.spent - a.spent || b.limit - a.limit);
}

export function getDaysInMonth(monthKey: string): number {
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return 30;
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function computeDailyCashflow(
  transactions: Transaction[],
  monthKey: string
): DailyCashflowPoint[] {
  const daysCount = getDaysInMonth(monthKey);
  const points: DailyCashflowPoint[] = [];

  for (let d = 1; d <= daysCount; d++) {
    const dayStr = String(d).padStart(2, '0');
    points.push({
      day: d,
      date: `${monthKey}-${dayStr}`,
      income: 0,
      expense: 0,
    });
  }

  for (const tx of transactions) {
    if (getMonthKey(tx.date) !== monthKey) continue;
    const day = Number(tx.date.slice(8, 10));
    if (day >= 1 && day <= daysCount) {
      const target = points[day - 1];
      if (tx.type === 'income') {
        target.income = Math.round((target.income + tx.amount) * 100) / 100;
      } else {
        target.expense = Math.round((target.expense + tx.amount) * 100) / 100;
      }
    }
  }

  return points;
}

export function computeMonthlyTrends(
  transactions: Transaction[],
  anchorMonth: string,
  count: number = 4
): MonthlyTrendPoint[] {
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    months.push(shiftMonthKey(anchorMonth, -i));
  }

  return months.map((monthKey) => {
    let income = 0;
    let expense = 0;
    for (const tx of transactions) {
      if (getMonthKey(tx.date) !== monthKey) continue;
      if (tx.type === 'income') income += tx.amount;
      else expense += tx.amount;
    }
    income = Math.round(income * 100) / 100;
    expense = Math.round(expense * 100) / 100;
    return {
      monthKey,
      label: formatMonthLabel(monthKey, 'short'),
      income,
      expense,
      net: Math.round((income - expense) * 100) / 100,
    };
  });
}

export function advanceDueDate(dateStr: string, frequency: RecurringFrequency): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;

  if (frequency === 'weekly') {
    const dt = new Date(Date.UTC(y, m - 1, d + 7));
    return dt.toISOString().slice(0, 10);
  }
  if (frequency === 'yearly') {
    const targetYear = y + 1;
    const maxDay = new Date(Date.UTC(targetYear, m, 0)).getUTCDate();
    const clampedDay = Math.min(d, maxDay);
    return `${targetYear}-${String(m).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
  }
  // monthly
  const dt = new Date(Date.UTC(y, m, 1));
  const targetYear = dt.getUTCFullYear();
  const targetMonth = dt.getUTCMonth() + 1;
  const maxDay = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  const clampedDay = Math.min(d, maxDay);
  return `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
}

export function isValidIsoDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export function validateTransactionInput(input: Partial<TransactionInput>): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.description || !input.description.trim()) {
    errors.description = 'Enter a merchant or description.';
  }
  const numAmount = typeof input.amount === 'number' ? input.amount : Number(input.amount);
  if (!Number.isFinite(numAmount) || numAmount <= 0) {
    errors.amount = 'Enter a valid amount greater than 0.';
  }
  if (!input.date || !isValidIsoDate(input.date)) {
    errors.date = 'Select a valid calendar date.';
  }
  if (!input.categoryId || !input.categoryId.trim()) {
    errors.categoryId = 'Select a category.';
  }
  if (!input.account || !input.account.trim()) {
    errors.account = 'Select an account.';
  }
  return errors;
}

export function transactionsToCsv(
  transactions: Transaction[],
  categories: BudgetCategory[]
): string {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const escape = (val: string) => {
    if (/[",\n]/.test(val)) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };
  const header = ['Date', 'Description', 'Type', 'Category', 'Account', 'Amount', 'Notes'].join(',');
  const rows = transactions.map((tx) => {
    const signedAmount = tx.type === 'expense' ? -tx.amount : tx.amount;
    return [
      escape(tx.date),
      escape(tx.description),
      escape(tx.type),
      escape(catMap.get(tx.categoryId) ?? tx.categoryId),
      escape(tx.account),
      signedAmount.toFixed(2),
      escape(tx.notes ?? ''),
    ].join(',');
  });
  return [header, ...rows].join('\n');
}
