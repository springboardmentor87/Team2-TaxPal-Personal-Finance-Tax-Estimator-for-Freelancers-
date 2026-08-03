import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { cn } from '../../utils/cn';

@Component({
  selector: 'app-summary-cards',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './summary-cards.component.html',
})
export class SummaryCardsComponent {
  @Input() title = '';
  @Input() amount: string | null = '';
  @Input() statusText = '';
  @Input() trend: 'up' | 'down' | 'neutral' = 'neutral';
  @Input() icon = '';

  get mappedIcon(): string {
    switch (this.icon) {
      case 'income': return 'ArrowUpRight';
      case 'expense': return 'ArrowDownRight';
      case 'balance': return 'Wallet';
      case 'tax': return 'Landmark';
      default: return 'Wallet';
    }
  }

  get accentClass(): string {
    const accent = this.trend === 'up' ? 'success' : this.trend === 'down' ? 'primary' : 'neutral';
    return cn(
      'flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110',
      accent === 'success' && 'bg-accent text-accent-foreground',
      accent === 'primary' && 'bg-primary/10 text-primary',
      accent === 'neutral' && 'bg-secondary text-secondary-foreground',
    );
  }

  get deltaClass(): string {
    const positive = this.trend === 'up';
    const neutral = this.trend === 'neutral';
    if (neutral) return 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground';
    return cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
      positive
        ? 'bg-accent text-accent-foreground'
        : 'bg-destructive/10 text-destructive',
    );
  }
}

