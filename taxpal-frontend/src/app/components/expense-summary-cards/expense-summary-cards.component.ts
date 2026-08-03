import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { DashboardDataService } from '../../services/dashboard-data.service';
import { cn } from '../../utils/cn';

type CardAccent = 'primary' | 'success' | 'neutral';

interface CardConfig {
  label: string;
  value: number;
  delta: string;
  positive: boolean;
  icon: string;
  accent: CardAccent;
}

@Component({
  selector: 'app-expense-summary-cards',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './expense-summary-cards.component.html',
})
export class ExpenseSummaryCardsComponent implements OnChanges {
  @Input() income = 0;
  @Input() expenses = 0;
  @Input() balance = 0;

  cards: CardConfig[] = [];

  constructor(private readonly data: DashboardDataService) {}

  ngOnChanges(): void {
    this.cards = [
      {
        label: 'Total Expenses',
        value: this.expenses,
        delta: '+4.2%',
        positive: false,
        icon: 'ArrowDownRight',
        accent: 'primary',
      },
      {
        label: 'Remaining Balance',
        value: this.balance,
        delta: this.balance >= 0 ? 'Available' : 'Over Budget',
        positive: this.balance >= 0,
        icon: 'Wallet',
        accent: 'neutral',
      },
      {
        label: 'Total Transactions',
        value: this.income + this.expenses,
        delta: 'All Records',
        positive: true,
        icon: 'ArrowUpRight',
        accent: 'success',
      },
    ];
  }

  formatCurrency(value: number): string {
    return this.data.formatCurrency(value);
  }

  accentClass(accent: CardAccent): string {
    return cn(
      'flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110',
      accent === 'success' && 'bg-accent text-accent-foreground',
      accent === 'primary' && 'bg-primary/10 text-primary',
      accent === 'neutral' && 'bg-secondary text-secondary-foreground',
    );
  }

  deltaClass(positive: boolean): string {
    return cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
      positive
        ? 'bg-accent text-accent-foreground'
        : 'bg-destructive/10 text-destructive',
    );
  }
}
