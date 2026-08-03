import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";

import { AuthService } from "../../services/auth.service";

interface NavItem {
  label: string;
  icon: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: "grid", href: "/dashboard" },
  { label: "Income", icon: "trending-up", href: "/income" },
  { label: "Expenses", icon: "trending-down", href: "/expense" },
];
@Component({
  selector: "app-sidebar",
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: "./sidebar.component.html",
})
export class SidebarComponent {
  @Input() open = false;
  @Output() closeSidebar = new EventEmitter<void>();

  authService = inject(AuthService);
  readonly navItems = NAV_ITEMS;

  get initials(): string {
    const user = this.authService.currentUser();
    if (!user || !user.name) return 'TP';
    const parts = user.name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return user.name.slice(0, 2).toUpperCase();
  }

  onClose(): void {
    this.closeSidebar.emit();
  }

  onLogout(): void {
    this.authService.logout();
  }
}
