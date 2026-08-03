import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";

interface NavItem {
  label: string;
  icon: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: "grid", href: "/dashboard" },
  { label: "Income", icon: "trending-up", href: "/income" },
  { label: "Expenses", icon: "trending-down", href: "/expense" },
  { label: "Budget", icon: "wallet", href: "" },
  { label: "Tax Estimator", icon: "calculator", href: "" },
  { label: "Reports", icon: "bar-chart", href: "" },
  { label: "Settings", icon: "settings", href: "" },
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

  readonly navItems = NAV_ITEMS;

  onClose(): void {
    this.closeSidebar.emit();
  }
}
