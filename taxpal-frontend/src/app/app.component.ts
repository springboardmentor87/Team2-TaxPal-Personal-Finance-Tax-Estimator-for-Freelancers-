import { Component, inject } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { CommonModule } from "@angular/common";

import { ReportsComponent } from "./pages/reports/reports.component";
import { UiStateService } from "./services/ui-state.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterOutlet, ReportsComponent],
  template: `
    <router-outlet></router-outlet>

    <!-- Reports can open from ANY page -->
    <div
      *ngIf="ui.showReports()"
      class="fixed inset-0 z-[100] bg-white overflow-auto"
    >
      <app-reports></app-reports>
    </div>
  `,
})
export class AppComponent {
  ui = inject(UiStateService);
}
