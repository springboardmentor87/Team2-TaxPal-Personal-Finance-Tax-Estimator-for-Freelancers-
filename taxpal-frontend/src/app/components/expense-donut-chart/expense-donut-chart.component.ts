import { Component, computed } from '@angular/core';
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

const CATEGORIES: Category[] = [
  { label: 'Software & Tools', value: 1240, color: '#7C3AED' },
  { label: 'Office & Rent', value: 980, color: '#9D5CF0' },
  { label: 'Travel', value: 620, color: '#B588F5' },
  { label: 'Marketing', value: 430, color: '#CBAAFC' },
  { label: 'Taxes Set Aside', value: 310, color: '#E4D2FE' }
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

  total = computed(() => CATEGORIES.reduce((sum, c) => sum + c.value, 0));

  segments = computed<Segment[]>(() => {
    let offsetAccum = 0;
    const total = this.total();

    return CATEGORIES.map((cat) => {
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
