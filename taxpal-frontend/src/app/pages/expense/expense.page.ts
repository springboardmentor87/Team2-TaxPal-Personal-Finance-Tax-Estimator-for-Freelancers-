import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddExpenseCardComponent } from '../../components/add-expense-card/add-expense-card.component';
import { SummaryCardsComponent } from '../../components/summary-cards/summary-cards.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { TopbarComponent } from '../../components/topbar/topbar.component';
import { TransactionsTableComponent } from '../../components/transactions-table/transactions-table.component';
import { NewTransaction, Transaction } from '../../models/transaction.model';
import { TransactionService } from '../../services/transaction.service';
import { AuthService } from '../../services/auth.service';
import { CurrencyService } from '../../services/currency.service';

@Component({
  selector: 'app-expense-page',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    TopbarComponent,
    SummaryCardsComponent,
    AddExpenseCardComponent,
    TransactionsTableComponent,
  ],
  templateUrl: './expense.page.html',
})
export class ExpensePageComponent implements OnInit {
  sidebarOpen = false;
  transactions: Transaction[] = [];

  income = 0;
  expenses = 0;
  balance = 0;

  auth = inject(AuthService);
  currency = inject(CurrencyService);

  constructor(private readonly transactionService: TransactionService) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.transactionService.getTransactions('expense').subscribe({
      next: (res) => {
        this.transactions = res.data?.transactions || [];
      },
      error: (err) => console.error('Error loading transactions', err)
    });

    this.transactionService.getDashboardSummary().subscribe({
      next: (res) => {
        const summary = res.data.summary;
        this.income = summary.totalIncome || 0;
        this.expenses = summary.totalExpenses || 0;
        this.balance = summary.currentBalance || 0;
      },
      error: (err) => console.error('Error loading summary', err)
    });
  }

  openSidebar(): void {
    this.sidebarOpen = true;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  handleAdd(t: NewTransaction): void {
    const data = { ...t, type: 'expense' as const };
    this.transactionService.addTransaction(data).subscribe({
      next: () => this.loadTransactions(),
      error: (err) => console.error('Error adding transaction', err)
    });
  }

  handleDelete(id: number): void {
    this.transactionService.deleteTransaction(id).subscribe({
      next: () => this.loadTransactions(),
      error: (err) => console.error('Error deleting transaction', err)
    });
  }

}

