import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type { CategoryBreakdownItem, MonthlySummary } from '../types/budget';
import { formatCurrency, formatMonthLabel } from '../utils/budgetMath';
import { StatusIndicator } from './StatusIndicator';

const CATEGORY_COLORS = [
  '#0F766E',
  '#0284C7',
  '#D97706',
  '#475569',
  '#6366F1',
  '#059669',
  '#DC2626',
  '#7C3AED',
];

interface BudgetsViewProps {
  monthKey: string;
  currency: string;
  summary: MonthlySummary;
  breakdown: CategoryBreakdownItem[];
  onUpdateLimit: (categoryId: string, newLimit: number) => void;
  onAddCategory: (name: string, limit: number, color: string) => void;
  onDeleteCategory: (categoryId: string) => void;
}

export function BudgetsView({
  monthKey,
  currency,
  summary,
  breakdown,
  onUpdateLimit,
  onAddCategory,
  onDeleteCategory,
}: BudgetsViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [limitDraft, setLimitDraft] = useState('');
  const [limitError, setLimitError] = useState('');

  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLimit, setNewLimit] = useState('');
  const [newColor, setNewColor] = useState(CATEGORY_COLORS[0]);
  const [newError, setNewError] = useState('');

  const startEdit = (item: CategoryBreakdownItem) => {
    setEditingId(item.category.id);
    setLimitDraft(String(item.limit));
    setLimitError('');
  };

  const handleSaveLimit = (categoryId: string) => {
    const val = Number(limitDraft);
    if (!Number.isFinite(val) || val < 0) {
      setLimitError('Enter a valid non-negative limit.');
      return;
    }
    onUpdateLimit(categoryId, Math.round(val * 100) / 100);
    setEditingId(null);
    setLimitError('');
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    const val = Number(newLimit);
    if (!trimmed) {
      setNewError('Enter a category name.');
      return;
    }
    if (!Number.isFinite(val) || val < 0) {
      setNewError('Enter a valid monthly budget limit.');
      return;
    }
    onAddCategory(trimmed, Math.round(val * 100) / 100, newColor);
    setNewName('');
    setNewLimit('');
    setNewError('');
    setShowNewForm(false);
  };

  const unallocated = summary.totalIncome - summary.totalBudget;

  return (
    <div className="space-y-6">
      {/* Budget Planner Header Summary */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Allocated Envelopes
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums dark:text-slate-100">
            {formatCurrency(summary.totalBudget, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Across {breakdown.length} expense categories
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Spent in {formatMonthLabel(monthKey, 'short')}
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums dark:text-slate-100">
            {formatCurrency(summary.totalSpent, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums dark:text-slate-400">
            {summary.utilizationPct}% of monthly budget used
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Remaining Budget
          </p>
          <p
            className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${
              summary.remainingBudget < 0
                ? 'text-rose-700 dark:text-rose-400'
                : 'text-emerald-700 dark:text-emerald-400'
            }`}
          >
            {formatCurrency(summary.remainingBudget, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {summary.remainingBudget < 0 ? 'Exceeded total cap' : 'Available across envelopes'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Income vs. Planned Cap
          </p>
          <p
            className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${
              unallocated >= 0
                ? 'text-teal-700 dark:text-teal-400'
                : 'text-amber-700 dark:text-amber-400'
            }`}
          >
            {formatCurrency(unallocated, currency, { signed: true })}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {unallocated >= 0 ? 'Unallocated savings buffer' : 'Budget exceeds month income'}
          </p>
        </div>
      </section>

      {/* Category Envelopes Table / Cards */}
      <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Monthly Category Envelopes
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Adjust monthly spending targets or add new categories for {formatMonthLabel(monthKey)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowNewForm((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>New Category</span>
          </button>
        </div>

        {showNewForm && (
          <form
            onSubmit={handleCreateCategory}
            className="border-b border-slate-200 bg-slate-50/70 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/40"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-end">
              <div className="sm:col-span-4">
                <label
                  htmlFor="new-cat-name"
                  className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Category Name
                </label>
                <input
                  id="new-cat-name"
                  type="text"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (newError) setNewError('');
                  }}
                  placeholder="e.g., Travel & Weekend"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="sm:col-span-3">
                <label
                  htmlFor="new-cat-limit"
                  className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Monthly Limit (USD)
                </label>
                <input
                  id="new-cat-limit"
                  type="number"
                  min="0"
                  step="10"
                  value={newLimit}
                  onChange={(e) => {
                    setNewLimit(e.target.value);
                    if (newError) setNewError('');
                  }}
                  placeholder="300"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="sm:col-span-3">
                <span className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Color Marker
                </span>
                <div className="flex items-center gap-2 py-1.5">
                  {CATEGORY_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      aria-label={`Select color ${c}`}
                      className={`h-5 w-5 rounded-sm transition-transform ${
                        newColor === c ? 'ring-2 ring-teal-600 ring-offset-2 dark:ring-offset-slate-900 scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setShowNewForm(false)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-medium text-white hover:bg-teal-800 dark:bg-teal-600"
                >
                  Create
                </button>
              </div>
            </div>
            {newError && (
              <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{newError}</p>
            )}
          </form>
        )}

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {breakdown.map((item) => {
            const isEditing = editingId === item.category.id;
            const barWidth = Math.min(100, item.pct);
            const barColor =
              item.status === 'over-budget'
                ? 'bg-rose-600 dark:bg-rose-500'
                : item.status === 'near-limit'
                  ? 'bg-amber-500 dark:bg-amber-400'
                  : 'bg-teal-600 dark:bg-teal-500';

            return (
              <div key={item.category.id} className="px-6 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="h-3 w-3 rounded-xs shrink-0"
                      style={{ backgroundColor: item.category.color }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {item.category.name}
                        </span>
                        <span className="text-xs text-slate-400" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-xs text-slate-500 tabular-nums dark:text-slate-400">
                          {item.transactionCount}{' '}
                          {item.transactionCount === 1 ? 'transaction' : 'transactions'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 sm:justify-end">
                    <StatusIndicator status={item.status} />

                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <label htmlFor={`limit-input-${item.category.id}`} className="sr-only">
                          Monthly limit for {item.category.name}
                        </label>
                        <input
                          id={`limit-input-${item.category.id}`}
                          type="number"
                          min="0"
                          step="10"
                          value={limitDraft}
                          onChange={(e) => {
                            setLimitDraft(e.target.value);
                            if (limitError) setLimitError('');
                          }}
                          className="w-28 rounded-md border border-teal-600 bg-white px-2.5 py-1 font-mono text-sm text-slate-900 focus:outline-none dark:bg-slate-950 dark:text-slate-100"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveLimit(item.category.id)}
                          aria-label={`Save limit for ${item.category.name}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600"
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setLimitError('');
                          }}
                          aria-label={`Cancel editing ${item.category.name}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="text-right font-mono text-sm tabular-nums">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {formatCurrency(item.spent, currency)}
                          </span>
                          <span className="text-slate-400"> / </span>
                          <span className="text-slate-600 dark:text-slate-400">
                            {formatCurrency(item.limit, currency)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          aria-label={`Edit limit for ${item.category.name}`}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap"
                        >
                          <Pencil className="h-3 w-3" aria-hidden="true" />
                          <span>Edit Limit</span>
                        </button>

                        {breakdown.length > 1 && (
                          <button
                            type="button"
                            onClick={() => onDeleteCategory(item.category.id)}
                            aria-label={`Delete category ${item.category.name}`}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {isEditing && limitError && (
                  <p className="mt-1.5 text-right text-xs text-rose-600 dark:text-rose-400">
                    {limitError}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-200 ${barColor}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="w-28 text-right font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
                    {item.remaining >= 0
                      ? `${formatCurrency(item.remaining, currency)} left`
                      : `${formatCurrency(Math.abs(item.remaining), currency)} over`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
