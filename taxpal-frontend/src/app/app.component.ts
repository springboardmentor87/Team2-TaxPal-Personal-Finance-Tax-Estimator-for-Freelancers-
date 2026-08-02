import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="min-h-screen bg-[#FAF8FF] lg:flex">
      <app-sidebar></app-sidebar>

      <div class="flex-1 lg:pl-[264px] min-w-0">
        <router-outlet></router-outlet>
      </div>
    </div>
  `
})
export class AppComponent {}
