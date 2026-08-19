import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TaxEvent {
  id: number;
  userId: number;
  title: string;
  description?: string;
  dueDate: string;
  completed: boolean;
  isCustom: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaxCalendarService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5000/api/tax/calendar';

  getEvents(year?: number, country?: string): Observable<{ success: boolean; message: string; data: TaxEvent[] }> {
    let url = this.apiUrl;
    const params: string[] = [];
    if (year) {
      params.push(`year=${year}`);
    }
    if (country) {
      params.push(`country=${country}`);
    }
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    return this.http.get<{ success: boolean; message: string; data: TaxEvent[] }>(url);
  }

  createEvent(event: { title: string; description?: string; dueDate: string }): Observable<{ success: boolean; message: string; data: TaxEvent }> {
    return this.http.post<{ success: boolean; message: string; data: TaxEvent }>(this.apiUrl, event);
  }

  updateEvent(id: number, updates: Partial<TaxEvent>): Observable<{ success: boolean; message: string; data: TaxEvent }> {
    return this.http.put<{ success: boolean; message: string; data: TaxEvent }>(`${this.apiUrl}/${id}`, updates);
  }

  deleteEvent(id: number): Observable<{ success: boolean; message: string; data: null }> {
    return this.http.delete<{ success: boolean; message: string; data: null }>(`${this.apiUrl}/${id}`);
  }
}
