import { QuestionType } from "./classifier";
import {
  getSummary,
  getSpendingByCategory,
  getMonthlyTotals,
  getTopMerchants,
  getSubscriptions,
  getSpendingTrend,
  getCategories,
} from "./queries";

export function buildContext(questionType: QuestionType, question: string): string {
  const summary = getSummary();

  if (summary.totalTransactions === 0) {
    return "No transactions have been uploaded yet. Please ask the user to upload a CSV file or import from Plaid.";
  }

  const parts: string[] = [];

  // Always include overview
  parts.push(`=== ACCOUNT OVERVIEW ===
Total Transactions: ${summary.totalTransactions}
Total Spending (debits): $${summary.totalSpending.toFixed(2)}
Total Income (credits): $${summary.totalIncome.toFixed(2)}
Date Range: ${summary.dateRange?.min} to ${summary.dateRange?.max}`);

  switch (questionType) {
    case "spending_by_category": {
      const categories = getSpendingByCategory();
      if (categories.length > 0) {
        parts.push(`\n=== SPENDING BY CATEGORY ===`);
        categories.forEach((c) => {
          parts.push(`${c.category}: $${c.total.toFixed(2)} (${c.count} transactions)`);
        });
      }

      // Try to detect specific category from question
      const allCategories = getCategories();
      const q = question.toLowerCase();
      for (const cat of allCategories) {
        if (q.includes(cat.toLowerCase()) || q.includes(cat.toLowerCase().replace(/_/g, " "))) {
          const trend = getSpendingTrend(cat, 6);
          if (trend.length > 0) {
            parts.push(`\n=== ${cat} MONTHLY TREND ===`);
            trend.forEach((t) => {
              parts.push(`${t.month}: $${t.total.toFixed(2)}`);
            });
          }
        }
      }
      break;
    }

    case "monthly_overview": {
      const monthly = getMonthlyTotals(12);
      if (monthly.length > 0) {
        parts.push(`\n=== MONTHLY TOTALS ===`);
        monthly.forEach((m) => {
          parts.push(
            `${m.month}: Income $${m.income.toFixed(2)} | Expenses $${m.expenses.toFixed(2)} | Net $${m.net.toFixed(2)}`
          );
        });
      }
      break;
    }

    case "merchant_analysis": {
      const merchants = getTopMerchants(15);
      if (merchants.length > 0) {
        parts.push(`\n=== TOP MERCHANTS ===`);
        merchants.forEach((m) => {
          parts.push(
            `${m.name}: ${m.count} visits, $${m.total.toFixed(2)} total, avg $${m.avg.toFixed(2)}`
          );
        });
      }
      break;
    }

    case "subscription_check": {
      const subs = getSubscriptions();
      if (subs.length > 0) {
        parts.push(`\n=== DETECTED SUBSCRIPTIONS/RECURRING ===`);
        subs.forEach((s) => {
          parts.push(
            `${s.name}: $${s.amount} × ${s.frequency} times (${s.first_date} to ${s.last_date})`
          );
        });
      } else {
        parts.push(`\nNo recurring transactions detected.`);
      }
      break;
    }

    case "spending_trend":
    case "comparison": {
      const monthly = getMonthlyTotals(6);
      if (monthly.length > 0) {
        parts.push(`\n=== MONTHLY TOTALS (RECENT) ===`);
        monthly.forEach((m) => {
          parts.push(
            `${m.month}: Income $${m.income.toFixed(2)} | Expenses $${m.expenses.toFixed(2)} | Net $${m.net.toFixed(2)}`
          );
        });
      }

      const categories = getSpendingByCategory();
      if (categories.length > 0) {
        parts.push(`\n=== SPENDING BY CATEGORY ===`);
        categories.forEach((c) => {
          parts.push(`${c.category}: $${c.total.toFixed(2)} (${c.count} txns)`);

          // Include trend for top categories
          if (categories.indexOf(c) < 5) {
            const trend = getSpendingTrend(c.category, 3);
            if (trend.length > 1) {
              parts.push(
                `  Trend: ${trend.map((t) => `${t.month}: $${t.total.toFixed(2)}`).join(" → ")}`
              );
            }
          }
        });
      }
      break;
    }

    case "greeting":
      // Minimal context for greetings
      break;

    case "general":
    default: {
      // Include a bit of everything
      const categories = getSpendingByCategory();
      if (categories.length > 0) {
        parts.push(`\n=== TOP SPENDING CATEGORIES ===`);
        categories.slice(0, 5).forEach((c) => {
          parts.push(`${c.category}: $${c.total.toFixed(2)}`);
        });
      }

      const monthly = getMonthlyTotals(3);
      if (monthly.length > 0) {
        parts.push(`\n=== RECENT MONTHS ===`);
        monthly.forEach((m) => {
          parts.push(
            `${m.month}: Expenses $${m.expenses.toFixed(2)} | Income $${m.income.toFixed(2)}`
          );
        });
      }
      break;
    }
  }

  return parts.join("\n");
}
