import { ArrowRight, Plus } from 'lucide-react';
import type {
  BudgetCategory,
  CategoryBreakdownItem,
  DailyCashflowPoint,
  MonthlySummary,
  MonthlyTrendPoint,
  NavSection,
  RecurringBill,
  SavingsGoal,
  Transaction,
} from '../types/budget';
import { formatCurrency, formatMonthLabel, formatShortDate } from '../utils/budgetMath';
import { CashflowCharts } from './CashflowCharts';
import { StatusIndicator } from './StatusIndicator';

interface OverviewViewProps {
  monthKey: string;
  currency: string;
  summary: MonthlySummary;
  breakdown: CategoryBreakdownItem[];
  dailyPoints: DailyCashflowPoint[];
  monthlyTrends: MonthlyTrendPoint[];
  recentTransactions: Transaction[];
  categories: BudgetCategory[];
  recurringBills: RecurringBill[];
  savingsGoals: SavingsGoal[];
  onNavigate: (section: NavSection) => void;
  onAddTransaction: () => void;
  onMarkBillPaid: (billId: string) => void;
}

export function OverviewView({
  monthKey,
  currency,
  summary,
  breakdown,
  dailyPoints,
  monthlyTrends,
  recentTransactions,
  categories,
  recurringBills,
  savingsGoals,
  onNavigate,
  onAddTransaction,
  onMarkBillPaid,
}: OverviewViewProps) {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const topCategories = breakdown.slice(0, 5);
  const upcomingBills = [...recurringBills]
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* 4-Column KPI Summary Strip */}
      <section aria-label="Monthly Summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Spent · {formatMonthLabel(monthKey, 'short')}
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-slate-900 tabular-nums dark:text-slate-100">
            {formatCurrency(summary.totalSpent, currency)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums dark:text-slate-400">
            {summary.utilizationPct}% of {formatCurrency(summary.totalBudget, currency)} budget
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Remaining Safe-to-Spend
          </p>
          <p
            className={`mt-2 font-mono text-2xl font-semibold tracking-tight tabular-nums ${
              summary.remainingBudget < 0
                ? 'text-rose-700 dark:text-rose-400'
                : 'text-slate-900 dark:text-slate-100'
            }`}
          >
            {formatCurrency(summary.remainingBudget, currency)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {summary.remainingBudget < 0 ? 'Over monthly category cap' : 'Left across expense envelopes'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Monthly Income
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-emerald-700 tabular-nums dark:text-emerald-400">
            {formatCurrency(summary.totalIncome, currency)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Payroll, freelance & interest
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Net Cashflow
          </p>
          <p
            className={`mt-2 font-mono text-2xl font-semibold tracking-tight tabular-nums ${
              summary.netCashflow >= 0
                ? 'text-teal-700 dark:text-teal-400'
                : 'text-rose-700 dark:text-rose-400'
            }`}
          >
            {formatCurrency(summary.netCashflow, currency, { signed: true })}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums dark:text-slate-400">
            {summary.totalIncome > 0
              ? `Savings rate ${summary.savingsRate}%`
              : 'No income logged this month'}
          </p>
        </div>
      </section>

      {/* Primary Analytics Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        <div className="lg:col-span-7">
          <CashflowCharts
            dailyPoints={dailyPoints}
            monthlyTrends={monthlyTrends}
            currency={currency}
          />
        </div>

        <section
          aria-label="Category Envelope Health"
          className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:col-span-5"
        >
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Top Budget Envelopes
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Spending against monthly category limits
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('budgets')}
              className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 whitespace-nowrap shrink-0"
            >
              <span>Manage Budgets</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800/80">
            {topCategories.map((item) => {
              const barPct = Math.min(100, item.pct);
              const barColor =
                item.status === 'over-budget'
                  ? 'bg-rose-600 dark:bg-rose-500'
                  : item.status === 'near-limit'
                    ? 'bg-amber-500 dark:bg-amber-400'
                    : 'bg-teal-600 dark:bg-teal-500';

              return (
                <div key={item.category.id} className="py-3 first:pt-1 last:pb-1">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {item.category.name}
                    </span>
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusIndicator status={item.status} />
                      <span className="font-mono text-xs text-slate-600 tabular-nums dark:text-slate-400">
                        {formatCurrency(item.spent, currency)} / {formatCurrency(item.limit, currency)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-200 ${barColor}`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Operational Row: Recent Ledger + Recurring & Goals */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section
          aria-label="Recent Transactions"
          className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:col-span-7"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Recent Transactions
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Latest activity in {formatMonthLabel(monthKey)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('transactions')}
              className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 whitespace-nowrap shrink-0"
            >
              <span>Full Ledger</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                No transactions logged for {formatMonthLabel(monthKey)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Record an expense or income deposit to start tracking this month.
              </p>
              <button
                type="button"
                onClick={onAddTransaction}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-medium text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Log First Entry</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <th className="px-6 py-2.5 font-medium">Date</th>
                    <th className="px-4 py-2.5 font-medium">Merchant</th>
                    <th className="px-4 py-2.5 font-medium">Category</th>
                    <th className="px-6 py-2.5 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {recentTransactions.slice(0, 6).map((tx) => {
                    const cat = categoryMap.get(tx.categoryId);
                    const signedAmount = tx.type === 'income' ? tx.amount : -tx.amount;
                    return (
                      <tr
                        key={tx.id}
                        className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-6 py-3 font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap dark:text-slate-400">
                          {formatShortDate(tx.date)}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                          <div className="truncate max-w-[220px]">{tx.description}</div>
                          <div className="text-xs font-normal text-slate-500 dark:text-slate-400">
                            {tx.account}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap dark:text-slate-400">
                          {cat?.name ?? tx.categoryId}
                        </td>
                        <td
                          className={`px-6 py-3 text-right font-mono text-sm font-medium tabular-nums whitespace-nowrap ${
                            tx.type === 'income'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {formatCurrency(signedAmount, currency, { signed: true })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="flex flex-col gap-6 lg:col-span-5">
          {/* Upcoming Bills */}
          <section
            aria-label="Upcoming Bills"
            className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-3 flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Upcoming Bills
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('recurring')}
                className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 whitespace-nowrap"
              >
                <span>All Recurring</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {upcomingBills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-1 last:pb-1">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {bill.name}
                    </p>
                    <p className="text-xs text-slate-500 tabular-nums dark:text-slate-400">
                      Due {formatShortDate(bill.nextDueDate)} · {bill.account}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-sm font-medium text-slate-900 tabular-nums dark:text-slate-100">
                      {formatCurrency(bill.amount, currency)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onMarkBillPaid(bill.id)}
                      aria-label={`Mark ${bill.name} as paid`}
                      className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap"
                    >
                      Mark Paid
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Savings Goals Snapshot */}
          <section
            aria-label="Savings Goals"
            className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-3 flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Savings Goals
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('goals')}
                className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 whitespace-nowrap"
              >
                <span>View Goals</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3.5">
              {savingsGoals.slice(0, 3).map((goal) => {
                const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
                return (
                  <div key={goal.id}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium text-slate-900 dark:text-slate-100">
                        {goal.name}
                      </span>
                      <span className="font-mono text-xs text-slate-600 tabular-nums shrink-0 dark:text-slate-400">
                        {formatCurrency(goal.currentAmount, currency)} / {formatCurrency(goal.targetAmount, currency)}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-teal-600 dark:bg-teal-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-slate-500 tabular-nums w-9 text-right dark:text-slate-400">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
