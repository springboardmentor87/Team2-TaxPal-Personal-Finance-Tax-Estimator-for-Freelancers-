import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { TopbarComponent } from '../../components/topbar/topbar.component';
import { CurrencyService } from '../../services/currency.service';
import {
  ReportService,
  Report,
  ReportPreviewData,
  GenerateReportRequest
} from '../../services/financial-report.service';

export type ReportType =
  | 'Income Statement'
  | 'Expense Breakdown'
  | 'Tax Summary Report'
  | 'Transaction History';

export type ReportPeriod =
  | 'Current Month'
  | 'Previous Month'
  | 'Current Quarter'
  | 'Year-to-Date';

export type ReportFormat = 'PDF' | 'CSV';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    TopbarComponent
  ],
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {
  sidebarOpen = false;

  private readonly reportService = inject(ReportService);
  public readonly currency = inject(CurrencyService);

  // Form Fields
  reportType: ReportType = 'Income Statement';
  period: ReportPeriod = 'Current Month';
  format: ReportFormat = 'PDF';

  // Report Type Options
  reportTypeOptions: ReportType[] = [
    'Income Statement',
    'Expense Breakdown',
    'Tax Summary Report',
    'Transaction History'
  ];

  // Period Options
  periodOptions: ReportPeriod[] = [
    'Current Month',
    'Previous Month',
    'Current Quarter',
    'Year-to-Date'
  ];

  // Format Options
  formatOptions: ReportFormat[] = ['PDF', 'CSV'];

  // State
  recentReports: Report[] = [];
  selectedReport: Report | null = null;
  previewData: ReportPreviewData['preview'] | null = null;

  isGenerating = false;
  isLoadingPreview = false;
  isDownloading = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.loadReports();
  }

  openSidebar(): void {
    this.sidebarOpen = true;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  loadReports(): void {
    this.errorMessage = '';
    this.reportService.getReports().subscribe({
      next: (response) => {
        this.recentReports = response.data ?? [];
        if (this.recentReports.length > 0 && !this.selectedReport) {
          this.selectReportForPreview(this.recentReports[0]);
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading reports:', error);
        this.errorMessage = this.getErrorMessage(error, 'Failed to load reports.');
      }
    });
  }

  generateReport(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.reportType || !this.period || !this.format) {
      this.errorMessage = 'Please select all report options.';
      return;
    }

    this.isGenerating = true;

    const payload: GenerateReportRequest = {
      reportType: this.reportType,
      period: this.period,
      format: this.format
    };

    this.reportService.generateReport(payload).subscribe({
      next: (res) => {
        this.isGenerating = false;
        this.successMessage = `Successfully generated ${this.reportType} (${this.format})!`;
        const newReport = res.data;
        this.recentReports = [newReport, ...this.recentReports.filter(r => r.id !== newReport.id)];
        this.selectReportForPreview(newReport);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error generating report:', error);
        this.errorMessage = this.getErrorMessage(error, 'Failed to generate report.');
        this.isGenerating = false;
      }
    });
  }

  resetForm(): void {
    this.reportType = 'Income Statement';
    this.period = 'Current Month';
    this.format = 'PDF';
    this.errorMessage = '';
    this.successMessage = '';
  }

  selectReportForPreview(report: Report): void {
    this.selectedReport = report;
    this.isLoadingPreview = true;
    this.errorMessage = '';

    this.reportService.getReportPreview(report.id).subscribe({
      next: (res) => {
        this.previewData = res.data?.preview ?? null;
        this.isLoadingPreview = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Preview error:', err);
        this.isLoadingPreview = false;
        // Fallback preview data
        this.previewData = {
          type: 'transactions',
          summary: { note: 'Preview generated from report archive' }
        };
      }
    });
  }

  downloadReport(report?: Report): void {
    const target = report || this.selectedReport;
    if (!target) return;

    this.isDownloading = true;
    this.reportService.downloadReport(target.id).subscribe({
      next: (blob) => {
        this.isDownloading = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ext = String(target.format).toLowerCase() === 'csv' ? 'csv' : 'pdf';
        const sanitizedName = (target.reportType || 'Report').replace(/[^a-zA-Z0-9]/g, '_');
        const sanitizedPeriod = (target.period || 'Period').replace(/[^a-zA-Z0-9]/g, '_');
        a.download = target.filePath || `${sanitizedName}_${sanitizedPeriod}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err: HttpErrorResponse) => {
        this.isDownloading = false;
        console.error('Download error:', err);
        this.errorMessage = this.getErrorMessage(err, 'Failed to download report.');
      }
    });
  }

  printPreview(): void {
    window.print();
  }

  deleteReport(report: Report, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.errorMessage = '';

    const confirmed = window.confirm(`Are you sure you want to delete "${report.reportType}"?`);
    if (!confirmed) return;

    this.reportService.deleteReport(report.id).subscribe({
      next: () => {
        this.recentReports = this.recentReports.filter(item => item.id !== report.id);
        if (this.selectedReport?.id === report.id) {
          this.selectedReport = this.recentReports.length > 0 ? this.recentReports[0] : null;
          if (this.selectedReport) {
            this.selectReportForPreview(this.selectedReport);
          } else {
            this.previewData = null;
          }
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error deleting report:', error);
        this.errorMessage = this.getErrorMessage(error, 'Failed to delete report.');
      }
    });
  }

  getGeneratedDate(report: Report): string {
    if (!report.createdAt) return '-';
    const date = new Date(report.createdAt);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  private getErrorMessage(error: HttpErrorResponse, defaultMessage: string): string {
    if (error.status === 0) {
      return 'Unable to connect to the backend server. Make sure backend is running on port 5000.';
    }
    if (error.status === 401) {
      return 'Your session has expired. Please login again.';
    }
    if (error.error?.message) {
      return error.error.message;
    }
    return defaultMessage;
  }
}
