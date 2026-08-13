import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface CategoryItem {
  id?: number;
  name: string;
  type: 'income' | 'expense';
  color?: string;
  icon?: string;
  description?: string;
  active?: boolean;
}

const DEFAULT_EXPENSE_CATEGORIES: CategoryItem[] = [
  { id: 101, name: 'Business Expenses', type: 'expense', color: '#EF4444' },
  { id: 102, name: 'Office Rent', type: 'expense', color: '#0EA5E9' },
  { id: 103, name: 'Software Subscriptions', type: 'expense', color: '#8B5CF6' },
  { id: 104, name: 'Professional Development', type: 'expense', color: '#10B981' },
  { id: 105, name: 'Marketing', type: 'expense', color: '#F59E0B' },
  { id: 106, name: 'Travel', type: 'expense', color: '#EC4899' },
  { id: 107, name: 'Meals & Entertainment', type: 'expense', color: '#6366F1' },
  { id: 108, name: 'Utilities', type: 'expense', color: '#DC2626' },
  { id: 109, name: 'Groceries', type: 'expense', color: '#84CC16' },
  { id: 110, name: 'Rent', type: 'expense', color: '#3B82F6' },
  { id: 111, name: 'Other', type: 'expense', color: '#6B7280' }
];

const DEFAULT_INCOME_CATEGORIES: CategoryItem[] = [
  { id: 201, name: 'Freelance Design', type: 'income', color: '#10B981' },
  { id: 202, name: 'Client Retainer', type: 'income', color: '#0EA5E9' },
  { id: 203, name: 'Consulting', type: 'income', color: '#8B5CF6' },
  { id: 204, name: 'Product Sales', type: 'income', color: '#F59E0B' },
  { id: 205, name: 'Salary', type: 'income', color: '#6366F1' },
  { id: 206, name: 'Freelance', type: 'income', color: '#EC4899' },
  { id: 207, name: 'Other', type: 'income', color: '#6B7280' }
];

const STORAGE_KEY = 'taxpal_custom_categories_v2';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = 'http://localhost:5000/api/categories';
  private categoriesSubject = new BehaviorSubject<CategoryItem[]>(this.getInitialCategories());

  public categories$ = this.categoriesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.refreshFromBackend();
  }

  private getInitialCategories(): CategoryItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not parse stored categories:', e);
    }
    return [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
  }

  private saveToStorage(cats: CategoryItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cats));
    } catch (e) {
      console.warn('Could not save categories to localStorage:', e);
    }
  }

  public refreshFromBackend(): Observable<CategoryItem[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      tap((res) => {
        let fetched: CategoryItem[] = [];
        if (Array.isArray(res?.data?.items)) {
          fetched = res.data.items;
        } else if (Array.isArray(res?.data)) {
          fetched = res.data;
        } else if (Array.isArray(res?.items)) {
          fetched = res.items;
        } else if (Array.isArray(res)) {
          fetched = res;
        }

        if (fetched.length > 0) {
          // Merge fetched categories with local list to preserve newly added categories
          const current = this.categoriesSubject.getValue();
          const mergedMap = new Map<string, CategoryItem>();
          current.forEach(c => mergedMap.set(`${c.type}_${c.name.toLowerCase()}`, c));
          fetched.forEach(c => mergedMap.set(`${c.type}_${c.name.toLowerCase()}`, c));

          const mergedList = Array.from(mergedMap.values());
          this.categoriesSubject.next(mergedList);
          this.saveToStorage(mergedList);
        }
      }),
      catchError(() => {
        return of(this.categoriesSubject.getValue());
      })
    );
  }

  getCategories(): Observable<CategoryItem[]> {
    return this.categories$;
  }

  getIncomeCategoryNames(): Observable<string[]> {
    return new Observable<string[]>((observer) => {
      this.categories$.subscribe((cats) => {
        const incomeNames = cats
          .filter((c) => c.type === 'income')
          .map((c) => c.name);

        if (!incomeNames.includes('Other')) {
          incomeNames.push('Other');
        }
        observer.next(incomeNames);
      });
    });
  }

  getExpenseCategoryNames(): Observable<string[]> {
    return new Observable<string[]>((observer) => {
      this.categories$.subscribe((cats) => {
        const expenseNames = cats
          .filter((c) => c.type === 'expense')
          .map((c) => c.name);

        if (!expenseNames.includes('Other')) {
          expenseNames.push('Other');
        }
        observer.next(expenseNames);
      });
    });
  }

  createCategory(data: CategoryItem): Observable<any> {
    const current = this.categoriesSubject.getValue();
    const newCat: CategoryItem = {
      ...data,
      id: data.id || Date.now()
    };

    // Update local state immediately
    const updated = [newCat, ...current];
    this.categoriesSubject.next(updated);
    this.saveToStorage(updated);

    return this.http.post<any>(this.apiUrl, data).pipe(
      tap((res) => {
        if (res?.data?.id) {
          newCat.id = res.data.id;
          this.saveToStorage(this.categoriesSubject.getValue());
        }
      }),
      catchError(() => of(newCat))
    );
  }

  updateCategory(id: number, data: Partial<CategoryItem>): Observable<any> {
    const current = this.categoriesSubject.getValue();
    const updated = current.map((c) => (c.id === id ? { ...c, ...data } : c));
    this.categoriesSubject.next(updated);
    this.saveToStorage(updated);

    return this.http.put<any>(`${this.apiUrl}/${id}`, data).pipe(
      catchError(() => of(data))
    );
  }

  deleteCategory(id: number): Observable<any> {
    const current = this.categoriesSubject.getValue();
    const updated = current.filter((c) => c.id !== id);
    this.categoriesSubject.next(updated);
    this.saveToStorage(updated);

    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      catchError(() => of(true))
    );
  }
}
