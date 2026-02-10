import { QuestionType, extractAccountRef } from "./classifier";
import {
  getSummary,
  getSpendingByCategory,
  getMonthlyTotals,
  getTopMerchants,
  getSubscriptions,
  getSpendingTrend,
  getCategories,
  getAccounts,
  resolveAccount,
  getAccountSummary,
  getAccountSpendingByCategory,
  getAccountMonthlyTotals,
  getSpendingByAccount,
  getAccountTransactions,
} from "./queries";

/**
 * Try to extract a date range from the question (e.g., "this month", "last month", "January").
 */
function extractDateRange(question: string): { startDate?: string; endDate?: string } {
  const q = question.toLowerCase();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  if (/this month/.test(q)) {
    const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const endDate = now.toISOString().split("T")[0];
    return { startDate, endDate };
  }

  if (/last month/.test(q)) {
    const lastMonth = month === 0 ? 11 : month - 1;
    const lastMonthYear = month === 0 ? year - 1 : year;
    const startDate = `${lastMonthYear}-${String(lastMonth + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(lastMonthYear, lastMonth + 1, 0).getDate();
    const endDate = `${lastMonthYear}-${String(lastMonth + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return { startDate, endDate };
  }

  return {};
}

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

  // Always include available accounts
  const accounts = getAccounts();
  if (accounts.length > 0) {
    parts.push(`\n=== LINKED ACCOUNTS ===`);
    accounts.forEach((a) => {
      const label = a.account_name
        ? `${a.account_name}${a.account_mask ? ` (ending in ${a.account_mask})` : ""}`
        : `Account ending in ${a.account_mask}`;
      parts.push(
        `${label}: ${a.transaction_count} txns | Spending: $${a.total_spending.toFixed(2)} | Income: $${a.total_income.toFixed(2)}`
      );
    });
  }

  switch (questionType) {
    case "account_spending": {
      const dateRange = extractDateRange(question);
      const accountRef = extractAccountRef(question);

      if (accountRef) {
        // Resolve account by mask first, fall back to name-based resolution
        const resolved = resolveAccount(accountRef.mask) || resolveAccount(accountRef.name);

        if (resolved && !Array.isArray(resolved)) {
          const acctLabel = resolved.account_name
            ? `${resolved.account_name} (ending in ${resolved.account_mask})`
            : `Account ending in ${resolved.account_mask}`;

          // Account summary
          const acctSummary = getAccountSummary(
            resolved.account_name,
            resolved.account_mask,
            dateRange.startDate,
            dateRange.endDate
          );

          const dateLabel = dateRange.startDate
            ? ` (${dateRange.startDate} to ${dateRange.endDate})`
            : "";

          parts.push(`\n=== ACCOUNT: ${acctLabel}${dateLabel} ===`);
          parts.push(`Transactions: ${acctSummary.transactionCount}`);
          parts.push(`Total Spending (debits): $${acctSummary.totalSpending.toFixed(2)}`);
          parts.push(`Total Income (credits): $${acctSummary.totalIncome.toFixed(2)}`);
          if (acctSummary.dateRange) {
            parts.push(`Date Range: ${acctSummary.dateRange.min} to ${acctSummary.dateRange.max}`);
          }

          // Category breakdown for this account
          const catSpending = getAccountSpendingByCategory(
            resolved.account_name,
            resolved.account_mask,
            dateRange.startDate,
            dateRange.endDate
          );
          if (catSpending.length > 0) {
            parts.push(`\n=== SPENDING BY CATEGORY (${acctLabel}) ===`);
            catSpending.forEach((c) => {
              parts.push(`${c.category}: $${c.total.toFixed(2)} (${c.count} txns)`);
            });
          }

          // Monthly totals for this account
          const monthlyTotals = getAccountMonthlyTotals(
            resolved.account_name,
            resolved.account_mask,
            6
          );
          if (monthlyTotals.length > 0) {
            parts.push(`\n=== MONTHLY TOTALS (${acctLabel}) ===`);
            monthlyTotals.forEach((m) => {
              parts.push(
                `${m.month}: Expenses $${m.expenses.toFixed(2)} | Income $${m.income.toFixed(2)} | Net $${m.net.toFixed(2)}`
              );
            });
          }

          // Recent transactions for this account
          const recentTxns = getAccountTransactions(
            resolved.account_name,
            resolved.account_mask,
            { startDate: dateRange.startDate, endDate: dateRange.endDate, limit: 10 }
          );
          if (recentTxns.length > 0) {
            parts.push(`\n=== RECENT TRANSACTIONS (${acctLabel}) ===`);
            recentTxns.forEach((t) => {
              const type = t.amount > 0 ? "DEBIT" : "CREDIT";
              parts.push(`${t.date} | ${t.name} | $${Math.abs(t.amount).toFixed(2)} (${type}) | ${t.category}`);
            });
          }
        } else if (Array.isArray(resolved)) {
          // Ambiguous — list matches
          parts.push(`\n=== AMBIGUOUS ACCOUNT REFERENCE ===`);
          parts.push(`Multiple accounts matched "${accountRef.name}". Ask the user to clarify which account:`);
          resolved.forEach((a) => {
            const label = a.account_name
              ? `${a.account_name} (ending in ${a.account_mask})`
              : `Account ending in ${a.account_mask}`;
            parts.push(`- ${label}: ${a.transaction_count} txns, $${a.total_spending.toFixed(2)} spending`);
          });
        } else {
          parts.push(`\n=== ACCOUNT NOT FOUND ===`);
          parts.push(`No account matched "${accountRef.name}". Available accounts:`);
          accounts.forEach((a) => {
            const label = a.account_name
              ? `${a.account_name} (ending in ${a.account_mask})`
              : `Account ending in ${a.account_mask}`;
            parts.push(`- ${label}`);
          });
        }
      }
      break;
    }

    case "account_breakdown": {
      const dateRange = extractDateRange(question);
      const breakdown = getSpendingByAccount(dateRange.startDate, dateRange.endDate);

      const dateLabel = dateRange.startDate
        ? ` (${dateRange.startDate} to ${dateRange.endDate})`
        : "";

      if (breakdown.length > 0) {
        parts.push(`\n=== SPENDING BY ACCOUNT${dateLabel} ===`);
        breakdown.forEach((a) => {
          const label = a.account_name
            ? `${a.account_name} (ending in ${a.account_mask})`
            : `Account ending in ${a.account_mask}`;
          parts.push(
            `${label}: Spending $${a.total_spending.toFixed(2)} | Income $${a.total_income.toFixed(2)} | ${a.transaction_count} txns`
          );
        });
      }
      break;
    }

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
