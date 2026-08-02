import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SummaryTrend = 'up' | 'down' | 'neutral';
export type SummaryIcon = 'income' | 'expense' | 'balance' | 'tax';

@Component({
  selector: 'app-summary-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summary-card.component.html'
})
export class SummaryCardComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) amount!: string;
  @Input({ required: true }) statusText!: string;
  @Input() trend: SummaryTrend = 'neutral';
  @Input({ required: true }) icon!: SummaryIcon;
}
