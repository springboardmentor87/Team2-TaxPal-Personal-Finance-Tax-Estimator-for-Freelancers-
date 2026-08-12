import { Injectable, inject } from '@angular/core';

import { AuthService } from './auth.service';

interface CurrencyConfig {
  code: string;
  symbol: string;
  locale: string;
}

const CURRENCY_BY_COUNTRY: Record<string, CurrencyConfig> = {
  India: { code: 'INR', symbol: '₹', locale: 'en-IN' },
  USA: { code: 'USD', symbol: '$', locale: 'en-US' },
  UK: { code: 'GBP', symbol: '£', locale: 'en-GB' },
  Canada: { code: 'CAD', symbol: 'C$', locale: 'en-CA' },
};

const DEFAULT_CURRENCY: CurrencyConfig = CURRENCY_BY_COUNTRY['India'];

@Injectable({
  providedIn: 'root',
})
export class CurrencyService {
  private readonly auth = inject(AuthService);

  current(): CurrencyConfig {
    const country = this.auth.currentUser()?.country || 'India';
    return CURRENCY_BY_COUNTRY[country] || DEFAULT_CURRENCY;
  }

  currencyCode(): string {
    return this.current().code;
  }

  currencySymbol(): string {
    return this.current().symbol;
  }

  locale(): string {
    return this.current().locale;
  }

  format(value: number | null | undefined, minimumFractionDigits = 2, maximumFractionDigits = 2): string {
    const amount = Number(value ?? 0);
    const sign = amount < 0 ? '-' : '';
    const formatted = new Intl.NumberFormat(this.locale(), {
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(Math.abs(amount));

    return `${sign}${this.currencySymbol()}${formatted}`;
  }
}