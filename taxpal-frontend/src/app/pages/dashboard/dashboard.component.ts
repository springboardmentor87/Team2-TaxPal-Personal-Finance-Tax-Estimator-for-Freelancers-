import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiStateService } from '../../services/ui-state.service';
import { SummaryCardComponent } from '../../components/summary-card/summary-card.component';
import { IncomeExpenseChartComponent } from '../../components/income-expense-chart/income-expense-chart.component';
import { ExpenseDonutChartComponent } from '../../components/expense-donut-chart/expense-donut-chart.component';
import { TransactionsTableComponent } from '../../components/transactions-table/transactions-table.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    SummaryCardComponent,
    IncomeExpenseChartComponent,
    ExpenseDonutChartComponent,
    TransactionsTableComponent
  ],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  ui = inject(UiStateService);
}
