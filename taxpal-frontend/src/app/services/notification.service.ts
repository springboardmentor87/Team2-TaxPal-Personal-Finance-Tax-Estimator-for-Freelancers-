import { Injectable, signal, computed } from '@angular/core';

export interface AppNotification {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  category: 'tax' | 'budget' | 'balance' | 'system';
}

export interface ToastNotification {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  // Session-level flags - tracks which conditions have already fired a toast this session.
  // Only resets when the condition is resolved (e.g. balance goes back positive).
  private readonly _shownToastKeys = new Set<string>();

  // All notifications stored for top-right Notification History bell dropdown
  readonly notifications = signal<AppNotification[]>([
    // {
    //   id: 'init-1',
    //   type: 'warning',
    //   title: 'Budget Deficit Alert',
    //   message: 'Monthly business expenses are approaching 85% of allocated budget.',
    //   timestamp: new Date(Date.now() - 1000 * 60 * 15),
    //   read: false,
    //   category: 'budget',
    // },
    // {
    //   id: 'init-2',
    //   type: 'info',
    //   title: 'Q2 Estimated Tax Due',
    //   message: 'Upcoming Q2 advance tax deadline reminder.',
    //   timestamp: new Date(Date.now() - 1000 * 60 * 120),
    //   read: false,
    //   category: 'tax',
    // },
  ]);

  // Active toasts floating in bottom-right corner
  readonly toasts = signal<ToastNotification[]>([]);

  // Computed unread count for top-right notification bell badge
  readonly unreadCount = computed(() => {
    return this.notifications().filter((n) => !n.read).length;
  });

  /**
   * Adds a notification to the top-right notification history dropdown.
   * Uses a session-level key so the bottom-right toast only fires ONCE
   * until the condition is explicitly resolved / reset.
   */
  addNotification(
    data: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & {
      showToast?: boolean;
      /** A stable, descriptive key to detect whether this condition was already toasted this session */
      toastKey?: string;
    }
  ): void {
    const currentItems = this.notifications();

    // Deduplication: same message or same title+category combo → update timestamp only
    const existing = currentItems.find(
      (n) =>
        n.message === data.message ||
        (n.title === data.title && n.category === data.category)
    );

    if (existing) {
      this.notifications.update((items) =>
        items.map((n) =>
          n.id === existing.id ? { ...n, timestamp: new Date(), read: false } : n
        )
      );

      // Only show toast if we haven't shown it this session for this key
      const key = data.toastKey ?? existing.id;
      if (
        data.showToast !== false &&
        (data.type === 'error' || data.type === 'warning') &&
        !this._shownToastKeys.has(key)
      ) {
        this._shownToastKeys.add(key);
        this.showToast({
          id: 'toast-' + existing.id,
          type: data.type,
          title: data.title,
          message: data.message,
        });
      }
      return;
    }

    const id = 'notif-' + Math.random().toString(36).substring(2, 9);
    const newNotif: AppNotification = {
      ...data,
      id,
      timestamp: new Date(),
      read: false,
    };
    this.notifications.update((items) => [newNotif, ...items]);

    const key = data.toastKey ?? id;
    if (
      data.showToast !== false &&
      (data.type === 'error' || data.type === 'warning') &&
      !this._shownToastKeys.has(key)
    ) {
      this._shownToastKeys.add(key);
      this.showToast({
        id: 'toast-' + id,
        type: data.type,
        title: data.title,
        message: data.message,
      });
    }
  }

  /**
   * Specialized trigger for Out-Of-Balance / Deficit state.
   * The toast only fires ONCE per session. Call resolveOutOfBalance() to re-arm it.
   */
  notifyOutOfBalance(
    deficitAmount: number,
    contextLabel: string = 'Account Balance',
    currencySymbol: string = '₹'
  ): void {
    const title = '⚠️ Out of Balance Deficient Warning';
    const message = `Your ${contextLabel} is out of balance! Deductions/expenses exceed income by ${currencySymbol}${deficitAmount.toFixed(
      2
    )}. Total net balance is negative.`;

    this.addNotification({
      type: 'error',
      title,
      message,
      category: 'balance',
      showToast: true,
      toastKey: `balance-deficit-${contextLabel}`,
    });
  }

  /**
   * Call this when the balance returns to positive to re-arm the out-of-balance toast.
   */
  resolveOutOfBalance(contextLabel: string = 'Account Balance'): void {
    this._shownToastKeys.delete(`balance-deficit-${contextLabel}`);
  }

  /**
   * Specialized trigger for Budget limit warning/exceeded.
   * The toast only fires ONCE per category per session.
   */
  notifyBudgetWarning(
    category: string,
    spent: number,
    limit: number,
    currencySymbol: string = '₹'
  ): void {
    const over = spent - limit;
    const isExceeded = over > 0;
    const title = isExceeded ? '🚨 Budget Exceeded Warning' : '⚠️ Budget Warning (High Usage)';
    const message = isExceeded
      ? `Budget for "${category}" exceeded! You are over your ${currencySymbol}${limit.toFixed(
          2
        )} limit by ${currencySymbol}${over.toFixed(2)}.`
      : `Category "${category}" has reached ${currencySymbol}${spent.toFixed(
          2
        )} of ${currencySymbol}${limit.toFixed(2)} budget limit.`;

    this.addNotification({
      type: isExceeded ? 'error' : 'warning',
      title,
      message,
      category: 'budget',
      showToast: true,
      toastKey: `budget-${category}-${isExceeded ? 'over' : 'warning'}`,
    });
  }

  /**
   * Displays a bottom-right toast pop-up notification.
   */
  showToast(toast: ToastNotification): void {
    const current = this.toasts();
    if (current.some((t) => t.title === toast.title)) return;

    this.toasts.update((items) => [...items, toast]);

    const duration = toast.duration || 7000;
    setTimeout(() => {
      this.removeToast(toast.id);
    }, duration);
  }

  removeToast(id: string): void {
    this.toasts.update((items) => items.filter((t) => t.id !== id));
  }

  markAllAsRead(): void {
    this.notifications.update((items) => items.map((n) => ({ ...n, read: true })));
  }

  clearNotification(id: string): void {
    this.notifications.update((items) => items.filter((n) => n.id !== id));
  }

  clearAll(): void {
    this.notifications.set([]);
  }
}
