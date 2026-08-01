import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { CATEGORIES, NewTransaction } from '../../models/transaction.model';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

@Component({
  selector: 'app-add-expense-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './add-expense-card.component.html',
})
export class AddExpenseCardComponent {
  @Output() add = new EventEmitter<NewTransaction>();

  readonly categories = CATEGORIES;
  error = '';

  readonly form = this.fb.group({
    amount: [''],
    category: [CATEGORIES[2]],
    date: [today()],
    description: [''],
  });

  constructor(private readonly fb: FormBuilder) {}

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
      category: category ?? CATEGORIES[2],
      date: date ?? today(),
      description: description.trim(),
      type: 'expense',
      status: 'completed',
    });

    this.form.reset({
      amount: '',
      category: CATEGORIES[2],
      date: today(),
      description: '',
    });
  }
}
