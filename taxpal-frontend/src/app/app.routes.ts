
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
    title: 'TaxPal — Dashboard',
  },

  {
    path: 'income',
    loadComponent: () =>
      import('./pages/income/income.page').then(
        (m) => m.IncomePageComponent,
      ),
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

  { path: '**', redirectTo: 'dashboard' },
];