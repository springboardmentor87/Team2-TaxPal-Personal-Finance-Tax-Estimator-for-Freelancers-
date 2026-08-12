import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { NewTransaction } from '../../models/transaction.model';
import { CategoryService, CategoryItem } from '../../services/category.service';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULT_EXPENSE_CATEGORIES = [
  'Business Expenses',
  'Office Rent',
  'Software Subscriptions',
  'Professional Development',
  'Marketing',
  'Travel',
  'Meals & Entertainment',
  'Utilities',
  'Groceries',
  'Rent',
  'Other'
];

@Component({
  selector: 'app-add-expense-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './add-expense-card.component.html',
})
export class AddExpenseCardComponent implements OnInit {
  @Output() add = new EventEmitter<NewTransaction>();

  categoryService = inject(CategoryService);
  categories: string[] = DEFAULT_EXPENSE_CATEGORIES;
  error = '';

  readonly form = this.fb.group({
    amount: [''],
    category: [DEFAULT_EXPENSE_CATEGORIES[0]],
    date: [today()],
    description: [''],
  });

  constructor(private readonly fb: FormBuilder) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (res: any) => {
        const fetched: CategoryItem[] = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        const expenseCats = fetched.filter((c) => c.type === 'expense').map((c) => c.name);
        if (expenseCats.length > 0) {
          this.categories = expenseCats;
          this.form.patchValue({ category: expenseCats[0] });
        }
      },
      error: () => {
        this.categories = DEFAULT_EXPENSE_CATEGORIES;
      }
    });
  }

  handleSubmit(): void {
    const { amount, category, date, description } = this.form.getRawValue();
    const value = Number.parseFloat(amount ?? '');

    if (!value || value <= 0) {
      this.error = 'Please enter a valid expense amount.';
      return;
    }
    if (!description || !description.trim()) {
      this.error = 'Please enter an expense description.';
      return;
    }

    this.error = '';
    this.add.emit({
      amount: value,
      category: category ?? this.categories[0],
      date: date ?? today(),
      description: description.trim(),
      type: 'expense'
    });

    this.form.reset({
      amount: '',
      category: this.categories[0],
      date: today(),
      description: '',
    });
  }
}
