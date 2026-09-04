import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent {
  public authService = inject(AuthService);
  public notificationService = inject(NotificationService);

  @Input() title: string = 'Dashboard';
  @Input() subtitle: string = '';
  @Input() userName?: string;
  @Output() menuClick = new EventEmitter<void>();

  showNotificationsDropdown = false;

  get displayUserName(): string {
    return this.userName || this.authService.currentUser()?.name || 'User';
  }

  get userInitial(): string {
    const name = this.displayUserName;
    return name ? name.charAt(0).toUpperCase() : 'U';
  }

  onMenuClick(): void {
    this.menuClick.emit();
  }

  toggleNotifications(): void {
    this.showNotificationsDropdown = !this.showNotificationsDropdown;
    if (this.showNotificationsDropdown) {
      this.notificationService.markAllAsRead();
    }
  }

  closeNotifications(): void {
    this.showNotificationsDropdown = false;
  }

  dismissToast(id: string): void {
    this.notificationService.removeToast(id);
  }

  formatTimeAgo(date: Date): string {
    const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }
}
