export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: number;
  date: string; // ISO yyyy-mm-dd
  category: string;
  description: string;
  amount: number;
  type: TransactionType;
}

export type NewTransaction = Omit<Transaction, 'id'>;

export const CATEGORIES: readonly string[] = [
  'Salary',
  'Freelance',
  'Groceries',
  'Rent',
  'Utilities',
  'Transport',
  'Dining',
  'Healthcare',
  'Entertainment',
  'Taxes',
  'Other',
] as const;
