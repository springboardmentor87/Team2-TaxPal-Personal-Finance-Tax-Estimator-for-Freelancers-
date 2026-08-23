import { Component, computed, signal, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Category {
  label: string;
  value: number;
  percent: number;
  color: string;
  pathD?: string;
}

const COLOR_PALETTE = [
  '#3B82F6', // Blue - Rent/Mortgage
  '#10B981', // Green - Business Expenses
  '#F59E0B', // Amber/Yellow - Utilities
  '#EF4444', // Red - Food
  '#8B5CF6', // Purple - Other
];

const DEFAULT_CATEGORIES: Category[] = [
  { label: 'Rent/Mortgage', value: 32, percent: 32, color: '#3B82F6' },
  { label: 'Business Expenses', value: 28, percent: 28, color: '#10B981' },
  { label: 'Utilities', value: 15, percent: 15, color: '#F59E0B' },
  { label: 'Food', value: 12, percent: 12, color: '#EF4444' },
  { label: 'Other', value: 13, percent: 13, color: '#8B5CF6' }
];

@Component({
  selector: 'app-expense-donut-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expense-donut-chart.component.html'
})
export class ExpenseDonutChartComponent implements OnChanges {
  @Input() topCategories: any[] = [];

  dynamicCategories = signal<Category[]>([]);

  ngOnChanges(): void {
    if (this.topCategories && this.topCategories.length > 0) {
      const totalExpense = this.topCategories.reduce((sum, c) => sum + (c.expense || 0), 0);
      if (totalExpense > 0) {
        const mapped = this.topCategories.slice(0, 5).map((c, i) => {
          const val = c.expense || 0;
          const pct = Math.round((val / totalExpense) * 100);
          return {
            label: c.category,
            value: val,
            percent: pct,
            color: COLOR_PALETTE[i % COLOR_PALETTE.length]
          };
        });
        this.dynamicCategories.set(mapped);
        return;
      }
    }
    this.dynamicCategories.set([]);
  }

  total = computed(() => this.dynamicCategories().reduce((sum, c) => sum + c.value, 0));

  computedSegments = computed(() => {
    const cats = this.dynamicCategories();
    const totalVal = this.total();
    if (totalVal <= 0) return [];

    const cx = 100;
    const cy = 100;
    const r = 85;
    let startAngle = -Math.PI / 2; // Start from top (12 o'clock)

    return cats.map((cat) => {
      const sliceAngle = (cat.value / totalVal) * 2 * Math.PI;
      const endAngle = startAngle + sliceAngle;
      const actualEndAngle = Math.min(endAngle, startAngle + 2 * Math.PI - 0.0001);

      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(actualEndAngle);
      const y2 = cy + r * Math.sin(actualEndAngle);

      const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

      const pathD = `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;

      startAngle = endAngle;

      return {
        ...cat,
        pathD
      };
    });
  });
}

