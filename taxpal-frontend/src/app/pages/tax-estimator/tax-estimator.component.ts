import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";

import {
  TaxService,
  TaxEstimateResult,
  TaxEstimatorFormData,
} from "./tax.service";

import { SidebarComponent } from "../../components/sidebar/sidebar.component";
import { TopbarComponent } from "../../components/topbar/topbar.component";

@Component({
  selector: "app-tax-estimator",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SidebarComponent,
    TopbarComponent,
  ],
  templateUrl: "./tax-estimator.component.html",
  styleUrls: ["./tax-estimator.component.css"],
})
export class TaxEstimatorComponent {
  // ------------------------------------------------------------
  // Sidebar
  // ------------------------------------------------------------

  sidebarOpen = false;

  openSidebar(): void {
    this.sidebarOpen = true;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  // ------------------------------------------------------------
  // Country / State options
  // ------------------------------------------------------------

  countryOptions = ["United States"];

  stateOptions: string[] = [
    "Alabama",
    "Alaska",
    "Arizona",
    "Arkansas",
    "California",
    "Colorado",
    "Connecticut",
    "Delaware",
    "Florida",
    "Georgia",
    "Hawaii",
    "Idaho",
    "Illinois",
    "Indiana",
    "Iowa",
    "Kansas",
    "Kentucky",
    "Louisiana",
    "Maine",
    "Maryland",
    "Massachusetts",
    "Michigan",
    "Minnesota",
    "Mississippi",
    "Missouri",
    "Montana",
    "Nebraska",
    "Nevada",
    "New Hampshire",
    "New Jersey",
    "New Mexico",
    "New York",
    "North Carolina",
    "North Dakota",
    "Ohio",
    "Oklahoma",
    "Oregon",
    "Pennsylvania",
    "Rhode Island",
    "South Carolina",
    "South Dakota",
    "Tennessee",
    "Texas",
    "Utah",
    "Vermont",
    "Virginia",
    "Washington",
    "West Virginia",
    "Wisconsin",
    "Wyoming",
    "District of Columbia",
  ];

  // ------------------------------------------------------------
  // Filing status
  // ------------------------------------------------------------

  filingStatusOptions = [
    "Single",
    "Married Filing Jointly",
    "Married Filing Separately",
    "Head of Household",
    "Qualifying Surviving Spouse",
  ];

  // ------------------------------------------------------------
  // Tax Year
  // ------------------------------------------------------------

  yearOptions = [2025, 2026];

  // ------------------------------------------------------------
  // Quarter options
  // ------------------------------------------------------------

  quarterOptions = [
    {
      value: "Q1",
      label: "Q1 (Jan-Mar)",
    },
    {
      value: "Q2",
      label: "Q2 (Apr-Jun)",
    },
    {
      value: "Q3",
      label: "Q3 (Jul-Sep)",
    },
    {
      value: "Q4",
      label: "Q4 (Oct-Dec)",
    },
  ];

  // ------------------------------------------------------------
  // Form and result state
  // ------------------------------------------------------------

  taxForm: FormGroup;

  isCalculating = false;
  hasResult = false;

  result: TaxEstimateResult | null = null;

  // ------------------------------------------------------------
  // Constructor
  // ------------------------------------------------------------

  constructor(
    private fb: FormBuilder,
    private taxService: TaxService,
  ) {
    this.taxForm = this.fb.group({
      country: ["United States", Validators.required],

      state: ["California", Validators.required],

      filingStatus: ["Single", Validators.required],

      year: [2026, Validators.required],

      quarter: ["Q2", Validators.required],

      grossIncome: [0, [Validators.required, Validators.min(0)]],

      businessExpenses: [0, [Validators.min(0)]],

      retirementContributions: [0, [Validators.min(0)]],

      healthInsurancePremiums: [0, [Validators.min(0)]],

      homeOfficeDeduction: [0, [Validators.min(0)]],
    });
  }

  // ------------------------------------------------------------
  // Selected year
  // ------------------------------------------------------------

  get selectedYear(): number {
    return Number(this.taxForm.get("year")?.value || 2026);
  }

  // ------------------------------------------------------------
  // Calculate Tax
  // ------------------------------------------------------------

  calculateTax(): void {
    if (this.taxForm.invalid) {
      this.taxForm.markAllAsTouched();
      return;
    }

    this.isCalculating = true;
    this.hasResult = false;
    this.result = null;

    const formData: TaxEstimatorFormData = {
      country: this.taxForm.get("country")?.value,

      state: this.taxForm.get("state")?.value,

      filingStatus: this.taxForm.get("filingStatus")?.value,

      year: Number(this.taxForm.get("year")?.value),

      quarter: this.taxForm.get("quarter")?.value,

      grossIncome: Number(this.taxForm.get("grossIncome")?.value || 0),

      businessExpenses: Number(
        this.taxForm.get("businessExpenses")?.value || 0,
      ),

      retirementContributions: Number(
        this.taxForm.get("retirementContributions")?.value || 0,
      ),

      healthInsurancePremiums: Number(
        this.taxForm.get("healthInsurancePremiums")?.value || 0,
      ),

      homeOfficeDeduction: Number(
        this.taxForm.get("homeOfficeDeduction")?.value || 0,
      ),
    };

    this.taxService.calculateTax(formData).subscribe({
      next: (result: TaxEstimateResult) => {
        this.result = result;
        this.hasResult = true;
        this.isCalculating = false;
      },

      error: (err: unknown) => {
        console.error("Tax calculation failed:", err);
        this.isCalculating = false;
        this.hasResult = false;
      },
    });
  }
}
