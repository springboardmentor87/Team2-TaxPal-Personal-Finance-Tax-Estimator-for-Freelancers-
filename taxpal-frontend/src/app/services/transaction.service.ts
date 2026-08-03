import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Transaction, NewTransaction } from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  getTransactions(type?: 'income' | 'expense'): Observable<{data: {transactions: Transaction[], pagination: any}}> {
    let url = `${this.apiUrl}/transactions`;
    if (type) {
      url += `?type=${type}`;
    }
    return this.http.get<any>(url);
  }

  addTransaction(data: NewTransaction): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/transactions`, data);
  }

  deleteTransaction(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/transactions/${id}`);
  }

  getDashboardSummary(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/summary`);
  }
}
