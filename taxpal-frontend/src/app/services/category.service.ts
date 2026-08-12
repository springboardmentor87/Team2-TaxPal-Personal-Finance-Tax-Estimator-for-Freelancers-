import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CategoryItem {
  id?: number;
  name: string;
  type: 'income' | 'expense';
  color?: string;
  icon?: string;
  description?: string;
  active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = 'http://localhost:5000/api/categories';

  constructor(private http: HttpClient) {}

  getCategories(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  createCategory(data: CategoryItem): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  updateCategory(id: number, data: Partial<CategoryItem>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
