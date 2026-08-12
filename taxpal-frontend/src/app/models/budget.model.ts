export type BudgetPeriod =
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly';

export type BudgetStatus =
  | 'healthy'
  | 'warning'
  | 'over'
  | 'Within Budget'
  | 'Over Budget';

export interface BudgetUsage {
  spent: number;
  remaining: number;
  utilization: number;
  status: BudgetStatus;
  periodStart?: string;
  periodEnd?: string;
}

export interface Budget {
  id: number;
  userId?: number;
  name?: string;
  category: string;
  month: string | null;
  period: BudgetPeriod;
  amount: number;
  limit?: number;
  alertThreshold?: number;
  usage?: BudgetUsage;
  createdAt?: string;
  updatedAt?: string;
}

export interface NewBudget {
  category: string;
  amount: number;
  limit?: number;
  month?: string | null;
  period?: BudgetPeriod;
  name?: string;
  threshold?: number;
}