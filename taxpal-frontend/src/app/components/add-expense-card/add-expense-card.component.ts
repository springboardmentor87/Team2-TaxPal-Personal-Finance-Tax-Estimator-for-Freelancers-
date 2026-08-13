import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { NewTransaction } from '../../models/transaction.model';
import { CategoryService } from '../../services/category.service';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

@Component({
  selector: 'app-add-expense-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './add-expense-card.component.html',
})
export class AddExpenseCardComponent implements OnInit {
  @Output() add = new EventEmitter<NewTransaction>();

  categoryService = inject(CategoryService);
  categories: string[] = [];
  error = '';

  readonly form = this.fb.group({
    amount: [''],
    category: [''],
    date: [today()],
    description: [''],
  });

  constructor(private readonly fb: FormBuilder) {}

  ngOnInit(): void {
    this.categoryService.getExpenseCategoryNames().subscribe((names) => {
      this.categories = names;
      if (names.length > 0 && !this.form.value.category) {
        this.form.patchValue({ category: names[0] });
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
    const selectedCategory = category || (this.categories.length > 0 ? this.categories[0] : 'Business Expenses');

    this.add.emit({
      amount: value,
      category: selectedCategory,
      date: date ?? today(),
      description: description.trim(),
      type: 'expense'
    });

    this.form.reset({
      amount: '',
      category: selectedCategory,
      date: today(),
      description: '',
    });
  }
}
