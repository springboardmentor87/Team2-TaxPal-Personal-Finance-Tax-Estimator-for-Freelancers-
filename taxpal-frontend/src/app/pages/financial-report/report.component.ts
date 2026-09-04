
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ReportService,
  Report
} from '../../services/financial-report.service';

export type ReportType =
  | 'Transactions Report'
  | 'Dashboard Report'
  | 'Tax Report';

export type ReportPeriod =
  | 'Current Month'
  | 'Current Quarter'
  | 'Current Year';

export type ReportFormat =
  | 'PDF'
  | 'CSV';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl:'./report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {

  private readonly reportService =
    inject(ReportService);

  // Form fields
  reportType: ReportType =
    'Transactions Report';

  period: ReportPeriod =
    'Current Month';

  format: ReportFormat =
    'PDF';

  // Reports shown in Recent Reports
  recentReports: Report[] = [];

  // UI state
  isGenerating = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.errorMessage = '';

    this.reportService
      .getReports()
      .subscribe({
        next: (response) => {
          this.recentReports =
            response.data ?? [];
        },

        error: (error: HttpErrorResponse) => {
          console.error(
            'Error loading reports:',
            error
          );

          this.errorMessage =
            this.getErrorMessage(
              error,
              'Failed to load reports.'
            );
        }
      });
  }

  generateReport(): void {
    this.errorMessage = '';

    if (
      !this.reportType ||
      !this.period ||
      !this.format
    ) {
      this.errorMessage =
        'Please select all report options.';
      return;
    }

    this.isGenerating = true;

    const payload = {
      reportType: this.reportType,
      period: this.period,
      format:
        this.format.toLowerCase() as
        'pdf' | 'csv'
    };

    this.reportService
      .generateReport(payload)
      .subscribe({
        next: () => {
          this.isGenerating = false;

          // Reload reports so the newly
          // generated report appears in the table
          this.loadReports();
        },

        error: (error: HttpErrorResponse) => {
          console.error(
            'Error generating report:',
            error
          );

          this.errorMessage =
            this.getErrorMessage(
              error,
              'Failed to generate report.'
            );

          this.isGenerating = false;
        }
      });
  }

  editReport(report: Report): void {
    this.errorMessage = '';

    if (
      report.reportType ===
        'Transactions Report' ||
      report.reportType ===
        'Dashboard Report' ||
      report.reportType ===
        'Tax Report'
    ) {
      this.reportType =
        report.reportType as ReportType;
    }

    if (
      report.period === 'Current Month' ||
      report.period === 'Current Quarter' ||
      report.period === 'Current Year'
    ) {
      this.period =
        report.period as ReportPeriod;
    }

    const reportFormat =
      String(report.format).toUpperCase();

    if (
      reportFormat === 'PDF' ||
      reportFormat === 'CSV'
    ) {
      this.format =
        reportFormat as ReportFormat;
    }

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  deleteReport(report: Report): void {
    this.errorMessage = '';

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${report.reportType}"?`
      );

    if (!confirmed) {
      return;
    }

    this.reportService
      .deleteReport(report.id)
      .subscribe({
        next: () => {
          this.recentReports =
            this.recentReports.filter(
              item => item.id !== report.id
            );
        },

        error: (error: HttpErrorResponse) => {
          console.error(
            'Error deleting report:',
            error
          );

          this.errorMessage =
            this.getErrorMessage(
              error,
              'Failed to delete report.'
            );
        }
      });
  }


  getGeneratedDate(
    report: Report
  ): string {

    if (!report.createdAt) {
      return '-';
    }

    const date =
      new Date(report.createdAt);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return '-';
    }

    return date.toLocaleDateString(
      'en-GB',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }
    );
  }

  private getErrorMessage(
    error: HttpErrorResponse,
    defaultMessage: string
  ): string {

    if (error.status === 0) {
      return (
        'Unable to connect to the backend server. ' +
        'Make sure the backend is running on port 5000.'
      );
    }

    if (error.status === 401) {
      return (
        'Your session has expired. ' +
        'Please login again.'
      );
    }

    if (error.status === 403) {
      return (
        'You are not authorized to access reports.'
      );
    }

    if (error.status === 404) {
      return (
        'Report endpoint or report was not found.'
      );
    }

    if (error.error?.message) {
      return error.error.message;
    }

    if (
      typeof error.error === 'string'
    ) {
      return error.error;
    }

    return defaultMessage;
  }
}

