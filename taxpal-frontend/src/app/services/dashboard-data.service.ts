import { Injectable } from '@angular/core';
import { Transaction } from '../models/transaction.model';

const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    date: '2026-07-22',
    category: 'Salary',
    description: 'Monthly paycheck',
    amount: 5200,
    type: 'income',
    status: 'completed',
  },
  {
    id: 't2',
    date: '2026-07-21',
    category: 'Rent',
    description: 'July apartment rent',
    amount: 1650,
    type: 'expense',
    status: 'completed',
  },
  {
    id: 't3',
    date: '2026-07-20',
    category: 'Groceries',
    description: 'Whole Foods weekly shop',
    amount: 142.38,
    type: 'expense',
    status: 'completed',
  },
  {
    id: 't4',
    date: '2026-07-19',
    category: 'Freelance',
    description: 'Logo design project',
    amount: 850,
    type: 'income',
    status: 'pending',
  },
  {
    id: 't5',
    date: '2026-07-18',
    category: 'Dining',
    description: 'Dinner with clients',
    amount: 96.5,
    type: 'expense',
    status: 'completed',
  },
  {
    id: 't6',
    date: '2026-07-17',
    category: 'Utilities',
    description: 'Electricity & water',
    amount: 213.12,
    type: 'expense',
    status: 'failed',
  },
  {
    id: 't7',
    date: '2026-07-16',
    category: 'Transport',
    description: 'Monthly transit pass',
    amount: 78,
    type: 'expense',
    status: 'completed',
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
  /** Returns a fresh, independent copy of the seed transactions. */
  getInitialTransactions(): Transaction[] {
    return SEED_TRANSACTIONS.map((t) => ({ ...t }));
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  formatDate(iso: string): string {
    const d = new Date(iso + 'T00:00:00');
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  }
}
