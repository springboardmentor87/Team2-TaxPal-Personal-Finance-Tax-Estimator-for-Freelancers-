import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";

import { SidebarComponent } from "../../components/sidebar/sidebar.component";
import { UiStateService } from "../../services/ui-state.service";
import { SummaryCardsComponent } from "../../components/summary-cards/summary-cards.component";
import { TopbarComponent } from "../../components/topbar/topbar.component";
import { IncomeExpenseChartComponent } from "../../components/income-expense-chart/income-expense-chart.component";
import { ExpenseDonutChartComponent } from "../../components/expense-donut-chart/expense-donut-chart.component";
import { TransactionsTableComponent } from "../../components/transactions-table/transactions-table.component";
import { TransactionService } from "../../services/transaction.service";
import { AuthService } from "../../services/auth.service";
import { CurrencyService } from "../../services/currency.service";
import { ReportsComponent } from "../reports/reports.component";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [
    CommonModule,
    SummaryCardsComponent,
    TopbarComponent,
    SidebarComponent,
    IncomeExpenseChartComponent,
    ExpenseDonutChartComponent,
    TransactionsTableComponent,
    ReportsComponent,
  ],
  templateUrl: "./dashboard.component.html",
})
export class DashboardComponent implements OnInit {
  // Dashboard is shown initially

  sidebarOpen = false;

  ui = inject(UiStateService);
  auth = inject(AuthService);
  currency = inject(CurrencyService);

  private readonly transactionService = inject(TransactionService);

  summary: any = null;

  ngOnInit(): void {
    this.ui.closeReports();
    this.transactionService.getDashboardSummary().subscribe({
      next: (res) => {
        this.summary = res.data;
      },
      error: (err) => console.error("Error fetching dashboard summary", err),
    });
  }

  openSidebar(): void {
    this.sidebarOpen = true;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }
  openReports(): void {
    this.ui.openReports();
  }
}
