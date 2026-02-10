import { getDb } from "./db";

export interface Transaction {
  id: string;
  date: string;
  name: string;
  amount: number;
  category: string;
  subcategory: string;
  account_name: string;
  account_mask: string;
}

export interface CategorySpending {
  category: string;
  total: number;
  count: number;
}

export interface MonthlyTotal {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export interface MerchantFrequency {
  name: string;
  count: number;
  total: number;
  avg: number;
}

export interface Subscription {
  name: string;
  amount: number;
  frequency: number;
  first_date: string;
  last_date: string;
}

export function insertTransactions(transactions: Omit<Transaction, "id">[]): number {
  const db = getDb();
  const insert = db.prepare(`
    INSERT OR REPLACE INTO transactions (id, date, name, amount, category, subcategory, account_name, account_mask)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((txns: Omit<Transaction, "id">[]) => {
    let count = 0;
    for (const txn of txns) {
      const id = `csv-${txn.date}-${txn.name}-${txn.amount}-${Math.random().toString(36).slice(2, 8)}`;
      insert.run(id, txn.date, txn.name, txn.amount, txn.category || "UNCATEGORIZED", txn.subcategory || "", txn.account_name || "", txn.account_mask || "");
      count++;
    }
    return count;
  });

  return insertMany(transactions);
}

export function getTransactions(options?: {
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): { transactions: Transaction[]; total: number } {
  const db = getDb();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (options?.category) {
    conditions.push("category = ?");
    params.push(options.category);
  }
  if (options?.startDate) {
    conditions.push("date >= ?");
    params.push(options.startDate);
  }
  if (options?.endDate) {
    conditions.push("date <= ?");
    params.push(options.endDate);
  }
  if (options?.search) {
    conditions.push("name LIKE ?");
    params.push(`%${options.search}%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM transactions ${where}`).get(...params) as { total: number };

  const limit = options?.limit || 100;
  const offset = options?.offset || 0;

  const transactions = db.prepare(
    `SELECT * FROM transactions ${where} ORDER BY date DESC, name ASC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset) as Transaction[];

  return { transactions, total: countRow.total };
}

export function getSpendingByCategory(startDate?: string, endDate?: string): CategorySpending[] {
  const db = getDb();
  const conditions: string[] = ["amount > 0"]; // debits only
  const params: string[] = [];

  if (startDate) {
    conditions.push("date >= ?");
    params.push(startDate);
  }
  if (endDate) {
    conditions.push("date <= ?");
    params.push(endDate);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  return db.prepare(`
    SELECT category, SUM(amount) as total, COUNT(*) as count
    FROM transactions
    ${where}
    GROUP BY category
    ORDER BY total DESC
  `).all(...params) as CategorySpending[];
}

export function getMonthlyTotals(months?: number): MonthlyTotal[] {
  const db = getDb();
  const limit = months || 12;

  return db.prepare(`
    SELECT 
      strftime('%Y-%m', date) as month,
      SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as income,
      SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as expenses,
      SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE -amount END) as net
    FROM transactions
    GROUP BY strftime('%Y-%m', date)
    ORDER BY month DESC
    LIMIT ?
  `).all(limit) as MonthlyTotal[];
}

export function getTopMerchants(limit?: number): MerchantFrequency[] {
  const db = getDb();
  const n = limit || 10;

  return db.prepare(`
    SELECT 
      name,
      COUNT(*) as count,
      SUM(amount) as total,
      AVG(amount) as avg
    FROM transactions
    WHERE amount > 0
    GROUP BY name
    ORDER BY count DESC
    LIMIT ?
  `).all(n) as MerchantFrequency[];
}

export function getSubscriptions(): Subscription[] {
  const db = getDb();

  // Find merchants with 2+ transactions of similar amounts (within 10%)
  return db.prepare(`
    SELECT 
      name,
      ROUND(AVG(amount), 2) as amount,
      COUNT(*) as frequency,
      MIN(date) as first_date,
      MAX(date) as last_date
    FROM transactions
    WHERE amount > 0
    GROUP BY name
    HAVING COUNT(*) >= 2
      AND (MAX(amount) - MIN(amount)) / AVG(amount) < 0.1
    ORDER BY frequency DESC, amount DESC
  `).all() as Subscription[];
}

export function getSpendingTrend(category: string, months?: number): { month: string; total: number }[] {
  const db = getDb();
  const limit = months || 6;

  return db.prepare(`
    SELECT 
      strftime('%Y-%m', date) as month,
      SUM(amount) as total
    FROM transactions
    WHERE category = ? AND amount > 0
    GROUP BY strftime('%Y-%m', date)
    ORDER BY month DESC
    LIMIT ?
  `).all(category, limit) as { month: string; total: number }[];
}

export function getCategories(): string[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT DISTINCT category FROM transactions ORDER BY category
  `).all() as { category: string }[];
  return rows.map((r) => r.category);
}

export function getSummary(): {
  totalTransactions: number;
  totalSpending: number;
  totalIncome: number;
  dateRange: { min: string; max: string } | null;
} {
  const db = getDb();
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as totalTransactions,
      SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as totalSpending,
      SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as totalIncome,
      MIN(date) as minDate,
      MAX(date) as maxDate
    FROM transactions
  `).get() as { totalTransactions: number; totalSpending: number; totalIncome: number; minDate: string | null; maxDate: string | null };

  return {
    totalTransactions: stats.totalTransactions,
    totalSpending: stats.totalSpending || 0,
    totalIncome: stats.totalIncome || 0,
    dateRange: stats.minDate ? { min: stats.minDate, max: stats.maxDate! } : null,
  };
}
