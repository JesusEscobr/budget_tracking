import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Download,
  LayoutDashboard,
  ListOrdered,
  Menu,
  Moon,
  PiggyBank,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Sun,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { BudgetsView } from './components/BudgetsView';
import { GoalsView } from './components/GoalsView';
import { OverviewView } from './components/OverviewView';
import { RecurringView } from './components/RecurringView';
import { TransactionModal } from './components/TransactionModal';
import { TransactionsView } from './components/TransactionsView';
import { INITIAL_BUDGET_STATE } from './data/seedData';
import type {
  BudgetState,
  NavSection,
  RecurringBill,
  SavingsGoal,
  Transaction,
} from './types/budget';
import {
  advanceDueDate,
  computeCategoryBreakdown,
  computeDailyCashflow,
  computeMonthlySummary,
  computeMonthlyTrends,
  filterTransactions,
  formatMonthLabel,
  getAvailableMonths,
  shiftMonthKey,
} from './utils/budgetMath';
import {
  applyTheme,
  clearBudgetState,
  loadBudgetState,
  loadTheme,
  saveBudgetState,
  type ThemeMode,
} from './utils/storage';

const ANCHOR_MONTH = '2026-11';
const TODAY_ISO = '2026-11-15';

const NAV_ITEMS: { id: NavSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ListOrdered },
  { id: 'budgets', label: 'Budgets', icon: SlidersHorizontal },
  { id: 'recurring', label: 'Recurring', icon: CalendarClock },
  { id: 'goals', label: 'Goals', icon: PiggyBank },
];

export default function App() {
  const [state, setState] = useState<BudgetState>(() => loadBudgetState());
  const [theme, setTheme] = useState<ThemeMode>(() => loadTheme());
  const [activeSection, setActiveSection] = useState<NavSection>('overview');
  const [selectedMonth, setSelectedMonth] = useState<string>(ANCHOR_MONTH);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    saveBudgetState(state);
  }, [state]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const availableMonths = useMemo(
    () => getAvailableMonths(state.transactions, selectedMonth),
    [state.transactions, selectedMonth]
  );

  const summary = useMemo(
    () => computeMonthlySummary(state.transactions, state.categories, selectedMonth),
    [state.transactions, state.categories, selectedMonth]
  );

  const breakdown = useMemo(
    () => computeCategoryBreakdown(state.transactions, state.categories, selectedMonth),
    [state.transactions, state.categories, selectedMonth]
  );

  const dailyPoints = useMemo(
    () => computeDailyCashflow(state.transactions, selectedMonth),
    [state.transactions, selectedMonth]
  );

  const monthlyTrends = useMemo(
    () => computeMonthlyTrends(state.transactions, selectedMonth, 4),
    [state.transactions, selectedMonth]
  );

  const monthTransactions = useMemo(
    () =>
      filterTransactions(state.transactions, {
        monthKey: selectedMonth,
        sortBy: 'date-desc',
      }),
    [state.transactions, selectedMonth]
  );

  const handleSaveTransaction = (data: Omit<Transaction, 'id'>, existingId?: string) => {
    if (existingId) {
      setState((prev) => ({
        ...prev,
        transactions: prev.transactions.map((t) =>
          t.id === existingId ? { ...data, id: existingId } : t
        ),
      }));
    } else {
      const newTx: Transaction = {
        ...data,
        id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      };
      setState((prev) => ({
        ...prev,
        transactions: [newTx, ...prev.transactions],
      }));
      setSelectedMonth(data.date.slice(0, 7));
    }
    setEditingTx(null);
  };

  const handleDeleteTransaction = (id: string) => {
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  };

  const handleUpdateCategoryLimit = (categoryId: string, newLimit: number) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === categoryId ? { ...c, limit: newLimit } : c
      ),
    }));
  };

  const handleAddCategory = (name: string, limit: number, color: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const id = `${slug || 'cat'}-${Date.now().toString(36).slice(-4)}`;
    setState((prev) => ({
      ...prev,
      categories: [
        ...prev.categories,
        { id, name, limit, color, kind: 'expense' },
      ],
    }));
  };

  const handleDeleteCategory = (categoryId: string) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== categoryId),
    }));
  };

  const handleMarkBillPaid = (billId: string) => {
    setState((prev) => {
      const bill = prev.recurringBills.find((b) => b.id === billId);
      if (!bill) return prev;
      const paidDate = TODAY_ISO;
      const newTx: Transaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        date: paidDate,
        description: bill.name,
        amount: bill.amount,
        type: 'expense',
        categoryId: bill.categoryId,
        account: bill.account,
        notes: 'Recurring bill payment',
      };
      return {
        ...prev,
        transactions: [newTx, ...prev.transactions],
        recurringBills: prev.recurringBills.map((b) =>
          b.id === billId
            ? {
                ...b,
                lastPaidDate: paidDate,
                nextDueDate: advanceDueDate(b.nextDueDate, b.frequency),
              }
            : b
        ),
      };
    });
  };

  const handleAddBill = (billData: Omit<RecurringBill, 'id'>) => {
    const newBill: RecurringBill = {
      ...billData,
      id: `rec-${Date.now().toString(36)}`,
    };
    setState((prev) => ({
      ...prev,
      recurringBills: [...prev.recurringBills, newBill],
    }));
  };

  const handleDeleteBill = (billId: string) => {
    setState((prev) => ({
      ...prev,
      recurringBills: prev.recurringBills.filter((b) => b.id !== billId),
    }));
  };

  const handleContributeGoal = (goalId: string, amount: number) => {
    setState((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.map((g) =>
        g.id === goalId
          ? { ...g, currentAmount: Math.round((g.currentAmount + amount) * 100) / 100 }
          : g
      ),
    }));
  };

  const handleAddGoal = (goalData: Omit<SavingsGoal, 'id'>) => {
    const newGoal: SavingsGoal = {
      ...goalData,
      id: `goal-${Date.now().toString(36)}`,
    };
    setState((prev) => ({
      ...prev,
      savingsGoals: [...prev.savingsGoals, newGoal],
    }));
  };

  const handleDeleteGoal = (goalId: string) => {
    setState((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.filter((g) => g.id !== goalId),
    }));
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clearledger-backup-${TODAY_ISO}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleResetDemo = () => {
    clearBudgetState();
    setState(INITIAL_BUDGET_STATE);
    setSelectedMonth(ANCHOR_MONTH);
    setConfirmReset(false);
  };

  const activeNavLabel =
    NAV_ITEMS.find((n) => n.id === activeSection)?.label ?? 'Overview';

  const defaultModalDate =
    selectedMonth === ANCHOR_MONTH ? TODAY_ISO : `${selectedMonth}-15`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex">
          <div className="flex h-16 items-center border-b border-slate-200 px-6 dark:border-slate-800">
            <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap dark:text-slate-100">
              ClearLedger
            </span>
          </div>

          <nav aria-label="Primary Navigation" className="flex-1 space-y-1 px-3 py-5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="space-y-2 border-t border-slate-200 p-4 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 whitespace-nowrap"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Light Mode</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Export Backup JSON</span>
            </button>

            {confirmReset ? (
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={handleResetDemo}
                  className="flex-1 rounded-md bg-rose-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-rose-700 whitespace-nowrap"
                >
                  Confirm Reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300 whitespace-nowrap"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 whitespace-nowrap"
              >
                <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Reset Demo Data</span>
              </button>
            )}
          </div>
        </aside>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-slate-950/40"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="relative z-10 flex w-64 flex-col bg-white dark:bg-slate-900">
              <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
                <span className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  ClearLedger
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav aria-label="Mobile Navigation" className="flex-1 space-y-1 p-3">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveSection(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                        isActive
                          ? 'bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="border-t border-slate-200 p-3 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  {theme === 'light' ? (
                    <>
                      <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Dark Mode</span>
                    </>
                  ) : (
                    <>
                      <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Light Mode</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Viewport */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:h-16 lg:flex-nowrap lg:px-8 lg:py-0 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2 text-sm min-w-0">
                <span className="font-medium text-slate-400 dark:text-slate-500 hidden sm:inline whitespace-nowrap">
                  ClearLedger
                </span>
                <span className="text-slate-300 dark:text-slate-700 hidden sm:inline" aria-hidden="true">
                  /
                </span>
                <h1 className="font-display text-base font-semibold text-slate-900 whitespace-nowrap dark:text-slate-100">
                  {activeNavLabel}
                </h1>
              </div>
            </div>

            <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-3">
              {/* Month Switcher */}
              <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-950">
                <button
                  type="button"
                  onClick={() => setSelectedMonth((m) => shiftMonthKey(m, -1))}
                  aria-label="Previous month"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <select
                  aria-label="Select billing month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none dark:text-slate-200"
                >
                  {availableMonths.map((mk) => (
                    <option key={mk} value={mk} className="bg-white dark:bg-slate-900">
                      {formatMonthLabel(mk)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setSelectedMonth((m) => shiftMonthKey(m, 1))}
                  aria-label="Next month"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingTx(null);
                  setTxModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs sm:px-4 sm:text-sm font-medium text-white transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:bg-teal-600 dark:hover:bg-teal-500 whitespace-nowrap shrink-0"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Add Transaction</span>
              </button>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1320px] flex-1 p-4 sm:p-6 lg:p-8">
            {activeSection === 'overview' && (
              <OverviewView
                monthKey={selectedMonth}
                currency={state.currency}
                summary={summary}
                breakdown={breakdown}
                dailyPoints={dailyPoints}
                monthlyTrends={monthlyTrends}
                recentTransactions={monthTransactions}
                categories={state.categories}
                recurringBills={state.recurringBills}
                savingsGoals={state.savingsGoals}
                onNavigate={setActiveSection}
                onAddTransaction={() => {
                  setEditingTx(null);
                  setTxModalOpen(true);
                }}
                onMarkBillPaid={handleMarkBillPaid}
              />
            )}

            {activeSection === 'transactions' && (
              <TransactionsView
                transactions={state.transactions}
                categories={state.categories}
                monthKey={selectedMonth}
                currency={state.currency}
                onAddTransaction={() => {
                  setEditingTx(null);
                  setTxModalOpen(true);
                }}
                onEditTransaction={(tx) => {
                  setEditingTx(tx);
                  setTxModalOpen(true);
                }}
                onDeleteTransaction={handleDeleteTransaction}
              />
            )}

            {activeSection === 'budgets' && (
              <BudgetsView
                monthKey={selectedMonth}
                currency={state.currency}
                summary={summary}
                breakdown={breakdown}
                onUpdateLimit={handleUpdateCategoryLimit}
                onAddCategory={handleAddCategory}
                onDeleteCategory={handleDeleteCategory}
              />
            )}

            {activeSection === 'recurring' && (
              <RecurringView
                bills={state.recurringBills}
                categories={state.categories}
                currency={state.currency}
                defaultDate={defaultModalDate}
                onMarkPaid={handleMarkBillPaid}
                onAddBill={handleAddBill}
                onDeleteBill={handleDeleteBill}
              />
            )}

            {activeSection === 'goals' && (
              <GoalsView
                goals={state.savingsGoals}
                currency={state.currency}
                onContribute={handleContributeGoal}
                onAddGoal={handleAddGoal}
                onDeleteGoal={handleDeleteGoal}
              />
            )}
          </main>
        </div>
      </div>

      <TransactionModal
        isOpen={txModalOpen}
        onClose={() => {
          setTxModalOpen(false);
          setEditingTx(null);
        }}
        onSave={handleSaveTransaction}
        categories={state.categories}
        editingTransaction={editingTx}
        defaultDate={defaultModalDate}
      />
    </div>
  );
}
