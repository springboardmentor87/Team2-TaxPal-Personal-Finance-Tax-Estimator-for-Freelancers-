import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.page.html'
})
export class RegisterPageComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  name = '';
  email = '';
  country = 'India';
  password = '';
  loading = false;
  errorMessage = '';

  onSubmit(): void {
    if (!this.name || !this.email || !this.password) {
      this.errorMessage = 'Please complete all required fields.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService
      .register({
        name: this.name,
        email: this.email,
        country: this.country,
        password: this.password
      })
      .subscribe({
        next: () => {
          // Auto login after registration
          this.authService
            .login({ email: this.email, password: this.password })
            .subscribe({
              next: () => {
                this.loading = false;
                this.router.navigate(['/dashboard']);
              },
              error: () => {
                this.loading = false;
                this.router.navigate(['/login']);
              }
            });
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
        }
      });
  }
}
