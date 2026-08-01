import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  Transaction,
  TransactionStatus,
} from '../../models/transaction.model';
import { DashboardDataService } from '../../services/dashboard-data.service';
import { cn } from '../../utils/cn';

const STATUS_STYLES: Record<TransactionStatus, string> = {
  completed: 'bg-accent text-accent-foreground',
  pending: 'bg-primary/10 text-primary',
  failed: 'bg-destructive/10 text-destructive',
};

@Component({
  selector: 'app-transactions-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transactions-table.component.html',
})
export class TransactionsTableComponent {
  @Input({ required: true }) transactions: Transaction[] = [];
  @Output() delete = new EventEmitter<string>();

  constructor(private readonly data: DashboardDataService) {}

  formatCurrency(value: number): string {
    return this.data.formatCurrency(value);
  }

  formatDate(iso: string): string {
    return this.data.formatDate(iso);
  }

  statusClass(status: TransactionStatus): string {
    return cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize',
      STATUS_STYLES[status],
    );
  }

  amountClass(type: Transaction['type']): string {
    return cn(
      'whitespace-nowrap px-4 py-4 text-right font-semibold',
      type === 'income' ? 'text-success' : 'text-foreground',
    );
  }

  mobileAmountClass(type: Transaction['type']): string {
    return cn(
      'whitespace-nowrap font-semibold',
      type === 'income' ? 'text-success' : 'text-foreground',
    );
  }

  onDelete(id: string): void {
    this.delete.emit(id);
  }
}
