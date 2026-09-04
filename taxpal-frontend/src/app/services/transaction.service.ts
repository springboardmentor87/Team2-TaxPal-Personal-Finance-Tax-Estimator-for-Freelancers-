import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Transaction, NewTransaction } from '../models/transaction.model';
import { NotificationService } from './notification.service';
import { CurrencyService } from './currency.service';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = 'http://localhost:5000/api';
  private notificationService = inject(NotificationService);
  private currency = inject(CurrencyService);

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
    return this.http.get<any>(`${this.apiUrl}/dashboard/summary`).pipe(
      tap((res) => {
        const summary = res?.data?.summary || res?.data || res?.summary;
        if (!summary || typeof summary.currentBalance !== 'number') return;

        const balance = summary.currentBalance;
        const symbol = this.currency.currencySymbol();

        if (balance < 0) {
          // Only fires the toast ONCE per session until balance goes positive again
          this.notificationService.notifyOutOfBalance(
            Math.abs(balance),
            'Account Balance',
            symbol
          );
        } else {
          // Balance is healthy — re-arm the toast so it fires again if balance goes negative
          this.notificationService.resolveOutOfBalance('Account Balance');
        }
      })
    );
  }
}
