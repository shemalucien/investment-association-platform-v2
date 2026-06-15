// Utility functions for financial calculations

export function calculateLoanRepayment(
  principal: number,
  annualInterestRate: number,
  durationMonths: number,
): { monthlyPayment: number; totalRepayment: number } {
  const totalInterest = (principal * annualInterestRate * durationMonths) / (100 * 12)
  const totalRepayment = principal + totalInterest
  const monthlyPayment = totalRepayment / durationMonths

  return {
    monthlyPayment: Math.round(monthlyPayment),
    totalRepayment: Math.round(totalRepayment),
  }
}

export function formatCurrency(amount: number): string {
  const safeAmount = Number.isFinite(Number(amount)) ? Number(amount) : 0

  return new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: "RWF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safeAmount)
}

export function calculateProfitShare(totalProfit: number, memberShares: number, totalShares: number): number {
  if (!Number.isFinite(totalProfit) || !Number.isFinite(memberShares) || !Number.isFinite(totalShares) || totalShares <= 0) {
    return 0
  }

  return Math.round((memberShares / totalShares) * totalProfit)
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}
