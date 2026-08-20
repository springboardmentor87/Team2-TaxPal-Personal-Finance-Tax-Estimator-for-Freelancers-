import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

import { AuthService } from '../../services/auth.service';
import { TaxCalendarService, TaxEvent } from '../../services/tax-calendar.service';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { TopbarComponent } from '../../components/topbar/topbar.component';

@Component({
  selector: 'app-tax-calendar-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, SidebarComponent, TopbarComponent],
  templateUrl: './tax-calendar.page.html'
})
export class TaxCalendarPageComponent implements OnInit {
  auth = inject(AuthService);
  calendarService = inject(TaxCalendarService);

  sidebarOpen = false;
  loading = false;
  events: TaxEvent[] = [];
  error = '';
  success = '';

  // Filters & State
  selectedYear = new Date().getFullYear();
  filterStatus: 'all' | 'upcoming' | 'completed' = 'all';
  viewMode: 'list' | 'timeline' = 'timeline';

  // Add Event Form Modal
  showAddModal = false;
  newTitle = '';
  newDescription = '';
  newDueDate = '';
  submitting = false;
  formError = '';

  // Stats
  upcomingCount = 0;
  completedCount = 0;
  totalCount = 0;

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.loading = true;
    this.error = '';
    
    // Fetch profile country
    const user = this.auth.currentUser();
    const country = user ? user.country : undefined;

    this.calendarService.getEvents(this.selectedYear, country).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.events = res.data;
          this.calculateStats();
        } else {
          this.error = res.message || 'Failed to fetch tax events.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Error connecting to the server.';
        console.error('Error fetching calendar events:', err);
      }
    });
  }

  calculateStats(): void {
    this.totalCount = this.events.length;
    this.completedCount = this.events.filter(e => e.completed).length;
    this.upcomingCount = this.totalCount - this.completedCount;
  }

  get filteredEvents(): TaxEvent[] {
    return this.events.filter(event => {
      if (this.filterStatus === 'completed') return event.completed;
      if (this.filterStatus === 'upcoming') return !event.completed;
      return true;
    });
  }

  // Month grouping for Timeline view
  getMonthName(dateStr: string): string {
    if (!dateStr) return 'Unknown';
    // Append time to avoid timezone offset shifts
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleString('en-US', { month: 'long' });
  }

  get groupedEvents() {
    const groups: { [key: string]: TaxEvent[] } = {};
    const filtered = this.filteredEvents;
    for (const event of filtered) {
      const month = this.getMonthName(event.dueDate);
      if (!groups[month]) {
        groups[month] = [];
      }
      groups[month].push(event);
    }
    return groups;
  }

  get months(): string[] {
    const orderedMonths = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const activeMonths = Object.keys(this.groupedEvents);
    return orderedMonths.filter(m => activeMonths.includes(m));
  }

  toggleComplete(event: TaxEvent): void {
    const originalState = event.completed;
    event.completed = !event.completed;
    this.calculateStats();

    this.calendarService.updateEvent(event.id, { completed: event.completed }).subscribe({
      next: (res) => {
        if (!res.success) {
          event.completed = originalState;
          this.calculateStats();
          this.error = 'Failed to update event state.';
        }
      },
      error: (err) => {
        event.completed = originalState;
        this.calculateStats();
        this.error = 'Server error updating event status.';
        console.error(err);
      }
    });
  }

  openSidebar(): void {
    this.sidebarOpen = true;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  openAddModal(): void {
    this.showAddModal = true;
    this.formError = '';
    this.newTitle = '';
    this.newDescription = '';
    // Pre-populate due date with current date in YYYY-MM-DD
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    this.newDueDate = `${yyyy}-${mm}-${dd}`;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onAddEventSubmit(): void {
    if (!this.newTitle.trim()) {
      this.formError = 'Event title is required.';
      return;
    }
    if (!this.newDueDate) {
      this.formError = 'Due date is required.';
      return;
    }

    this.submitting = true;
    this.formError = '';

    const newEventData = {
      title: this.newTitle.trim(),
      description: this.newDescription.trim() || undefined,
      dueDate: this.newDueDate
    };

    this.calendarService.createEvent(newEventData).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          this.success = 'Reminder added successfully!';
          this.closeAddModal();
          this.loadEvents();
          setTimeout(() => this.success = '', 3000);
        } else {
          this.formError = res.message || 'Failed to create reminder.';
        }
      },
      error: (err) => {
        this.submitting = false;
        this.formError = err.error?.message || 'Error occurred while saving.';
        console.error(err);
      }
    });
  }

  deleteEvent(id: number, eventObj: MouseEvent): void {
    eventObj.stopPropagation(); // Avoid triggering details toggle or click
    if (!confirm('Are you sure you want to delete this custom reminder?')) {
      return;
    }

    this.calendarService.deleteEvent(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.success = 'Reminder deleted successfully!';
          this.loadEvents();
          setTimeout(() => this.success = '', 3000);
        } else {
          this.error = res.message || 'Failed to delete reminder.';
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Error occurred while deleting.';
        console.error(err);
      }
    });
  }

  changeYear(delta: number): void {
    this.selectedYear += delta;
    this.loadEvents();
  }

  getDaysRemaining(dueDateStr: string): number {
    const due = new Date(dueDateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getBadgeClass(dueDateStr: string, completed: boolean): string {
    if (completed) {
      return 'bg-green-50 text-green-700 border border-green-200';
    }
    const days = this.getDaysRemaining(dueDateStr);
    if (days < 0) {
      return 'bg-red-50 text-red-700 border border-red-200'; // Overdue
    }
    if (days <= 7) {
      return 'bg-amber-50 text-amber-700 border border-amber-200'; // Due soon
    }
    return 'bg-purple-50 text-purple-700 border border-purple-200'; // Upcoming
  }

  getBadgeText(dueDateStr: string, completed: boolean): string {
    if (completed) return 'Completed';
    const days = this.getDaysRemaining(dueDateStr);
    if (days < 0) return `Overdue by ${Math.abs(days)}d`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `In ${days} days`;
  }
}
