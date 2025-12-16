import { FinancialEvent, SimulationParams, YearlyData, EventType } from '../types';

interface ActiveLoan {
  endYear: number;
  annualPayment: number;
}

export const calculateProjection = (
  params: SimulationParams,
  events: FinancialEvent[]
): YearlyData[] => {
  const data: YearlyData[] = [];
  
  let currentCapital = params.initialCapital;
  let totalInvested = params.initialCapital;
  let totalWithdrawn = 0;
  
  // Track active loans to deduct payments in future years
  // Standard loans withdraw from portfolio balance
  const activeStandardLoans: ActiveLoan[] = [];
  // Leverage loans reduce the monthly contribution (PAC) input
  const activeLeverageLoans: ActiveLoan[] = [];

  // Initial state (Year 0 / Start Year)
  data.push({
    year: 0,
    label: params.startYear.toString(),
    portfolioValue: currentCapital,
    totalInvested: totalInvested,
    totalWithdrawn: 0,
    yearlyProfit: 0,
    yearlyTax: 0,
    yearlyRealTax: 0,
    netGrowth: 0,
    inflationAdjustedValue: currentCapital,
    totalInflationLoss: 0
  });

  for (let year = 1; year <= params.durationYears; year++) {
    const currentCalendarYear = params.startYear + year;

    // 1. Calculate Inflation Factor for this specific year
    const inflationFactor = Math.pow(1 + params.inflationRate / 100, year);

    // 2. Calculate Growth based on previous year's capital
    const grossProfit = currentCapital * (params.annualReturnRate / 100);
    
    // 3. Calculate Tax
    let taxableAmount = grossProfit;
    
    if (params.isTaxEnabled && params.taxAdjustedForInflation) {
        // Calculate the portion of capital "growth" that is merely keeping up with inflation
        const inflationCost = currentCapital * (params.inflationRate / 100);
        taxableAmount = Math.max(0, grossProfit - inflationCost);
    }

    const taxAmount = (params.isTaxEnabled && taxableAmount > 0) 
      ? taxableAmount * (params.taxRate / 100) 
      : 0;
      
    // Calculate Real Tax (Purchasing Power)
    const realTaxAmount = taxAmount / inflationFactor;

    const netProfit = grossProfit - taxAmount;

    // 4. Update capital with growth
    currentCapital += netProfit;

    // 5. Handle Active Leverage Loans (Deduct from PAC)
    let totalLeveragePayments = 0;
    for (const loan of activeLeverageLoans) {
      if (year <= loan.endYear) {
        totalLeveragePayments += loan.annualPayment;
      }
    }

    // 6. Monthly Contributions Logic
    let grossAnnualContribution = params.monthlyContribution * 12;
    if (params.adjustContributionForInflation) {
        grossAnnualContribution = grossAnnualContribution * inflationFactor;
    }

    // "Total Invested" tracks the user's out-of-pocket cash.
    totalInvested += grossAnnualContribution;

    // Calculate what actually hits the portfolio
    // This satisfies the request: "rata sia sottratta dal numero di soldi investiti al mese" (for leverage loans)
    let netToPortfolio = grossAnnualContribution - totalLeveragePayments;

    if (netToPortfolio >= 0) {
        // If PAC covers the debt, the remainder is invested
        currentCapital += netToPortfolio;
    } else {
        // If Debt > PAC, the difference is forced withdrawal from portfolio
        currentCapital += netToPortfolio; // Adds negative number (decrease)
        totalWithdrawn += Math.abs(netToPortfolio);
    }

    // 7. Handle Standard Active Loan Repayments (Direct Outflows from Portfolio)
    let totalStandardLoanPayments = 0;
    for (const loan of activeStandardLoans) {
      if (year <= loan.endYear) {
        totalStandardLoanPayments += loan.annualPayment;
      }
    }
    currentCapital -= totalStandardLoanPayments;
    totalWithdrawn += totalStandardLoanPayments;

    // 8. Handle Events for this specific year
    const activeEvents = events.filter(e => {
      // One-off events based on year
      if (e.type === EventType.LOAN || e.type === EventType.LEVERAGE_LOAN) {
         return e.year === year; 
      }
      if (e.isRecurring) {
        return year >= e.year && year <= (e.recurringEndYear || params.durationYears);
      }
      return e.year === year;
    });
    
    activeEvents.forEach(event => {
      if (event.type === EventType.DEPOSIT) {
        currentCapital += event.amount;
        totalInvested += event.amount;
      } else if (event.type === EventType.WITHDRAWAL) {
        currentCapital -= event.amount;
        totalWithdrawn += event.amount;
        // Modified: Withdrawals now reduce Total Invested (Net Invested logic)
        totalInvested -= event.amount;
      } else if (event.type === EventType.LOAN || event.type === EventType.LEVERAGE_LOAN) {
        
        // Calculate Amortization
        const rate = (event.loanInterestRate || 0) / 100;
        const n = event.loanDurationYears || 5;
        
        let annualPmt = 0;
        if (rate === 0) {
            annualPmt = event.amount / n;
        } else {
            annualPmt = event.amount * (rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
        }

        const loanObj = {
            endYear: year + n - 1, 
            annualPayment: annualPmt
        };

        if (event.type === EventType.LOAN) {
            // STANDARD LOAN (Personal Loan injected as cash)
            // It is treated as cash-out to the user, paid back by the portfolio.
            
            activeStandardLoans.push(loanObj);
            
            // Pay first installment immediately
            currentCapital -= annualPmt;
            totalWithdrawn += annualPmt;

            // Modified: Include Loan amount in Total Invested
            totalInvested += event.amount;
        } else {
            // LEVERAGE LOAN (Margin/Bank Money)
            // Add to capital because the purpose is to invest it
            currentCapital += event.amount;

            activeLeverageLoans.push(loanObj);
            
            // Pay first installment (deduct from what was added via PAC earlier in this loop)
            currentCapital -= annualPmt;
            
            // Check for negative flow in start year
            if (annualPmt > grossAnnualContribution) {
                totalWithdrawn += (annualPmt - grossAnnualContribution);
            }

            // Modified: Include Leverage amount in Total Invested
            totalInvested += event.amount;
        }
      }
    });

    // Ensure capital doesn't go below zero
    if (currentCapital < 0) currentCapital = 0;

    // 9. Calculate Inflation Adjusted Value (Real Value)
    const inflationAdjustedValue = currentCapital / inflationFactor;
    const totalInflationLoss = currentCapital - inflationAdjustedValue;

    data.push({
      year,
      label: currentCalendarYear.toString(),
      portfolioValue: parseFloat(currentCapital.toFixed(2)),
      totalInvested: parseFloat(totalInvested.toFixed(2)),
      totalWithdrawn: parseFloat(totalWithdrawn.toFixed(2)),
      yearlyProfit: parseFloat(grossProfit.toFixed(2)),
      yearlyTax: parseFloat(taxAmount.toFixed(2)),
      yearlyRealTax: parseFloat(realTaxAmount.toFixed(2)),
      netGrowth: parseFloat(netProfit.toFixed(2)),
      inflationAdjustedValue: parseFloat(inflationAdjustedValue.toFixed(2)),
      totalInflationLoss: parseFloat(totalInflationLoss.toFixed(2))
    });
  }

  return data;
};