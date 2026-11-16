import { CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { DEFAULT_ACCOUNTS } from '../data/seedData';
import type { BudgetCategory, RecurringBill, RecurringFrequency } from '../types/budget';
import { formatCurrency, formatShortDate, isValidIsoDate } from '../utils/budgetMath';

interface RecurringViewProps {
  bills: RecurringBill[];
  categories: BudgetCategory[];
  currency: string;
  defaultDate: string;
  onMarkPaid: (billId: string) => void;
  onAddBill: (bill: Omit<RecurringBill, 'id'>) => void;
  onDeleteBill: (billId: string) => void;
}

export function RecurringView({
  bills,
  categories,
  currency,
  defaultDate,
  onMarkPaid,
  onAddBill,
  onDeleteBill,
}: RecurringViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(
    categories.find((c) => c.kind === 'expense')?.id ?? ''
  );
  const [account, setAccount] = useState(DEFAULT_ACCOUNTS[0]);
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [nextDueDate, setNextDueDate] = useState(defaultDate);
  const [error, setError] = useState('');

  const expenseCategories = categories.filter((c) => c.kind === 'expense');
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const monthlyEquivalent = bills.reduce((sum, bill) => {
    if (bill.frequency === 'monthly') return sum + bill.amount;
    if (bill.frequency === 'weekly') return sum + bill.amount * 4.33;
    return sum + bill.amount / 12;
  }, 0);

  const sortedBills = [...bills].sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (!name.trim()) {
      setError('Enter a bill or subscription name.');
      return;
    }
    if (!Number.isFinite(num) || num <= 0) {
      setError('Enter a valid amount greater than 0.');
      return;
    }
    if (!isValidIsoDate(nextDueDate)) {
      setError('Select a valid due date.');
      return;
    }
    onAddBill({
      name: name.trim(),
      amount: Math.round(num * 100) / 100,
      categoryId,
      account,
      frequency,
      nextDueDate,
    });
    setName('');
    setAmount('');
    setError('');
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Summary Strip */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Estimated Monthly Fixed Cost
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums dark:text-slate-100">
            {formatCurrency(monthlyEquivalent, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Normalized across all frequencies
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Active Schedules
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums dark:text-slate-100">
            {bills.length}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Bills & subscriptions tracked
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Next Upcoming Payment
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums dark:text-slate-100">
            {sortedBills[0] ? formatCurrency(sortedBills[0].amount, currency) : '$0.00'}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {sortedBills[0]
              ? `${sortedBills[0].name} · Due ${formatShortDate(sortedBills[0].nextDueDate)}`
              : 'No scheduled bills'}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Recurring Bills & Subscriptions
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Marking a bill paid logs an expense transaction and advances the next due date
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Add Recurring Bill</span>
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="border-b border-slate-200 bg-slate-50/70 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/40"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-end">
              <div className="sm:col-span-3">
                <label htmlFor="rec-name" className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Bill Name
                </label>
                <input
                  id="rec-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="e.g., Fiber Internet"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="rec-amount" className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Amount
                </label>
                <input
                  id="rec-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="75.00"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="rec-category" className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Category
                </label>
                <select
                  id="rec-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="rec-frequency" className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Frequency
                </label>
                <select
                  id="rec-frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="rec-date" className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Next Due
                </label>
                <input
                  id="rec-date"
                  type="date"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="sm:col-span-1 flex justify-end">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-teal-700 px-3 py-2 text-xs font-medium text-white hover:bg-teal-800 dark:bg-teal-600"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="rec-account" className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Pay from account:
                </label>
                <select
                  id="rec-account"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {DEFAULT_ACCOUNTS.map((acc) => (
                    <option key={acc} value={acc}>
                      {acc}
                    </option>
                  ))}
                </select>
              </div>
              {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
            </div>
          </form>
        )}

        {sortedBills.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              No recurring bills scheduled
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Add rent, utilities, or subscriptions to track upcoming commitments.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
                  <th className="px-6 py-3 font-medium">Bill / Subscription</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Cadence</th>
                  <th className="px-4 py-3 font-medium">Next Due</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-6 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {sortedBills.map((bill) => (
                  <tr
                    key={bill.id}
                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-3.5">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {bill.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {bill.account}
                        {bill.lastPaidDate && ` · Last paid ${formatShortDate(bill.lastPaidDate)}`}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                      {categoryMap.get(bill.categoryId) ?? bill.categoryId}
                    </td>
                    <td className="px-4 py-3.5 text-xs capitalize text-slate-600 dark:text-slate-300">
                      {bill.frequency}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-700 tabular-nums dark:text-slate-300">
                      {bill.nextDueDate}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-sm font-medium text-slate-900 tabular-nums dark:text-slate-100">
                      {formatCurrency(bill.amount, currency)}
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onMarkPaid(bill.id)}
                          aria-label={`Mark ${bill.name} as paid`}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-teal-50 hover:border-teal-300 hover:text-teal-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-teal-950/40 dark:hover:text-teal-300"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Mark Paid</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteBill(bill.id)}
                          aria-label={`Delete '${bill.name}'`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
