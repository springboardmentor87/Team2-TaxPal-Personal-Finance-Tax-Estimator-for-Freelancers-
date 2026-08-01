import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

interface NavItem {
  label: string;
  icon: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Income', icon: 'TrendingUp', href: '/income' },
  { label: 'Expenses', icon: 'Receipt', href: '/expense' },
  { label: 'Reports', icon: 'BarChart3', href: '/reports' },
  { label: 'Settings', icon: 'Settings', href: '/settings' },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  @Input() open = false;
  @Output() closeSidebar = new EventEmitter<void>();

  readonly navItems = NAV_ITEMS;

  onClose(): void {
    this.closeSidebar.emit();
  }
}
