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
  format: 'pdf' | 'csv';
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:5000/api/reports';

  // =========================
  // Get Recent Reports
  // =========================

  getReports(): Observable<ApiResponse<Report[]>> {
    return this.http.get<ApiResponse<Report[]>>(this.apiUrl);
  }

  // =========================
  // Generate Report
  // =========================

  generateReport(
    data: GenerateReportRequest
  ): Observable<ApiResponse<Report>> {
    return this.http.post<ApiResponse<Report>>(
      this.apiUrl,
      data
    );
  }

  // =========================
  // Delete Report
  // =========================

  deleteReport(
    id: number
  ): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${this.apiUrl}/${id}`
    );
  }
}

