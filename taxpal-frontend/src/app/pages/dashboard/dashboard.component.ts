import { Component, OnInit, inject } from "@angular/core";
import { CommonModule, CurrencyPipe } from "@angular/common";
import { SidebarComponent } from "../../components/sidebar/sidebar.component";
import { UiStateService } from "../../services/ui-state.service";
import { SummaryCardsComponent } from "../../components/summary-cards/summary-cards.component";
import { TopbarComponent } from "../../components/topbar/topbar.component";
import { IncomeExpenseChartComponent } from "../../components/income-expense-chart/income-expense-chart.component";
import { ExpenseDonutChartComponent } from "../../components/expense-donut-chart/expense-donut-chart.component";
import { TransactionsTableComponent } from "../../components/transactions-table/transactions-table.component";
import { TransactionService } from "../../services/transaction.service";
import { AuthService } from "../../services/auth.service";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    SummaryCardsComponent,
    TopbarComponent,
    SidebarComponent,
    IncomeExpenseChartComponent,
    ExpenseDonutChartComponent,
    TransactionsTableComponent,
  ],
  templateUrl: "./dashboard.component.html",
})
export class DashboardComponent implements OnInit {
  sidebarOpen = false;
  ui = inject(UiStateService);
  auth = inject(AuthService);
  private readonly transactionService = inject(TransactionService);

  summary: any = null;

  ngOnInit(): void {
    this.transactionService.getDashboardSummary().subscribe({
      next: (res) => {
        this.summary = res.data;
      },
      error: (err) => console.error("Error fetching dashboard summary", err)
    });
  }

  openSidebar() {
    this.sidebarOpen = true;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }
}

