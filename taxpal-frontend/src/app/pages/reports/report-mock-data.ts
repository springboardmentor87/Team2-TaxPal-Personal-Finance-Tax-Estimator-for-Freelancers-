// report-mock-data.ts
// TEMPORARY mock data source.
// Replace generateMockReport() with a call to your real ReportsService
// (e.g. this.reportsService.generate(type)) once the backend/localStorage
// integration is ready. The GeneratedReport shape is what the component
// expects back, so swapping the source is a one-line change in the component.

import {
  GeneratedReport,
  ReportLineItem,
  ReportType,
  REPORT_OPTIONS,
} from "./report.model";

const MOCK_ITEMS: ReportLineItem[] = [
  {
    date: "2026-01-08",
    description: "Website design — Acme Co.",
    category: "Client Income",
    income: 2400,
    expense: null,
  },
  {
    date: "2026-01-22",
    description: "Adobe Creative Cloud",
    category: "Software",
    income: null,
    expense: 54.99,
  },
  {
    date: "2026-02-14",
    description: "Brand identity — Nova Fitness",
    category: "Client Income",
    income: 1800,
    expense: null,
  },
  {
    date: "2026-02-28",
    description: "Co-working desk, Feb",
    category: "Office",
    income: null,
    expense: 220,
  },
  {
    date: "2026-03-05",
    description: "Consulting retainer — Lumen",
    category: "Client Income",
    income: 3000,
    expense: null,
  },
  {
    date: "2026-03-19",
    description: "Business insurance premium",
    category: "Insurance",
    income: null,
    expense: 145,
  },
  {
    date: "2026-04-02",
    description: "Logo package — Delta Foods",
    category: "Client Income",
    income: 950,
    expense: null,
  },
  {
    date: "2026-04-11",
    description: "Laptop accessories",
    category: "Equipment",
    income: null,
    expense: 189.5,
  },
];

function titleFor(type: ReportType): string {
  return REPORT_OPTIONS.find((o) => o.value === type)?.label ?? "Report";
}

export function generateMockReport(type: ReportType): GeneratedReport {
  const totalIncome = MOCK_ITEMS.reduce((sum, i) => sum + (i.income ?? 0), 0);
  const totalExpenses = MOCK_ITEMS.reduce(
    (sum, i) => sum + (i.expense ?? 0),
    0,
  );
  const netProfit = totalIncome - totalExpenses;
  const estimatedTax = Math.max(netProfit * 0.22, 0); // placeholder flat-rate estimate

  return {
    type,
    title: titleFor(type),
    periodLabel: "January 2026 – December 2026",
    summary: {
      totalIncome,
      totalExpenses,
      netProfit,
      estimatedTax,
    },
    items: MOCK_ITEMS,
  };
}
