import { Download, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DEFAULT_ACCOUNTS } from '../data/seedData';
import type { BudgetCategory, Transaction, TransactionFilters } from '../types/budget';
import {
  filterTransactions,
  formatCurrency,
  formatMonthLabel,
  transactionsToCsv,
} from '../utils/budgetMath';

interface TransactionsViewProps {
  transactions: Transaction[];
  categories: BudgetCategory[];
  monthKey: string;
  currency: string;
  onAddTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export function TransactionsView({
  transactions,
  categories,
  monthKey,
  currency,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}: TransactionsViewProps) {
  const [scopeAllMonths, setScopeAllMonths] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [categoryId, setCategoryId] = useState('all');
  const [account, setAccount] = useState('all');
  const [sortBy, setSortBy] = useState<TransactionFilters['sortBy']>('date-desc');

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const filtered = useMemo(
    () =>
      filterTransactions(transactions, {
        monthKey: scopeAllMonths ? 'all' : monthKey,
        search,
        type: typeFilter,
        categoryId,
        account,
        sortBy,
      }),
    [transactions, scopeAllMonths, monthKey, search, typeFilter, categoryId, account, sortBy]
  );

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of filtered) {
      if (tx.type === 'income') income += tx.amount;
      else expense += tx.amount;
    }
    return {
      income,
      expense,
      net: income - expense,
    };
  }, [filtered]);

  const hasActiveFilters =
    search.trim() !== '' || typeFilter !== 'all' || categoryId !== 'all' || account !== 'all';

  const handleClearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setCategoryId('all');
    setAccount('all');
  };

  const handleExportCsv = () => {
    const csv = transactionsToCsv(filtered, categories);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clearledger-${scopeAllMonths ? 'all' : monthKey}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Filter Toolbar */}
      <section
        aria-label="Ledger Filters"
        className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2.5">
            <div className="relative min-w-[190px] flex-1 xl:max-w-[230px]">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Search transactions"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search merchant or notes..."
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div
              role="group"
              aria-label="Filter by entry type"
              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800 shrink-0"
            >
              {(['all', 'expense', 'income'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    typeFilter === t
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {t === 'all' ? 'All' : t === 'expense' ? 'Expenses' : 'Income'}
                </button>
              ))}
            </div>

            <select
              aria-label="Filter by category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by account"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
            >
              <option value="all">All Accounts</option>
              {DEFAULT_ACCOUNTS.map((acc) => (
                <option key={acc} value={acc}>
                  {acc}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setScopeAllMonths((prev) => !prev)}
              className={`rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                scopeAllMonths
                  ? 'border-teal-600 bg-teal-50 text-teal-800 dark:border-teal-500 dark:bg-teal-950/40 dark:text-teal-300'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {scopeAllMonths ? 'All Months' : `Month: ${formatMonthLabel(monthKey, 'short')}`}
            </button>

            <select
              aria-label="Sort transactions"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as TransactionFilters['sortBy'])}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Summary Metrics Strip */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono tabular-nums">
              {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Income:{' '}
              <strong className="font-mono font-semibold text-emerald-700 tabular-nums dark:text-emerald-400">
                {formatCurrency(totals.income, currency)}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Spent:{' '}
              <strong className="font-mono font-semibold text-slate-900 tabular-nums dark:text-slate-100">
                {formatCurrency(totals.expense, currency)}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Net:{' '}
              <strong
                className={`font-mono font-semibold tabular-nums ${
                  totals.net >= 0
                    ? 'text-teal-700 dark:text-teal-400'
                    : 'text-rose-700 dark:text-rose-400'
                }`}
              >
                {formatCurrency(totals.net, currency, { signed: true })}
              </strong>
            </span>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-medium text-teal-700 hover:underline dark:text-teal-400"
            >
              Clear Filters
            </button>
          )}
        </div>
      </section>

      {/* Ledger Table */}
      <section
        aria-label="Transactions Table"
        className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      >
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {hasActiveFilters
                ? 'No transactions match your current filters'
                : `No transactions recorded for ${formatMonthLabel(monthKey)}`}
            </p>
            <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
              {hasActiveFilters
                ? 'Adjust your search query, category, or account filter to inspect matching entries.'
                : 'Add an expense or income deposit to start tracking your ledger.'}
            </p>
            <div className="mt-4 flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  Clear Filters
                </button>
              )}
              <button
                type="button"
                onClick={onAddTransaction}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-medium text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Add Transaction</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" data-testid="transactions-table">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Account</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-6 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filtered.map((tx) => {
                  const cat = categoryMap.get(tx.categoryId);
                  const signedAmount = tx.type === 'income' ? tx.amount : -tx.amount;
                  return (
                    <tr
                      key={tx.id}
                      className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-6 py-3 font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap dark:text-slate-400">
                        {tx.date}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {tx.description}
                        </div>
                        {tx.notes && (
                          <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {tx.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap dark:text-slate-300">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-xs shrink-0"
                            style={{ backgroundColor: cat?.color ?? '#64748B' }}
                            aria-hidden="true"
                          />
                          <span>{cat?.name ?? tx.categoryId}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap dark:text-slate-400">
                        {tx.account}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono text-sm font-medium tabular-nums whitespace-nowrap ${
                          tx.type === 'income'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {formatCurrency(signedAmount, currency, { signed: true })}
                      </td>
                      <td className="px-6 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onEditTransaction(tx)}
                            aria-label={`Edit '${tx.description}'`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteTransaction(tx.id)}
                            aria-label={`Delete '${tx.description}'`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:text-slate-400 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
