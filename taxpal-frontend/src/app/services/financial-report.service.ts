import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Report {
  id: number;
  userId?: number;
  period: string;
  reportType: string;
  filePath?: string;
  format: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GenerateReportRequest {
  reportType: string;
  period: string;
  format: 'PDF' | 'CSV' | 'pdf' | 'csv';
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ReportPreviewData {
  report: Report;
  preview: {
    type: 'tax' | 'dashboard' | 'transactions' | 'expense' | 'income';
    summary?: any;
    estimate?: any;
    lines?: Array<{ label: string; value: any }>;
    transactions?: Array<any>;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5000/api/reports';

  getReports(): Observable<ApiResponse<Report[]>> {
    return this.http.get<ApiResponse<Report[]>>(this.apiUrl);
  }

  generateReport(data: GenerateReportRequest): Observable<ApiResponse<Report>> {
    return this.http.post<ApiResponse<Report>>(this.apiUrl, data);
  }

  deleteReport(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }

  downloadReport(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, {
      responseType: 'blob'
    });
  }

  getReportPreview(id: number): Observable<ApiResponse<ReportPreviewData>> {
    return this.http.get<ApiResponse<ReportPreviewData>>(`${this.apiUrl}/${id}/preview`);
  }
}
