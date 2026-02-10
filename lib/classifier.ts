export type QuestionType =
  | "spending_by_category"
  | "monthly_overview"
  | "merchant_analysis"
  | "subscription_check"
  | "spending_trend"
  | "comparison"
  | "general"
  | "greeting";

export function classifyQuestion(question: string): QuestionType {
  const q = question.toLowerCase();

  // Greetings
  if (/^(hi|hello|hey|howdy|what's up|yo)\b/.test(q) && q.length < 30) {
    return "greeting";
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

  // Spending keywords
  if (/spend|cost|expens|paid|bought|purchase|charg/.test(q)) {
    return "spending_by_category";
  }

  // Income
  if (/income|earn|salary|paycheck|deposit/.test(q)) {
    return "monthly_overview";
  }

  return "general";
}
