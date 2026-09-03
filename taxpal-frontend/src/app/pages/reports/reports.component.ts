import { Component, signal, computed, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";

import { GeneratedReport, ReportType, REPORT_OPTIONS } from "./report.model";
import { generateMockReport } from "./report-mock-data";
import { UiStateService } from "../../services/ui-state.service";

@Component({
  selector: "app-reports",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./reports.component.html",
  styleUrl: "./reports.component.css",
})
export class ReportsComponent {
  readonly reportOptions = REPORT_OPTIONS;

  private readonly ui = inject(UiStateService);

  selectedType = signal<ReportType | null>(null);

  report = computed<GeneratedReport | null>(() => {
    const type = this.selectedType();

    if (!type) {
      return null;
    }

    return generateMockReport(type);
  });

  onReportTypeChange(value: string): void {
    this.selectedType.set(value ? (value as ReportType) : null);
  }

  onPrint(): void {
    window.print();
  }

  onDownload(): void {
    const report = this.report();

    if (!report) {
      return;
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `${report.type}-report.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  // BACK TO THE CURRENT PAGE
  onBack(): void {
    this.ui.closeReports();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);
  }
}
