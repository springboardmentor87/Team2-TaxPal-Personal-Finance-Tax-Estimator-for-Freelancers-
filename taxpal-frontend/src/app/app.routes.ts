import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'income', pathMatch: 'full' },
  {
    path: 'income',
    loadComponent: () =>
      import('./pages/income/income.page').then((m) => m.IncomePageComponent),
    title: 'TaxPal — Income',
  },
  {
    path: 'expense',
    loadComponent: () =>
      import('./pages/expense/expense.page').then(
        (m) => m.ExpensePageComponent,
      ),
    title: 'TaxPal — Expenses',
  },
  { path: '**', redirectTo: 'income' },
];
