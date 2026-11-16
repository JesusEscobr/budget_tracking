import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { SavingsGoal } from '../types/budget';
import { formatCurrency, isValidIsoDate } from '../utils/budgetMath';

interface GoalsViewProps {
  goals: SavingsGoal[];
  currency: string;
  onContribute: (goalId: string, amount: number) => void;
  onAddGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  onDeleteGoal: (goalId: string) => void;
}

export function GoalsView({
  goals,
  currency,
  onContribute,
  onAddGoal,
  onDeleteGoal,
}: GoalsViewProps) {
  const [contributingId, setContributingId] = useState<string | null>(null);
  const [contribAmount, setContribAmount] = useState('');
  const [contribError, setContribError] = useState('');

  const [showNewForm, setShowNewForm] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('2027-06-01');
  const [formError, setFormError] = useState('');

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  const handleConfirmContribution = (goalId: string) => {
    const val = Number(contribAmount);
    if (!Number.isFinite(val) || val <= 0) {
      setContribError('Enter an amount greater than 0.');
      return;
    }
    onContribute(goalId, Math.round(val * 100) / 100);
    setContributingId(null);
    setContribAmount('');
    setContribError('');
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = Number(targetAmount);
    const current = Number(currentAmount);
    if (!goalName.trim()) {
      setFormError('Enter a goal name.');
      return;
    }
    if (!Number.isFinite(target) || target <= 0) {
      setFormError('Target amount must be greater than 0.');
      return;
    }
    if (!Number.isFinite(current) || current < 0) {
      setFormError('Starting saved balance cannot be negative.');
      return;
    }
    if (!isValidIsoDate(targetDate)) {
      setFormError('Select a valid target date.');
      return;
    }

    onAddGoal({
      name: goalName.trim(),
      targetAmount: Math.round(target * 100) / 100,
      currentAmount: Math.round(current * 100) / 100,
      targetDate,
    });
    setGoalName('');
    setTargetAmount('');
    setCurrentAmount('0');
    setFormError('');
    setShowNewForm(false);
  };

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Allocated Savings
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-teal-700 tabular-nums dark:text-teal-400">
            {formatCurrency(totalSaved, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums dark:text-slate-400">
            {overallPct}% of combined goal targets
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Combined Target
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums dark:text-slate-100">
            {formatCurrency(totalTarget, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Across {goals.length} active savings {goals.length === 1 ? 'goal' : 'goals'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Remaining to Fund
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums dark:text-slate-100">
            {formatCurrency(Math.max(0, totalTarget - totalSaved), currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Remaining balance across targets
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Savings Targets
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Track reserves, travel funds, and planned purchases
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowNewForm((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>New Savings Goal</span>
          </button>
        </div>

        {showNewForm && (
          <form
            onSubmit={handleCreateGoal}
            className="border-b border-slate-200 bg-slate-50/70 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/40"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-end">
              <div className="sm:col-span-4">
                <label htmlFor="goal-name" className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Goal Name
                </label>
                <input
                  id="goal-name"
                  type="text"
                  value={goalName}
                  onChange={(e) => {
                    setGoalName(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="e.g., Down Payment Reserve"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="goal-target" className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Target Amount
                </label>
                <input
                  id="goal-target"
                  type="number"
                  min="1"
                  step="50"
                  value={targetAmount}
                  onChange={(e) => {
                    setTargetAmount(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="5000"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="goal-current" className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Already Saved
                </label>
                <input
                  id="goal-current"
                  type="number"
                  min="0"
                  step="10"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="goal-date" className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Target Date
                </label>
                <input
                  id="goal-date"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setShowNewForm(false)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
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
            {formError && (
              <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{formError}</p>
            )}
          </form>
        )}

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {goals.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                No savings goals configured
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Create a target to track emergency funds, travel, or major purchases.
              </p>
            </div>
          ) : (
            goals.map((goal) => {
              const pct =
                goal.targetAmount > 0
                  ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
                  : 0;
              const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
              const isContributing = contributingId === goal.id;

              return (
                <div key={goal.id} className="px-6 py-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {goal.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500 tabular-nums dark:text-slate-400">
                        Target date {goal.targetDate} ·{' '}
                        {remaining === 0
                          ? 'Goal funded'
                          : `${formatCurrency(remaining, currency)} remaining`}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums dark:text-slate-100">
                        {formatCurrency(goal.currentAmount, currency)}{' '}
                        <span className="font-normal text-slate-400">
                          / {formatCurrency(goal.targetAmount, currency)}
                        </span>
                      </span>

                      {isContributing ? (
                        <div className="flex items-center gap-2">
                          <label htmlFor={`contrib-${goal.id}`} className="sr-only">
                            Contribution amount for {goal.name}
                          </label>
                          <input
                            id={`contrib-${goal.id}`}
                            type="number"
                            min="1"
                            step="10"
                            value={contribAmount}
                            onChange={(e) => {
                              setContribAmount(e.target.value);
                              if (contribError) setContribError('');
                            }}
                            placeholder="250"
                            className="w-24 rounded-md border border-teal-600 bg-white px-2.5 py-1 font-mono text-sm text-slate-900 dark:bg-slate-950 dark:text-slate-100"
                          />
                          <button
                            type="button"
                            onClick={() => handleConfirmContribution(goal.id)}
                            className="rounded-md bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800 dark:bg-teal-600"
                          >
                            Deposit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setContributingId(null);
                              setContribError('');
                            }}
                            className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setContributingId(goal.id);
                              setContribAmount('');
                              setContribError('');
                            }}
                            aria-label={`Add contribution to ${goal.name}`}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap"
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Add Contribution</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteGoal(goal.id)}
                            aria-label={`Delete '${goal.name}'`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {isContributing && contribError && (
                    <p className="mt-1.5 text-right text-xs text-rose-600 dark:text-rose-400">
                      {contribError}
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-teal-600 transition-all duration-200 dark:bg-teal-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-10 text-right font-mono text-xs font-medium text-slate-600 tabular-nums dark:text-slate-400">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
