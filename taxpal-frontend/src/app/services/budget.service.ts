import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Budget, NewBudget } from '../models/budget.model';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {

  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  // GET /api/budgets
  getBudgets(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/budgets`
    );
  }

  // GET /api/budgets/:id
  getBudget(id: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/budgets/${id}`
    );
  }

  // POST /api/budgets
  createBudget(data: NewBudget): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/budgets`,
      data
    );
  }

  // PUT /api/budgets/:id
  updateBudget(
    id: number,
    data: Partial<NewBudget>
  ): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/budgets/${id}`,
      data
    );
  }

  // PATCH /api/budgets/:id
  patchBudget(
    id: number,
    data: Partial<NewBudget>
  ): Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}/budgets/${id}`,
      data
    );
  }

  // DELETE /api/budgets/:id
  deleteBudget(id: number): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}/budgets/${id}`
    );
  }

  // GET /api/budgets/progress
  getBudgetProgress(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/budgets/progress`
    );
  }

  // GET /api/budgets/analytics
  getBudgetAnalytics(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/budgets/analytics`
    );
  }
}