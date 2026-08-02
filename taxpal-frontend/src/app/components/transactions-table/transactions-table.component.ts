import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Transaction } from '../../models/transaction.model';

const TRANSACTIONS: Transaction[] = [
  { date: 'Jul 28, 2026', description: 'Website redesign — Nimbus Co.', category: 'Client Payment', amount: 2400, type: 'Income', status: 'Completed' },
  { date: 'Jul 27, 2026', description: 'Figma annual subscription', category: 'Software & Tools', amount: 144, type: 'Expense', status: 'Completed' },
  { date: 'Jul 25, 2026', description: 'Brand identity — Loop Studio', category: 'Client Payment', amount: 1850, type: 'Income', status: 'Completed' },
  { date: 'Jul 24, 2026', description: 'Co-working space, July', category: 'Office & Rent', amount: 220, type: 'Expense', status: 'Completed' },
  { date: 'Jul 22, 2026', description: 'Flight to client meetup — SFO', category: 'Travel', amount: 386, type: 'Expense', status: 'Pending' },
  { date: 'Jul 20, 2026', description: 'UI audit — Fernweh App', category: 'Client Payment', amount: 960, type: 'Income', status: 'Completed' },
  { date: 'Jul 18, 2026', description: 'Instagram ad campaign', category: 'Marketing', amount: 150, type: 'Expense', status: 'Failed' },
  { date: 'Jul 15, 2026', description: 'Quarterly tax set-aside', category: 'Taxes Set Aside', amount: 640, type: 'Expense', status: 'Completed' }
];

@Component({
  selector: 'app-transactions-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transactions-table.component.html'
})
export class TransactionsTableComponent {
  searchTerm = signal('');

  transactions = signal<Transaction[]>(TRANSACTIONS);

  filtered = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.transactions();
    return this.transactions().filter(
      (t) =>
        t.description.toLowerCase().includes(term) ||
        t.category.toLowerCase().includes(term)
    );
  });

  statusClasses(status: Transaction['status']): string {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-600';
      case 'Pending':
        return 'bg-amber-50 text-amber-600';
      case 'Failed':
        return 'bg-rose-50 text-rose-500';
    }
  }
}
