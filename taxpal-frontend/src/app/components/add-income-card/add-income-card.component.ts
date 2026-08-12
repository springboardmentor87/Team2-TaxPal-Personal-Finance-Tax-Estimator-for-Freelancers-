import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { NewTransaction } from '../../models/transaction.model';
import { CategoryService, CategoryItem } from '../../services/category.service';
import { CurrencyService } from '../../services/currency.service';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULT_INCOME_CATEGORIES = [
  'Freelance',
  'Salary',
  'Consulting',
  'Client Retainer',
  'Product Sales',
  'Other'
];

@Component({
  selector: 'app-add-income-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './add-income-card.component.html',
})
export class AddIncomeCardComponent implements OnInit {
  @Output() add = new EventEmitter<NewTransaction>();

  categoryService = inject(CategoryService);
  currency = inject(CurrencyService);
  categories: string[] = DEFAULT_INCOME_CATEGORIES;
  error = '';

  readonly form = this.fb.group({
    amount: [''],
    category: [DEFAULT_INCOME_CATEGORIES[0]],
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
        const incomeCats = fetched.filter((c) => c.type === 'income').map((c) => c.name);
        if (incomeCats.length > 0) {
          this.categories = incomeCats;
          this.form.patchValue({ category: incomeCats[0] });
        }
      },
      error: () => {
        this.categories = DEFAULT_INCOME_CATEGORIES;
      }
    });
  }

  handleSubmit(): void {
    const { amount, category, date, description } = this.form.getRawValue();
    const value = Number.parseFloat(amount ?? '');

    if (!value || value <= 0) {
      this.error = 'Please enter a valid income amount.';
      return;
    }
    if (!description || !description.trim()) {
      this.error = 'Please enter an income description.';
      return;
    }

    this.error = '';
    this.add.emit({
      amount: value,
      category: category ?? this.categories[0],
      date: date ?? today(),
      description: description.trim(),
      type: 'income'
    });

    this.form.reset({
      amount: '',
      category: this.categories[0],
      date: today(),
      description: '',
    });
  }
}
