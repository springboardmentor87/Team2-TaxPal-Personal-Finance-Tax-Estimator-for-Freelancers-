import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './topbar.component.html',
})
export class TopbarComponent {
  public authService = inject(AuthService);

  @Input() title: string = 'Dashboard';
  @Input() subtitle: string = '';
  @Input() userName?: string;
  @Output() menuClick = new EventEmitter<void>();

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
}
