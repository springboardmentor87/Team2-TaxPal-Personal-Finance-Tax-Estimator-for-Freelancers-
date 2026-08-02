import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

type Period = 'year' | 'quarter' | 'month';

interface ChartPoint {
  label: string;
  income: number;
  expense: number;
}

const DATA_BY_PERIOD: Record<Period, ChartPoint[]> = {
  year: [
    { label: '2022', income: 62000, expense: 41000 },
    { label: '2023', income: 74500, expense: 48200 },
    { label: '2024', income: 81200, expense: 52600 },
    { label: '2025', income: 93400, expense: 58900 }
  ],
  quarter: [
    { label: 'Q1', income: 18400, expense: 12100 },
    { label: 'Q2', income: 21200, expense: 13850 },
    { label: 'Q3', income: 24600, expense: 15400 },
    { label: 'Q4', income: 29200, expense: 17550 }
  ],
  month: [
    { label: 'Jan', income: 6200, expense: 3900 },
    { label: 'Feb', income: 5800, expense: 4200 },
    { label: 'Mar', income: 7100, expense: 4450 },
    { label: 'Apr', income: 6900, expense: 4100 },
    { label: 'May', income: 7600, expense: 4800 },
    { label: 'Jun', income: 8200, expense: 5100 }
  ]
};

@Component({
  selector: 'app-income-expense-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './income-expense-chart.component.html'
})
export class IncomeExpenseChartComponent {
  readonly periods: { key: Period; label: string }[] = [
    { key: 'year', label: 'Year' },
    { key: 'quarter', label: 'Quarter' },
    { key: 'month', label: 'Month' }
  ];

  activePeriod = signal<Period>('month');

  data = computed(() => DATA_BY_PERIOD[this.activePeriod()]);

  maxValue = computed(() => {
    const points = this.data();
    return Math.max(...points.map((p) => Math.max(p.income, p.expense))) * 1.15;
  });

  setPeriod(period: Period): void {
    this.activePeriod.set(period);
  }

  barHeight(value: number): number {
    const max = this.maxValue();
    if (max <= 0) return 0;
    return Math.round((value / max) * 100);
  }
}
