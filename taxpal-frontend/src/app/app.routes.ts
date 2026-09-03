import { Routes } from "@angular/router";
import { authGuard } from "./guards/auth.guard";

export const routes: Routes = [
  { path: "", redirectTo: "dashboard", pathMatch: "full" },

  {
    path: "login",
    loadComponent: () =>
      import("./pages/login/login.page").then((m) => m.LoginPageComponent),
    title: "TaxPal — Sign In",
  },
  {
    path: "register",
    loadComponent: () =>
      import("./pages/register/register.page").then(
        (m) => m.RegisterPageComponent,
      ),
    title: "TaxPal — Create Account",
  },

  {
    path: "dashboard",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./pages/dashboard/dashboard.component").then(
        (m) => m.DashboardComponent,
      ),
    title: "TaxPal — Dashboard",
  },

  {
    path: "income",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./pages/income/income.page").then((m) => m.IncomePageComponent),
    title: "TaxPal — Income",
  },

  {
    path: "expense",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./pages/expense/expense.page").then(
        (m) => m.ExpensePageComponent,
      ),
    title: "TaxPal — Expenses",
  },

  {
    path: "budget",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./pages/budget/budget.component").then((m) => m.BudgetComponent),
    title: "TaxPal — Budget",
  },

  {
    path: "settings",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./pages/settings/settings.page").then(
        (m) => m.SettingsPageComponent,
      ),
    title: "TaxPal — Settings",
  },

  {
    path: "tax-estimator",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./pages/tax-estimator/tax-estimator.component").then(
        (m) => m.TaxEstimatorComponent,
      ),
    title: "TaxPal — Tax Estimator",
  },

  {
    path: "tax-calendar",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./pages/tax-calendar/tax-calendar.page").then(
        (m) => m.TaxCalendarPageComponent,
      ),
    title: "TaxPal — Tax Calendar",
  },
  {
    path: "reports",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./pages/reports/reports.component").then(
        (m) => m.ReportsComponent,
      ),
    title: "TaxPal — Reports",
  },

  { path: "**", redirectTo: "dashboard" },
];
