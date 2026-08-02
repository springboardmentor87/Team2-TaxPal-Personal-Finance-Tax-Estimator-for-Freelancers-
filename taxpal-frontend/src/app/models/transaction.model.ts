export type TransactionType = 'Income' | 'Expense';
export type TransactionStatus = 'Completed' | 'Pending' | 'Failed';

export interface Transaction {
  date: string;
  description: string;
  category: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
}
