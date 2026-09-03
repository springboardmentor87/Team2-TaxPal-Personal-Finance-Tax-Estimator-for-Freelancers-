// report.model.ts
// Keep this separate from the component so it can later be swapped for
// types generated from your real API / service layer.

export type ReportType =
  | "income"
  | "expense"
  | "tax-summary"
  | "profit-loss"
  | "transactions";

export interface ReportOption {
  value: ReportType;
  label: string;
}

export interface ReportSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  estimatedTax: number;
}

export interface ReportLineItem {
  date: string; // ISO date string, e.g. '2026-03-04'
  description: string;
  category: string;
  income: number | null;
  expense: number | null;
}

export interface GeneratedReport {
  type: ReportType;
  title: string;
  periodLabel: string; // e.g. 'January 2026 – December 2026'
  summary: ReportSummary;
  items: ReportLineItem[];
}

export const REPORT_OPTIONS: ReportOption[] = [
  { value: "income", label: "Income Report" },
  { value: "expense", label: "Expense Report" },
  { value: "tax-summary", label: "Tax Summary" },
  { value: "profit-loss", label: "Profit & Loss Report" },
  { value: "transactions", label: "Transaction Report" },
];
