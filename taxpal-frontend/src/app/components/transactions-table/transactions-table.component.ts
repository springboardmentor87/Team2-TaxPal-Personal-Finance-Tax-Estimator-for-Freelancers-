import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Transaction } from '../../models/transaction.model';
import { DashboardDataService } from '../../services/dashboard-data.service';
import { cn } from '../../utils/cn';

@Component({
  selector: 'app-transactions-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transactions-table.component.html',
})
export class TransactionsTableComponent {
  @Input({ required: true }) transactions: Transaction[] = [];
  @Output() delete = new EventEmitter<number>();

  constructor(private readonly data: DashboardDataService) {}

  formatCurrency(value: number): string {
    return this.data.formatCurrency(value);
  }

  formatDate(iso: string): string {
    return this.data.formatDate(iso);
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

  onDelete(id: number): void {
    this.delete.emit(id);
  }
}

