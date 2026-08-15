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
import { AuthService } from "../../services/auth.service";

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
  // ============================================================
  // SIDEBAR
  // ============================================================

  sidebarOpen = false;

  openSidebar(): void {
    this.sidebarOpen = true;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  // ============================================================
  // SERVICES
  // ============================================================

  constructor(
    private fb: FormBuilder,
    private taxService: TaxService,
    public authService: AuthService,
  ) {
    this.taxForm = this.fb.group({
      country: ["India", Validators.required],

      state: ["Andhra Pradesh", Validators.required],

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

  // ============================================================
  // COUNTRY OPTIONS
  // ============================================================

  countryOptions: string[] = [
    "India",
    "United States",
    "Canada",
    "United Kingdom",
  ];

  // ============================================================
  // CURRENCY SYMBOL
  // ============================================================

  currencySymbol = "₹";

  private currencySymbols: {
    [country: string]: string;
  } = {
    India: "₹",
    "United States": "$",
    Canada: "C$",
    "United Kingdom": "£",
  };

  // ============================================================
  // STATE / PROVINCE / REGION OPTIONS
  // ============================================================

  statesByCountry: {
    [country: string]: string[];
  } = {
    // ==========================================================
    // INDIA
    // 28 STATES + 8 UNION TERRITORIES
    // ==========================================================

    India: [
      "Andhra Pradesh",
      "Arunachal Pradesh",
      "Assam",
      "Bihar",
      "Chhattisgarh",
      "Goa",
      "Gujarat",
      "Haryana",
      "Himachal Pradesh",
      "Jharkhand",
      "Karnataka",
      "Kerala",
      "Madhya Pradesh",
      "Maharashtra",
      "Manipur",
      "Meghalaya",
      "Mizoram",
      "Nagaland",
      "Odisha",
      "Punjab",
      "Rajasthan",
      "Sikkim",
      "Tamil Nadu",
      "Telangana",
      "Tripura",
      "Uttar Pradesh",
      "Uttarakhand",
      "West Bengal",

      "Andaman and Nicobar Islands",
      "Chandigarh",
      "Dadra and Nagar Haveli and Daman and Diu",
      "Delhi",
      "Jammu and Kashmir",
      "Ladakh",
      "Lakshadweep",
      "Puducherry",
    ],

    // ==========================================================
    // UNITED STATES
    // 50 STATES + DISTRICT OF COLUMBIA
    // ==========================================================

    "United States": [
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
    ],

    // ==========================================================
    // CANADA
    // 10 PROVINCES + 3 TERRITORIES
    // ==========================================================

    Canada: [
      "Alberta",
      "British Columbia",
      "Manitoba",
      "New Brunswick",
      "Newfoundland and Labrador",
      "Nova Scotia",
      "Ontario",
      "Prince Edward Island",
      "Quebec",
      "Saskatchewan",
      "Northwest Territories",
      "Nunavut",
      "Yukon",
    ],

    // ==========================================================
    // UNITED KINGDOM
    // ==========================================================

    "United Kingdom": ["England", "Northern Ireland", "Scotland", "Wales"],
  };

  // Currently displayed states/provinces/regions
  stateOptions: string[] = this.statesByCountry["India"];

  // ============================================================
  // FILING STATUS OPTIONS
  // ============================================================

  filingStatusOptions: string[] = [
    "Single",
    "Married Filing Jointly",
    "Married Filing Separately",
    "Head of Household",
    "Qualifying Surviving Spouse",
  ];

  // ============================================================
  // TAX YEARS
  // ============================================================

  yearOptions: number[] = [2026, 2025, 2024, 2023];

  selectedYear = 2026;

  // ============================================================
  // QUARTERS
  // ============================================================

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

  // ============================================================
  // FORM
  // ============================================================

  taxForm: FormGroup;

  // ============================================================
  // RESULT / LOADING
  // ============================================================

  isCalculating = false;

  hasResult = false;

  result: TaxEstimateResult | null = null;

  // ============================================================
  // COUNTRY CHANGE
  // ============================================================

  onCountryChange(): void {
    const selectedCountry = this.taxForm.get("country")?.value;

    // Update state/province/region list
    this.stateOptions = this.statesByCountry[selectedCountry] || [];

    // Select first available state/province/region
    this.taxForm.patchValue({
      state: this.stateOptions[0] || "",
    });

    // Update currency symbol
    this.currencySymbol = this.currencySymbols[selectedCountry] || "$";

    // Reset filing status when country changes
    this.taxForm.patchValue({
      filingStatus: "Single",
    });
  }

  // ============================================================
  // YEAR CHANGE
  // ============================================================

  onYearChange(): void {
    this.selectedYear = Number(this.taxForm.get("year")?.value || 2026);
  }

  // ============================================================
  // CALCULATE TAX
  // ============================================================

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

      year: Number(this.taxForm.get("year")?.value || 2026),

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

    console.log("Tax calculation request:", formData);

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
