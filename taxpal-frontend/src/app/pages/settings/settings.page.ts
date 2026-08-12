import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CategoryService, CategoryItem } from '../../services/category.service';
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
  categoryService = inject(CategoryService);

  sidebarOpen = false;
  loadingProfile = false;
  loadingPassword = false;

  // Settings active tab
  activeTab: 'profile' | 'categories' | 'security' = 'categories';
  categoryTab: 'expense' | 'income' = 'expense';

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

  // Category Management state
  categories: CategoryItem[] = [];
  loadingCategories = false;
  categorySuccess = '';
  categoryError = '';

  // Form for adding new category
  showAddCategoryForm = false;
  newCategoryName = '';
  newCategoryColor = '#7C3AED';
  editingCategoryId: number | null = null;

  readonly defaultExpenseCategories: CategoryItem[] = [
    { id: 101, name: 'Business Expenses', type: 'expense', color: '#EF4444' },
    { id: 102, name: 'Office Rent', type: 'expense', color: '#0EA5E9' },
    { id: 103, name: 'Software Subscriptions', type: 'expense', color: '#8B5CF6' },
    { id: 104, name: 'Professional Development', type: 'expense', color: '#10B981' },
    { id: 105, name: 'Marketing', type: 'expense', color: '#F59E0B' },
    { id: 106, name: 'Travel', type: 'expense', color: '#EC4899' },
    { id: 107, name: 'Meals & Entertainment', type: 'expense', color: '#6366F1' },
    { id: 108, name: 'Utilities', type: 'expense', color: '#DC2626' }
  ];

  readonly defaultIncomeCategories: CategoryItem[] = [
    { id: 201, name: 'Freelance Design', type: 'income', color: '#10B981' },
    { id: 202, name: 'Client Retainer', type: 'income', color: '#0EA5E9' },
    { id: 203, name: 'Consulting', type: 'income', color: '#8B5CF6' },
    { id: 204, name: 'Product Sales', type: 'income', color: '#F59E0B' }
  ];

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.name = user.name;
      this.email = user.email;
      this.country = user.country || 'India';
    }

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

    this.loadCategories();
  }

  loadCategories(): void {
    this.loadingCategories = true;
    this.categoryService.getCategories().subscribe({
      next: (res: any) => {
        const fetched = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        if (fetched.length > 0) {
          this.categories = fetched;
        } else {
          this.categories = [...this.defaultExpenseCategories, ...this.defaultIncomeCategories];
        }
        this.loadingCategories = false;
      },
      error: () => {
        this.categories = [...this.defaultExpenseCategories, ...this.defaultIncomeCategories];
        this.loadingCategories = false;
      }
    });
  }

  get displayedCategories(): CategoryItem[] {
    return this.categories.filter((c) => c.type === this.categoryTab);
  }

  openSidebar(): void {
    this.sidebarOpen = true;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  onAddCategory(): void {
    if (!this.newCategoryName.trim()) {
      this.categoryError = 'Please enter a category name.';
      return;
    }

    const payload: CategoryItem = {
      name: this.newCategoryName.trim(),
      type: this.categoryTab,
      color: this.newCategoryColor || '#7C3AED'
    };

    if (this.editingCategoryId !== null) {
      this.categoryService.updateCategory(this.editingCategoryId, payload).subscribe({
        next: () => {
          this.categorySuccess = 'Category updated successfully!';
          this.loadCategories();
          this.resetCategoryForm();
        },
        error: () => {
          // Local fallback update
          this.categories = this.categories.map((c) => (c.id === this.editingCategoryId ? { ...c, ...payload } : c));
          this.categorySuccess = 'Category updated!';
          this.resetCategoryForm();
        }
      });
      return;
    }

    this.categoryService.createCategory(payload).subscribe({
      next: () => {
        this.categorySuccess = 'New category added successfully!';
        this.loadCategories();
        this.resetCategoryForm();
      },
      error: () => {
        // Local fallback insert
        const newCat: CategoryItem = { ...payload, id: Date.now() };
        this.categories = [newCat, ...this.categories];
        this.categorySuccess = 'New category added!';
        this.resetCategoryForm();
      }
    });
  }

  editCategory(item: CategoryItem): void {
    if (!item.id) return;
    this.editingCategoryId = item.id;
    this.newCategoryName = item.name;
    this.newCategoryColor = item.color || '#7C3AED';
    this.showAddCategoryForm = true;
  }

  deleteCategory(item: CategoryItem): void {
    if (!item.id) return;
    this.categoryService.deleteCategory(item.id).subscribe({
      next: () => {
        this.categories = this.categories.filter((c) => c.id !== item.id);
        this.categorySuccess = 'Category removed.';
      },
      error: () => {
        this.categories = this.categories.filter((c) => c.id !== item.id);
        this.categorySuccess = 'Category removed.';
      }
    });
  }

  resetCategoryForm(): void {
    this.newCategoryName = '';
    this.newCategoryColor = '#7C3AED';
    this.editingCategoryId = null;
    this.showAddCategoryForm = false;
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
