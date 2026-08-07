import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../services/auth.service';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { TopbarComponent } from '../../components/topbar/topbar.component';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent],
  templateUrl: './settings.page.html'
})
export class SettingsPageComponent implements OnInit {
  auth = inject(AuthService);

  sidebarOpen = false;
  loadingProfile = false;
  loadingPassword = false;

  // Profile fields
  name = '';
  email = '';
  country = 'India';
  profileSuccess = '';
  profileError = '';

  // Password fields
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordSuccess = '';
  passwordError = '';

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.name = user.name;
      this.email = user.email;
      this.country = user.country || 'India';
    }

    // Refresh profile details from server
    this.auth.getProfile().subscribe({
      next: (res) => {
        if (res.user) {
          this.name = res.user.name;
          this.email = res.user.email;
          this.country = res.user.country || 'India';
        }
      },
      error: (err) => console.error('Error fetching profile from server:', err)
    });
  }

  openSidebar(): void {
    this.sidebarOpen = true;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  onSaveProfile(): void {
    if (!this.name.trim() || !this.email.trim() || !this.country) {
      this.profileError = 'All profile fields are required.';
      this.profileSuccess = '';
      return;
    }

    this.loadingProfile = true;
    this.profileError = '';
    this.profileSuccess = '';

    this.auth.updateProfile({
      name: this.name,
      email: this.email,
      country: this.country
    }).subscribe({
      next: (res) => {
        this.loadingProfile = false;
        this.profileSuccess = res.message || 'Profile updated successfully!';
      },
      error: (err) => {
        this.loadingProfile = false;
        this.profileError = err.error?.message || 'Failed to update profile. Please try again.';
      }
    });
  }

  onChangePassword(): void {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.passwordError = 'All password fields are required.';
      this.passwordSuccess = '';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'New password and confirm password do not match.';
      this.passwordSuccess = '';
      return;
    }

    if (this.newPassword.length < 6) {
      this.passwordError = 'New password must be at least 6 characters long.';
      this.passwordSuccess = '';
      return;
    }

    this.loadingPassword = true;
    this.passwordError = '';
    this.passwordSuccess = '';

    this.auth.updatePassword({
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: (res) => {
        this.loadingPassword = false;
        this.passwordSuccess = res.message || 'Password changed successfully!';
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (err) => {
        this.loadingPassword = false;
        this.passwordError = err.error?.message || 'Incorrect current password or update failed.';
      }
    });
  }
}
