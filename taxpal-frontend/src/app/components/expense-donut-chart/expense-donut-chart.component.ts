import { Component, computed, signal, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Category {
  label: string;
  value: number;
  color: string;
}

interface Segment extends Category {
  percent: number;
  dashArray: string;
  dashOffset: number;
}

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const FALLBACK_CATEGORIES: Category[] = [
  { label: 'Software & Tools', value: 0, color: '#7C3AED' },
  { label: 'Office & Rent', value: 0, color: '#9D5CF0' },
  { label: 'Travel', value: 0, color: '#B588F5' },
  { label: 'Marketing', value: 0, color: '#CBAAFC' },
  { label: 'Taxes Set Aside', value: 0, color: '#E4D2FE' }
];

@Component({
  selector: 'app-expense-donut-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expense-donut-chart.component.html'
})
export class ExpenseDonutChartComponent {
  readonly radius = RADIUS;
  readonly circumference = CIRCUMFERENCE;

  @Input() topCategories: any[] = [];

  dynamicCategories = signal<Category[]>(FALLBACK_CATEGORIES);

  ngOnChanges(): void {
    if (this.topCategories && this.topCategories.length > 0) {
      const colors = ['#7C3AED', '#9D5CF0', '#B588F5', '#CBAAFC', '#E4D2FE'];
      const mapped = this.topCategories.slice(0, 5).map((c, i) => ({
        label: c.category,
        value: c.expense,
        color: colors[i % colors.length]
      }));
      this.dynamicCategories.set(mapped);
    } else if (this.topCategories && this.topCategories.length === 0) {
      this.dynamicCategories.set([]);
    }
  }

  total = computed(() => this.dynamicCategories().reduce((sum, c) => sum + c.value, 0));

  segments = computed<Segment[]>(() => {
    let offsetAccum = 0;
    const total = this.total();

    return this.dynamicCategories().map((cat) => {
      const percent = (cat.value / total) * 100;
      const dashLength = (percent / 100) * CIRCUMFERENCE;
      const segment: Segment = {
        ...cat,
        percent: Math.round(percent),
        dashArray: `${dashLength} ${CIRCUMFERENCE - dashLength}`,
        dashOffset: -offsetAccum
      };
      offsetAccum += dashLength;
      return segment;
    });
  });
}
