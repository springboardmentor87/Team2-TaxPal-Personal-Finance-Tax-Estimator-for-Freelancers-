import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

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
  monthlySetAside?: number;
}

@Injectable({
  providedIn: "root",
})
export class TaxService {
  private readonly apiUrl = "http://localhost:5000/api/tax";

  constructor(private http: HttpClient) {}

  calculateTax(formData: TaxEstimatorFormData): Observable<TaxEstimateResult> {
    const payload = {
      country: formData.country,
      state: formData.state,
      filingStatus: formData.filingStatus,
      year: formData.year,
      quarter: formData.quarter,
      grossIncome: formData.grossIncome,
      businessExpenses: formData.businessExpenses,
      retirementContributions: formData.retirementContributions,
      healthInsurancePremiums: formData.healthInsurancePremiums,
      homeOfficeDeduction: formData.homeOfficeDeduction,
    };

    return this.http.post<any>(`${this.apiUrl}/calculate`, payload).pipe(
      map((res) => {
        const data = res.data || res;
        const deductions = data.deductions || {};
        const taxSummary = data.taxSummary || {};

        return {
          grossIncome: data.grossIncome ?? formData.grossIncome,
          totalDeductions: deductions.totalDeductions ?? 0,
          taxableIncome: taxSummary.taxableIncome ?? 0,
          estimatedTax: taxSummary.estimatedQuarterlyTax ?? 0,
          effectiveTaxRate: taxSummary.effectiveTaxRate ?? 0,
          monthlySetAside: taxSummary.monthlySetAside ?? 0,
        };
      })
    );
  }
}
