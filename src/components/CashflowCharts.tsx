import { useState } from 'react';
import type { DailyCashflowPoint, MonthlyTrendPoint } from '../types/budget';
import { formatCurrency, formatShortDate } from '../utils/budgetMath';

interface CashflowChartsProps {
  dailyPoints: DailyCashflowPoint[];
  monthlyTrends: MonthlyTrendPoint[];
  currency: string;
}

export function CashflowCharts({
  dailyPoints,
  monthlyTrends,
  currency,
}: CashflowChartsProps) {
  const [mode, setMode] = useState<'daily' | 'monthly'>('daily');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const width = 680;
  const height = 230;
  const padLeft = 56;
  const padRight = 16;
  const padTop = 18;
  const padBottom = 32;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const activeData =
    mode === 'daily'
      ? dailyPoints.map((d) => ({
          label: String(d.day),
          detailLabel: formatShortDate(d.date),
          income: d.income,
          expense: d.expense,
        }))
      : monthlyTrends.map((m) => ({
          label: m.label,
          detailLabel: m.label,
          income: m.income,
          expense: m.expense,
        }));

  const maxVal = Math.max(
    100,
    ...activeData.flatMap((d) => [d.income, d.expense])
  );
  // Nice rounded ceiling
  const stepUnit = maxVal > 2000 ? 1000 : maxVal > 500 ? 250 : 100;
  const yMax = Math.ceil(maxVal / stepUnit) * stepUnit;
  const gridTicks = [0, 0.25, 0.5, 0.75, 1];

  const hoveredItem = hoveredIdx !== null ? activeData[hoveredIdx] : null;

  return (
    <section
      aria-label="Cashflow Analytics"
      className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Cashflow Activity
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {hoveredItem
              ? `${hoveredItem.detailLabel} · Income ${formatCurrency(hoveredItem.income, currency)} · Spent ${formatCurrency(hoveredItem.expense, currency)}`
              : mode === 'daily'
                ? 'Daily income vs. expenses across the selected month'
                : '4-month income vs. spending comparison'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-4 text-xs text-slate-600 dark:text-slate-400 sm:flex">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-teal-600 dark:bg-teal-500" aria-hidden="true" />
              <span>Income</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-slate-700 dark:bg-slate-400" aria-hidden="true" />
              <span>Expenses</span>
            </span>
          </div>

          <div
            role="tablist"
            aria-label="Chart timeframe"
            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'daily'}
              onClick={() => {
                setMode('daily');
                setHoveredIdx(null);
              }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                mode === 'daily'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Daily
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'monthly'}
              onClick={() => {
                setMode('monthly');
                setHoveredIdx(null);
              }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                mode === 'monthly'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              4-Month Trend
            </button>
          </div>
        </div>
      </div>

      <div className="relative mt-auto w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full overflow-visible"
          role="img"
          aria-label={mode === 'daily' ? 'Daily cashflow bar chart' : '4-month cashflow bar chart'}
        >
          {gridTicks.map((ratio) => {
            const y = padTop + plotH * (1 - ratio);
            const val = Math.round(yMax * ratio);
            return (
              <g key={ratio}>
                <line
                  x1={padLeft}
                  x2={width - padRight}
                  y1={y}
                  y2={y}
                  className="stroke-slate-200 dark:stroke-slate-800"
                  strokeWidth={1}
                  strokeDasharray={ratio === 0 ? undefined : '3 3'}
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 font-mono text-[10px] dark:fill-slate-500"
                >
                  {val >= 1000 ? `$${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : `$${val}`}
                </text>
              </g>
            );
          })}

          {activeData.map((item, idx) => {
            const slotW = plotW / activeData.length;
            const barGroupW = mode === 'daily' ? Math.max(8, slotW * 0.72) : Math.min(54, slotW * 0.55);
            const singleBarW = (barGroupW - 2) / 2;
            const slotX = padLeft + idx * slotW + (slotW - barGroupW) / 2;

            const incomeH = item.income > 0 ? Math.max(3, (item.income / yMax) * plotH) : 0;
            const expenseH = item.expense > 0 ? Math.max(3, (item.expense / yMax) * plotH) : 0;

            const showLabel =
              mode === 'monthly' || idx === 0 || (idx + 1) % 5 === 0 || idx === activeData.length - 1;

            return (
              <g
                key={item.label}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                <rect
                  x={padLeft + idx * slotW}
                  y={padTop}
                  width={slotW}
                  height={plotH}
                  fill="transparent"
                />
                {hoveredIdx === idx && (
                  <rect
                    x={padLeft + idx * slotW + 1}
                    y={padTop}
                    width={Math.max(2, slotW - 2)}
                    height={plotH}
                    rx={4}
                    className="fill-slate-100/80 dark:fill-slate-800/60"
                  />
                )}
                {incomeH > 0 && (
                  <rect
                    x={slotX}
                    y={padTop + plotH - incomeH}
                    width={singleBarW}
                    height={incomeH}
                    rx={2}
                    className="fill-teal-600 transition-opacity dark:fill-teal-500"
                  />
                )}
                {expenseH > 0 && (
                  <rect
                    x={slotX + singleBarW + 2}
                    y={padTop + plotH - expenseH}
                    width={singleBarW}
                    height={expenseH}
                    rx={2}
                    className="fill-slate-700 transition-opacity dark:fill-slate-400"
                  />
                )}
                {showLabel && (
                  <text
                    x={padLeft + idx * slotW + slotW / 2}
                    y={height - 10}
                    textAnchor="middle"
                    className="fill-slate-500 font-mono text-[10px] dark:fill-slate-400"
                  >
                    {item.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
