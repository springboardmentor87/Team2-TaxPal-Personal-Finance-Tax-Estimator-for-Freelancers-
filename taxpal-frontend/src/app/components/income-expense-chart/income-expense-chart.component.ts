import { Component, computed, signal, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

type Period = 'year' | 'quarter' | 'month';

interface ChartPoint {
  label: string;
  income: number;
  expense: number;
}

const DATA_BY_PERIOD: Record<Period, ChartPoint[]> = {
  year: [
    { label: '2022', income: 0, expense: 0 },
    { label: '2023', income: 0, expense: 0 },
    { label: '2024', income: 0, expense: 0 },
    { label: '2025', income: 0, expense: 0 }
  ],
  quarter: [
    { label: 'Q1', income: 0, expense: 0 },
    { label: 'Q2', income: 0, expense: 0 },
    { label: 'Q3', income: 0, expense: 0 },
    { label: 'Q4', income: 0, expense: 0 }
  ],
  month: [
    { label: 'Jan', income: 0, expense: 0 },
    { label: 'Feb', income: 0, expense: 0 },
    { label: 'Mar', income: 0, expense: 0 },
    { label: 'Apr', income: 0, expense: 0 },
    { label: 'May', income: 0, expense: 0 },
    { label: 'Jun', income: 0, expense: 0 }
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

  @Input() monthlyTrend: any[] = [];

  activePeriod = signal<Period>('month');
  dynamicData = signal<Record<Period, ChartPoint[]>>(DATA_BY_PERIOD);

  ngOnChanges(): void {
    if (this.monthlyTrend && this.monthlyTrend.length > 0) {
      const monthData = this.monthlyTrend.map(t => ({
        label: t.month,
        income: t.income,
        expense: t.expense
      }));
      this.dynamicData.set({
        ...DATA_BY_PERIOD,
        month: monthData
      });
    } else if (this.monthlyTrend && this.monthlyTrend.length === 0) {
      this.dynamicData.set(DATA_BY_PERIOD);
    }
  }

  data = computed(() => this.dynamicData()[this.activePeriod()]);

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
