export type QuestionType =
  | "spending_by_category"
  | "monthly_overview"
  | "merchant_analysis"
  | "subscription_check"
  | "spending_trend"
  | "comparison"
  | "account_spending"
  | "account_breakdown"
  | "general"
  | "greeting";

/**
 * Known account aliases for matching user references to account identifiers.
 * Each entry maps common user phrases to account mask suffixes.
 */
const ACCOUNT_ALIASES: { patterns: RegExp; mask: string; name: string }[] = [
  { patterns: /main\s*check|checking|3903/, mask: "3903", name: "Main Checking" },
  { patterns: /\bmain\b(?!.*check)|7255/, mask: "7255", name: "Main" },
  { patterns: /business|7561/, mask: "7561", name: "Business" },
  { patterns: /work|8217/, mask: "8217", name: "Work" },
];

/**
 * Extract the account reference from a question.
 * Returns { mask, name } if a known account is detected, null otherwise.
 */
export function extractAccountRef(question: string): { mask: string; name: string } | null {
  const q = question.toLowerCase();

  // Check for explicit mask references like "ending in 3903" or "account 3903"
  const maskMatch = q.match(/(?:ending\s+(?:in\s+)?|account\s*(?:#\s*)?|acct\s*\.?\s*)(\d{4})/);
  if (maskMatch) {
    const mask = maskMatch[1];
    const alias = ACCOUNT_ALIASES.find((a) => a.mask === mask);
    return { mask, name: alias?.name || `Account ending in ${mask}` };
  }

  // Check for name-based references
  for (const alias of ACCOUNT_ALIASES) {
    if (alias.patterns.test(q)) {
      return { mask: alias.mask, name: alias.name };
    }
  }

  return null;
}

export function classifyQuestion(question: string): QuestionType {
  const q = question.toLowerCase();

  // Greetings
  if (/^(hi|hello|hey|howdy|what's up|yo)\b/.test(q) && q.length < 30) {
    return "greeting";
  }

  // Account breakdown — "spending by account", "breakdown by account", "per account"
  if (/(?:by|per|each|all)\s*account|account\s*(?:breakdown|summary|overview)|breakdown\s*(?:by|per)\s*account/.test(q)) {
    return "account_breakdown";
  }

  // Account-specific queries — detect when user asks about a specific account
  const accountRef = extractAccountRef(q);
  if (accountRef) {
    // If they mention a specific account + spending/balance/transactions
    if (/spend|cost|expens|paid|bought|purchase|charg|balance|transact|went out|debit|what.*from|how much.*from/.test(q)) {
      return "account_spending";
    }
    // Even if it's just "my business account" — likely wants account info
    if (/account/.test(q)) {
      return "account_spending";
    }
  }

  // Subscriptions
  if (/subscri|recurr|monthly (payment|charge|bill)|auto.?pay/.test(q)) {
    return "subscription_check";
  }

  // Spending trends / over time
  if (/trend|over time|month.?over|chang|increas|decreas|compar/.test(q)) {
    if (/compar|vs|versus|against|last month|previous/.test(q)) {
      return "comparison";
    }
    return "spending_trend";
  }

  // Monthly overview
  if (/monthly|this month|last month|month total|month summar/.test(q)) {
    return "monthly_overview";
  }

  // Category spending
  if (/categor|food|dining|entertainment|transport|shopping|groceries|utilit|rent|health/.test(q)) {
    return "spending_by_category";
  }

  // Merchant analysis
  if (/merchant|store|restaurant|where.*shop|where.*spend|most visit|frequen|top.*spend/.test(q)) {
    return "merchant_analysis";
  }

  // Spending keywords (generic, not account-specific — account was checked above)
  if (/spend|cost|expens|paid|bought|purchase|charg/.test(q)) {
    return "spending_by_category";
  }

  // Income
  if (/income|earn|salary|paycheck|deposit/.test(q)) {
    return "monthly_overview";
  }

  return "general";
}
