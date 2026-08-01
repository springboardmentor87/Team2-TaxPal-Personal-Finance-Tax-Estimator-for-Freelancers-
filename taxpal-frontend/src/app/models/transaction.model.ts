export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'completed' | 'pending' | 'failed';

export interface Transaction {
  id: string;
  date: string; // ISO yyyy-mm-dd
  category: string;
  description: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
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
