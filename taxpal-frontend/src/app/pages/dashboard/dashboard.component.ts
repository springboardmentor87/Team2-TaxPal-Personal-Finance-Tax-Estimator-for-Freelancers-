import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SidebarComponent } from "../../components/sidebar/sidebar.component";
import { UiStateService } from "../../services/ui-state.service";
import { SummaryCardsComponent } from "../../components/summary-cards/summary-cards.component";
import { TopbarComponent } from "../../components/topbar/topbar.component";
import { IncomeExpenseChartComponent } from "../../components/income-expense-chart/income-expense-chart.component";
import { ExpenseDonutChartComponent } from "../../components/expense-donut-chart/expense-donut-chart.component";
import { TransactionsTableComponent } from "../../components/transactions-table/transactions-table.component";

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
  ],
  templateUrl: "./dashboard.component.html",
})
export class DashboardComponent {
  sidebarOpen = false;

  openSidebar() {
    this.sidebarOpen = true;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }
  ui = inject(UiStateService);
}
