import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { TopbarComponent } from '../../components/topbar/topbar.component';
import { AuthService } from '../../services/auth.service';
import { BudgetService } from '../../services/budget.service';
import { CategoryService, CategoryItem } from '../../services/category.service';
import { CurrencyService } from '../../services/currency.service';
import {
  Budget,
  NewBudget,
  BudgetPeriod
} from '../../models/budget.model';

interface BudgetForm {
  category: string;
  amount: number | null;
  month: string;
  period: BudgetPeriod;
}

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [FormsModule, CommonModule, SidebarComponent, TopbarComponent],
  templateUrl: './budget.component.html',
  styleUrls: ['./budget.component.css']
})
export class BudgetComponent implements OnInit {
  sidebarOpen = false;

  budget: BudgetForm = {
    category: '',
    amount: null,
    month: new Date().toISOString().slice(0, 7),
    period: 'monthly'
  };

  budgets: Budget[] = [];
  budgetHealth = 'Good';

  totalBudget = 0;
  totalSpent = 0;
  totalRemaining = 0;

  editingBudgetId: number | null = null;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  categoriesList: string[] = [
    'Food',
    'Rent',
    'Utilities',
    'Travel',
    'Business Expenses',
    'Marketing',
    'Office Rent',
    'Software Subscriptions',
    'Professional Development',
    'Meals & Entertainment',
    'Healthcare',
    'Entertainment',
    'Other'
  ];

  categoryService = inject(CategoryService);
  currency = inject(CurrencyService);

  constructor(
    private budgetService: BudgetService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadBudgets();
  }

  loadCategories(): void {
    this.categoryService.getExpenseCategoryNames().subscribe((names) => {
      if (names.length > 0) {
        this.categoriesList = names;
      }
    });
  }

  openSidebar(): void {
    this.sidebarOpen = true;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  loadBudgets(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.budgetService.getBudgets().subscribe({
      next: (response: any) => {
        if (Array.isArray(response?.data?.items)) {
          this.budgets = response.data.items;
        } else if (Array.isArray(response?.items)) {
          this.budgets = response.items;
        } else if (Array.isArray(response)) {
          this.budgets = response;
        } else {
          this.budgets = [];
        }

        this.calculateSummaries();
        this.updateBudgetHealth();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading budgets:', error);
        this.errorMessage = 'Unable to load budgets from backend.';
        this.isLoading = false;
      }
    });
  }

  calculateSummaries(): void {
    this.totalBudget = this.budgets.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    this.totalSpent = this.budgets.reduce((sum, b) => sum + (Number(b.usage?.spent) || 0), 0);
    this.totalRemaining = this.totalBudget - this.totalSpent;
  }

  createBudget(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.budget.category || this.budget.amount === null || this.budget.amount <= 0) {
      this.errorMessage = 'Please select a category and enter a valid positive budget amount.';
      return;
    }

    const budgetData: NewBudget = {
      name: `${this.budget.category} Budget`,
      category: this.budget.category,
      amount: this.budget.amount,
      limit: this.budget.amount,
      month: this.budget.month || new Date().toISOString().slice(0, 7),
      period: this.budget.period || 'monthly'
    };

    if (this.editingBudgetId !== null) {
      this.budgetService.updateBudget(this.editingBudgetId, budgetData).subscribe({
        next: () => {
          this.successMessage = 'Budget updated successfully!';
          this.loadBudgets();
          this.resetForm();
        },
        error: (error) => {
          console.error('Error updating budget:', error);
          this.errorMessage = 'Unable to update budget.';
        }
      });
      return;
    }

    this.budgetService.createBudget(budgetData).subscribe({
      next: () => {
        this.successMessage = 'New budget created successfully!';
        this.loadBudgets();
        this.resetForm();
      },
      error: (error) => {
        console.error('Error creating budget:', error);
        this.errorMessage = 'Unable to create budget.';
      }
    });
  }

  editBudget(item: Budget): void {
    this.editingBudgetId = item.id;
    this.budget = {
      category: item.category,
      amount: item.amount,
      month: item.month ?? new Date().toISOString().slice(0, 7),
      period: item.period || 'monthly'
    };

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteBudget(item: Budget): void {
    if (!item.id) return;

    this.budgetService.deleteBudget(item.id).subscribe({
      next: () => {
        this.budgets = this.budgets.filter((b) => b.id !== item.id);
        this.calculateSummaries();
        this.updateBudgetHealth();
        this.successMessage = 'Budget deleted successfully.';
      },
      error: (error) => {
        console.error('Error deleting budget:', error);
        this.errorMessage = 'Unable to delete budget.';
      }
    });
  }

  updateBudgetHealth(): void {
    if (!this.budgets.length) {
      this.budgetHealth = 'Good';
      return;
    }

    const statuses = this.budgets.map((b) => b.usage?.status).filter(Boolean);

    if (statuses.includes('over')) {
      this.budgetHealth = 'Over Budget';
    } else if (statuses.includes('warning')) {
      this.budgetHealth = 'Warning';
    } else {
      this.budgetHealth = 'Good';
    }
  }

  resetForm(): void {
    this.budget = {
      category: '',
      amount: null,
      month: new Date().toISOString().slice(0, 7),
      period: 'monthly'
    };
    this.editingBudgetId = null;
  }

  getUtilizationPercent(item: Budget): number {
    if (!item.amount || item.amount <= 0) return 0;
    const spent = item.usage?.spent || 0;
    return Math.min(Math.round((spent / item.amount) * 100), 100);
  }
}