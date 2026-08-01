import { Component } from '@angular/core';
import { AddExpenseCardComponent } from '../../components/add-expense-card/add-expense-card.component';
import { ExpenseSummaryCardsComponent } from '../../components/expense-summary-cards/expense-summary-cards.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { TopbarComponent } from '../../components/topbar/topbar.component';
import { TransactionsTableComponent } from '../../components/transactions-table/transactions-table.component';
import { NewTransaction, Transaction } from '../../models/transaction.model';
import { DashboardDataService } from '../../services/dashboard-data.service';

@Component({
  selector: 'app-expense-page',
  standalone: true,
  imports: [
    SidebarComponent,
    TopbarComponent,
    ExpenseSummaryCardsComponent,
    AddExpenseCardComponent,
    TransactionsTableComponent,
  ],
  templateUrl: './expense.page.html',
})
export class ExpensePageComponent {
  sidebarOpen = false;
  transactions: Transaction[];

  income = 0;
  expenses = 0;
  balance = 0;

  constructor(private readonly data: DashboardDataService) {
    this.transactions = this.data.getInitialTransactions();
    this.recalculateTotals();
  }

  openSidebar(): void {
    this.sidebarOpen = true;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  handleAdd(t: NewTransaction): void {
    const next: Transaction = { ...t, id: `t${Date.now()}` };
    this.transactions = [next, ...this.transactions].sort((a, b) =>
      b.date.localeCompare(a.date),
    );
    this.recalculateTotals();
  }

  handleDelete(id: string): void {
    this.transactions = this.transactions.filter((t) => t.id !== id);
    this.recalculateTotals();
  }

  private recalculateTotals(): void {
    this.income = this.transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    this.expenses = this.transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    this.balance = this.income - this.expenses;
  }
}
