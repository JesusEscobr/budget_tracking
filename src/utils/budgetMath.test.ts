import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceDueDate,
  computeCategoryBreakdown,
  computeDailyCashflow,
  computeMonthlySummary,
  filterTransactions,
  formatCurrency,
  transactionsToCsv,
  validateTransactionInput,
} from './budgetMath';
import type { BudgetCategory, Transaction } from '../types/budget';

const SAMPLE_CATEGORIES: BudgetCategory[] = [
  { id: 'groceries', name: 'Groceries', limit: 500, color: '#0284C7', kind: 'expense' },
  { id: 'dining', name: 'Dining Out', limit: 200, color: '#D97706', kind: 'expense' },
  { id: 'salary', name: 'Salary', limit: 0, color: '#16A34A', kind: 'income' },
];

const SAMPLE_TX: Transaction[] = [
  { id: '1', date: '2026-11-01', description: 'Paycheck', amount: 3000, type: 'income', categoryId: 'salary', account: 'Checking' },
  { id: '2', date: '2026-11-05', description: 'Trader Joes', amount: 120.5, type: 'expense', categoryId: 'groceries', account: 'Sapphire Card' },
  { id: '3', date: '2026-11-08', description: 'Sushi Dinner', amount: 175, type: 'expense', categoryId: 'dining', account: 'Sapphire Card' },
  { id: '4', date: '2026-11-10', description: 'Coffee', amount: 35, type: 'expense', categoryId: 'dining', account: 'Cash' },
  { id: '5', date: '2026-10-15', description: 'October Groceries', amount: 90, type: 'expense', categoryId: 'groceries', account: 'Checking' },
];

test('formatCurrency formats signed and unsigned USD amounts accurately', () => {
  assert.equal(formatCurrency(1250.5), '$1,250.50');
  assert.equal(formatCurrency(-84.5), '-$84.50');
  assert.equal(formatCurrency(500, 'USD', { signed: true }), '+$500.00');
  assert.equal(formatCurrency(-42.1, 'USD', { signed: true }), '-$42.10');
});

test('computeMonthlySummary totals income, spent, budget, and net cashflow for target month only', () => {
  const summary = computeMonthlySummary(SAMPLE_TX, SAMPLE_CATEGORIES, '2026-11');
  assert.equal(summary.totalIncome, 3000);
  assert.equal(summary.totalSpent, 330.5);
  assert.equal(summary.totalBudget, 700);
  assert.equal(summary.netCashflow, 2669.5);
  assert.equal(summary.remainingBudget, 369.5);
  assert.equal(summary.savingsRate, 89);
});

test('computeCategoryBreakdown identifies on-track, near-limit, and over-budget statuses', () => {
  const breakdown = computeCategoryBreakdown(SAMPLE_TX, SAMPLE_CATEGORIES, '2026-11');
  const dining = breakdown.find((b) => b.category.id === 'dining');
  const groceries = breakdown.find((b) => b.category.id === 'groceries');

  assert.ok(dining);
  assert.equal(dining.spent, 210);
  assert.equal(dining.remaining, -10);
  assert.equal(dining.status, 'over-budget');

  assert.ok(groceries);
  assert.equal(groceries.spent, 120.5);
  assert.equal(groceries.status, 'on-track');
});

test('filterTransactions filters by month, type, category, search query, and sorts properly', () => {
  const filtered = filterTransactions(SAMPLE_TX, {
    monthKey: '2026-11',
    type: 'expense',
    search: 'sushi',
  });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, '3');

  const sortedByAmount = filterTransactions(SAMPLE_TX, {
    monthKey: '2026-11',
    type: 'expense',
    sortBy: 'amount-desc',
  });
  assert.deepEqual(sortedByAmount.map((t) => t.id), ['3', '2', '4']);
});

test('computeDailyCashflow populates daily buckets across the month', () => {
  const points = computeDailyCashflow(SAMPLE_TX, '2026-11');
  assert.equal(points.length, 30);
  assert.equal(points[0].income, 3000);
  assert.equal(points[4].expense, 120.5);
  assert.equal(points[7].expense, 175);
});

test('advanceDueDate handles monthly end-of-month clamping, weekly, and yearly', () => {
  assert.equal(advanceDueDate('2026-01-31', 'monthly'), '2026-02-28');
  assert.equal(advanceDueDate('2026-11-15', 'weekly'), '2026-11-22');
  assert.equal(advanceDueDate('2024-02-29', 'yearly'), '2025-02-28');
});

test('validateTransactionInput rejects empty descriptions, non-positive amounts, and bad dates', () => {
  const errors = validateTransactionInput({
    description: '   ',
    amount: '-10',
    date: '2026-02-31',
    categoryId: '',
    account: '',
  });
  assert.ok(errors.description);
  assert.ok(errors.amount);
  assert.ok(errors.date);
  assert.ok(errors.categoryId);
  assert.ok(errors.account);

  const valid = validateTransactionInput({
    description: 'Whole Foods',
    amount: 42.5,
    date: '2026-11-15',
    categoryId: 'groceries',
    account: 'Checking',
    type: 'expense',
  });
  assert.deepEqual(valid, {});
});

test('transactionsToCsv formats CSV with signed amounts and escaped quotes', () => {
  const csv = transactionsToCsv(
    [
      {
        id: '9',
        date: '2026-11-15',
        description: 'Joe\'s "Best" Bakery',
        amount: 12.5,
        type: 'expense',
        categoryId: 'dining',
        account: 'Cash',
      },
    ],
    SAMPLE_CATEGORIES
  );
  assert.ok(csv.includes('"Joe\'s ""Best"" Bakery"'));
  assert.ok(csv.includes('-12.50'));
});
