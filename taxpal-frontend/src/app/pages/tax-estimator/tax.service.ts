import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { delay } from "rxjs/operators";
export interface TaxEstimatorFormData {
  country: string;
  state: string;
  filingStatus: string;
  year: number;
  quarter: string;

  grossIncome: number;
  businessExpenses: number;
  retirementContributions: number;
  healthInsurancePremiums: number;
  homeOfficeDeduction: number;
}

export interface TaxEstimateResult {
  grossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  estimatedTax: number;
  effectiveTaxRate: number;
}

@Injectable({
  providedIn: "root",
})
export class TaxService {
  private readonly apiUrl = "http://localhost:5000/api/tax";

  // Keep false until the backend API contract is confirmed.
  private readonly useLiveApi = false;

  constructor(private http: HttpClient) {}

  calculateTax(formData: TaxEstimatorFormData): Observable<TaxEstimateResult> {
    if (this.useLiveApi) {
      const requestBody = this.buildRequestBody(formData);

      return this.http.post<TaxEstimateResult>(this.apiUrl, requestBody);
    }

    // Temporary mock calculation for frontend demonstration.
    const totalDeductions =
      formData.businessExpenses +
      formData.retirementContributions +
      formData.healthInsurancePremiums +
      formData.homeOfficeDeduction;

    const taxableIncome = Math.max(formData.grossIncome - totalDeductions, 0);

    // Simple mock rate for UI demonstration.
    // This is NOT a real tax calculation.
    const mockRate = 0.22;

    const estimatedTax = taxableIncome * mockRate;

    const effectiveTaxRate =
      formData.grossIncome > 0
        ? (estimatedTax / formData.grossIncome) * 100
        : 0;

    const mockResult: TaxEstimateResult = {
      grossIncome: formData.grossIncome,
      totalDeductions,
      taxableIncome,
      estimatedTax,
      effectiveTaxRate,
    };

    return of(mockResult).pipe(delay(700));
  }

  private buildRequestBody(formData: TaxEstimatorFormData): any {
    return {
      country: formData.country,
      state: formData.state,
      filingStatus: formData.filingStatus,
      quarter: formData.quarter,

      income: {
        grossIncome: formData.grossIncome,
      },

      deductions: {
        businessExpenses: formData.businessExpenses,
        retirementContributions: formData.retirementContributions,
        healthInsurancePremiums: formData.healthInsurancePremiums,
        homeOfficeDeduction: formData.homeOfficeDeduction,
      },
    };
  }
}
