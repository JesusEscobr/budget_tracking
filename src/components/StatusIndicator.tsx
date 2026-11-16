import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { BudgetStatus } from '../types/budget';

interface StatusIndicatorProps {
  status: BudgetStatus;
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  if (status === 'over-budget') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 dark:text-rose-400 whitespace-nowrap">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Over Budget</span>
      </span>
    );
  }

  if (status === 'near-limit') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 whitespace-nowrap">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Near Limit</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>On Track</span>
    </span>
  );
}
