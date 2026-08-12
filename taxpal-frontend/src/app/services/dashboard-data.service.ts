import { Injectable } from '@angular/core';
import { Transaction } from '../models/transaction.model';
import { CurrencyService } from './currency.service';

const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: 1,
    date: '2026-07-22',
    category: 'Salary',
    description: 'Monthly paycheck',
    amount: 5200,
    type: 'income'
  },
  {
    id: 2,
    date: '2026-07-21',
    category: 'Rent',
    description: 'July apartment rent',
    amount: 1650,
    type: 'expense'
  },
  {
    id: 3,
    date: '2026-07-20',
    category: 'Groceries',
    description: 'Whole Foods weekly shop',
    amount: 142.38,
    type: 'expense'
  },
  {
    id: 4,
    date: '2026-07-19',
    category: 'Freelance',
    description: 'Logo design project',
    amount: 850,
    type: 'income'
  },
  {
    id: 5,
    date: '2026-07-18',
    category: 'Dining',
    description: 'Dinner with clients',
    amount: 96.5,
    type: 'expense'
  },
  {
    id: 6,
    date: '2026-07-17',
    category: 'Utilities',
    description: 'Electricity & water',
    amount: 213.12,
    type: 'expense'
  },
  {
    id: 7,
    date: '2026-07-16',
    category: 'Transport',
    description: 'Monthly transit pass',
    amount: 78,
    type: 'expense'
  },
];

/**
 * Stateless helper service mirroring lib/dashboard-data.ts.
 * Each dashboard page owns its own in-memory transaction list (matching the
 * original Next.js behavior where each route's component keeps local state
 * that resets to the seed data on every mount).
 */
@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  constructor(private readonly currency: CurrencyService) {}

  /** Returns a fresh, independent copy of the seed transactions. */
  getInitialTransactions(): Transaction[] {
    return SEED_TRANSACTIONS.map((t) => ({ ...t }));
  }

  formatCurrency(value: number): string {
    return this.currency.format(value);
  }

  formatDate(iso: string): string {
    const dateStr = iso.includes('T') ? iso : iso + 'T00:00:00';
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  }
}
