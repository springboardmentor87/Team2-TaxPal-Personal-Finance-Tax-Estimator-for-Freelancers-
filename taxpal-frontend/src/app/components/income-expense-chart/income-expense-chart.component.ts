import { Component, computed, signal, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

type Period = 'year' | 'quarter' | 'month';

export interface ChartPoint {
  label: string;
  income: number;
  expense: number;
}

@Component({
  selector: 'app-income-expense-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './income-expense-chart.component.html'
})
export class IncomeExpenseChartComponent implements OnChanges {
  readonly periods: { key: Period; label: string }[] = [
    { key: 'year', label: 'Year' },
    { key: 'quarter', label: 'Quarter' },
    { key: 'month', label: 'Month' }
  ];

  @Input() monthlyTrend: any[] = [];
  @Input() quarterlyTrend: any[] = [];
  @Input() yearlyTrend: any[] = [];

  activePeriod = signal<Period>('month');
  dynamicData = signal<Record<Period, ChartPoint[]>>({
    month: [],
    quarter: [],
    year: []
  });

  ngOnChanges(): void {
    // 1. Month Data
    let monthData: ChartPoint[] = (this.monthlyTrend || []).map(t => ({
      label: t.month || t.label || '',
      income: Number(t.income || 0),
      expense: Number(t.expense || 0)
    }));

    if (monthData.length === 0) {
      monthData = [
        { label: 'Jan', income: 0, expense: 0 },
        { label: 'Feb', income: 0, expense: 0 },
        { label: 'Mar', income: 0, expense: 0 },
        { label: 'Apr', income: 0, expense: 0 },
        { label: 'May', income: 0, expense: 0 },
        { label: 'Jun', income: 0, expense: 0 }
      ];
    }

    // 2. Quarter Data
    let quarterData: ChartPoint[] = (this.quarterlyTrend || []).map(t => ({
      label: t.quarter || t.label || '',
      income: Number(t.income || 0),
      expense: Number(t.expense || 0)
    }));

    if (quarterData.length === 0 || quarterData.every(q => q.income === 0 && q.expense === 0)) {
      const q1Income = monthData.slice(0, 3).reduce((s, m) => s + m.income, 0);
      const q1Expense = monthData.slice(0, 3).reduce((s, m) => s + m.expense, 0);
      const q2Income = monthData.slice(3, 6).reduce((s, m) => s + m.income, 0);
      const q2Expense = monthData.slice(3, 6).reduce((s, m) => s + m.expense, 0);

      quarterData = [
        { label: 'Q1', income: q1Income, expense: q1Expense },
        { label: 'Q2', income: q2Income, expense: q2Expense },
        { label: 'Q3', income: 0, expense: 0 },
        { label: 'Q4', income: 0, expense: 0 }
      ];
    }

    // 3. Year Data
    let yearData: ChartPoint[] = (this.yearlyTrend || []).map(t => ({
      label: t.year || t.label || '',
      income: Number(t.income || 0),
      expense: Number(t.expense || 0)
    }));

    if (yearData.length === 0 || yearData.every(y => y.income === 0 && y.expense === 0)) {
      const totalMonthIncome = monthData.reduce((s, m) => s + m.income, 0);
      const totalMonthExpense = monthData.reduce((s, m) => s + m.expense, 0);
      const currentYear = new Date().getFullYear();

      yearData = [
        { label: String(currentYear - 3), income: 0, expense: 0 },
        { label: String(currentYear - 2), income: 0, expense: 0 },
        { label: String(currentYear - 1), income: 0, expense: 0 },
        { label: String(currentYear), income: totalMonthIncome, expense: totalMonthExpense }
      ];
    }

    this.dynamicData.set({
      month: monthData,
      quarter: quarterData,
      year: yearData
    });
  }

  data = computed(() => this.dynamicData()[this.activePeriod()]);

  maxScale = computed(() => {
    const points = this.data();
    if (!points || points.length === 0) return 10000;
    const peak = Math.max(...points.map((p) => Math.max(p.income || 0, p.expense || 0)));
    return peak > 0 ? Math.ceil(peak / 1000) * 1000 : 10000;
  });

  yAxisTicks = computed(() => {
    const max = this.maxScale();
    return [
      this.formatCurrency(max),
      this.formatCurrency(max * 0.75),
      this.formatCurrency(max * 0.5),
      this.formatCurrency(max * 0.25),
      '$0'
    ];
  });

  formatCurrency(val: number): string {
    if (val >= 1000) {
      const k = val / 1000;
      return `$${Number.isInteger(k) ? k : k.toFixed(1)}k`;
    }
    return `$${Math.round(val)}`;
  }

  setPeriod(period: Period): void {
    this.activePeriod.set(period);
  }

  barHeight(value: number): number {
    const max = this.maxScale();
    if (max <= 0 || value <= 0) return 0;
    return Math.min(100, Math.round((value / max) * 100));
  }
}


