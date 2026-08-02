import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UiStateService } from '../../services/ui-state.service';

interface NavItem {
  label: string;
  route: string;
  icon: string; // path data rendered inline in the template via [ngSwitch]
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent {
  ui = inject(UiStateService);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'grid' },
    { label: 'Income', route: '/income', icon: 'trending-up' },
    { label: 'Expense', route: '/expense', icon: 'trending-down' },
    { label: 'Budget', route: '/budget', icon: 'wallet' },
    { label: 'Tax Estimator', route: '/tax-estimator', icon: 'calculator' },
    { label: 'Reports', route: '/reports', icon: 'bar-chart' },
    { label: 'Settings', route: '/settings', icon: 'settings' }
  ];
}
