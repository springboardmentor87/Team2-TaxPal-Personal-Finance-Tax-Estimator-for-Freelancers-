import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { BudgetService } from '../../services/budget.service';
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
  imports: [FormsModule, CommonModule],
  templateUrl: './budget.component.html',
  styleUrls: ['./budget.component.css']
})
export class BudgetComponent implements OnInit {

  // New / Edit budget form
  budget: BudgetForm = {
    category: '',
    amount: null,
    month: '',
    period: 'monthly'
  };

  // Saved budgets from backend
  budgets: Budget[] = [];

  // Budget health
  budgetHealth = '-';

  // Edit mode
  editingBudgetId: number | null = null;

  // Loading state
  isLoading = false;

  // Error message
  errorMessage = '';

  constructor(
    private budgetService: BudgetService
  ) {}

  // Page load
  ngOnInit(): void {
    this.loadBudgets();
  }


  // GET /api/budgets
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

        this.updateBudgetHealth();

        this.isLoading = false;
      },

      error: (error) => {

        console.error('Error loading budgets:', error);

        this.errorMessage = 'Unable to load budgets.';
        this.isLoading = false;
      }

    });
  }


  // POST /api/budgets
  // PUT /api/budgets/:id
  
  createBudget(): void {
      
    console.log('UPDATE/CREATE BUTTON CLICKED');

    if (
      !this.budget.category ||
      this.budget.amount === null ||
       
      !this.budget.period ||
      (this.editingBudgetId === null && !this.budget.month)
    ) {
      return;
    }

    const budgetData: NewBudget = {
      name: `${this.budget.category} Budget`,
      category: this.budget.category,
      amount: this.budget.amount,
      month: this.budget.month || null,
      period: this.budget.period
    };


    // EDIT existing budget
    if (this.editingBudgetId !== null) {

      this.budgetService.updateBudget(
          this.editingBudgetId,
          budgetData
        )
        .subscribe({

          next: () => {

            this.loadBudgets();
            this.resetForm();

          },

          error: (error) => {

            console.error(
              'Error updating budget:',
              error
            );

            this.errorMessage =
              'Unable to update budget.';
          }

        });

      return;
    }


    // CREATE new budget
    this.budgetService
      .createBudget(budgetData)
      .subscribe({

        next: () => {

          this.loadBudgets();
          this.resetForm();

        },

        error: (error) => {

          console.error(
            'Error creating budget:',
            error
          );

          this.errorMessage =
            'Unable to create budget.';
        }

      });
  }


  // Edit budget
  editBudget(item: Budget): void {

    this.editingBudgetId = item.id;

    this.budget = {

      category: item.category,

      amount: item.amount,

      month: item.month ?? '',

      period: item.period

    };

    // Scroll to top so user can edit
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }


  // DELETE /api/budgets/:id
  deleteBudget(item: Budget): void {

    if (!item.id) {
      return;
    }

    this.budgetService
      .deleteBudget(item.id)
      .subscribe({

        next: () => {

          this.budgets =
            this.budgets.filter(
              budget => budget.id !== item.id
            );

          this.updateBudgetHealth();

        },

        error: (error) => {

          console.error(
            'Error deleting budget:',
            error
          );

          this.errorMessage =
            'Unable to delete budget.';
        }

      });
  }


  // Get Budget Health from backend
  updateBudgetHealth(): void {

    if (!this.budgets.length) {

      this.budgetHealth = '-';
      return;
    }


    const statuses = this.budgets

      .map(
        budget => budget.usage?.status
      )

      .filter(
        status => !!status
      );


    if (!statuses.length) {

      this.budgetHealth = '-';
      return;
    }


    // Highest severity wins
    if (statuses.includes('over')) {

      this.budgetHealth = 'over';

    } else if (statuses.includes('warning')) {

      this.budgetHealth = 'warning';

    } else {

      this.budgetHealth = 'healthy';

    }
  }


  // Reset form
  resetForm(): void {

    this.budget = {

      category: '',

      amount: null,

      month: '',

      period: 'monthly'

    };

    this.editingBudgetId = null;
  }
}