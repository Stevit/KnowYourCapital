export enum EventType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  LOAN = 'LOAN', // Prestito standard (prelievo rata dal saldo)
  LEVERAGE_LOAN = 'LEVERAGE_LOAN' // Prestito per investimento (rata scala dal PAC)
}

export interface FinancialEvent {
  id: string;
  year: number;
  type: EventType;
  amount: number;
  description?: string;
  isRecurring?: boolean;
  recurringEndYear?: number;
  // Specific for LOAN
  loanInterestRate?: number;
  loanDurationYears?: number;
}

export interface SimulationParams {
  startYear: number; // Calendar year (e.g., 2024)
  initialCapital: number;
  monthlyContribution: number; // New: Monthly deposit (PAC)
  adjustContributionForInflation: boolean; // New: Increases contribution based on inflation
  annualReturnRate: number; // Percentage
  isTaxEnabled: boolean; // New: Toggle taxation on/off
  taxRate: number; // Percentage (Capital Gains Tax)
  taxAdjustedForInflation: boolean; // New: Tax only real gains (Nominal - Inflation)
  durationYears: number;
  inflationRate: number; // Percentage
  targetMonthlyIncome: number; // New: Passive income goal
}

export interface YearlyData {
  year: number;
  label: string; // Display label (e.g. "2025")
  portfolioValue: number;
  totalInvested: number;
  totalWithdrawn: number;
  yearlyProfit: number;
  yearlyTax: number;
  yearlyRealTax: number;
  netGrowth: number;
  inflationAdjustedValue: number;
  totalInflationLoss: number; // New field
}