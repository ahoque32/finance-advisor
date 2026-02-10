import { NextRequest, NextResponse } from "next/server";
import { fetchPlaidTransactions } from "@/lib/plaid";
import { getDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    // Default: last 90 days
    const endDate = body.endDate || new Date().toISOString().split("T")[0];
    const startDate =
      body.startDate ||
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const { transactions, totalAvailable } = await fetchPlaidTransactions(
      startDate,
      endDate
    );

    if (transactions.length === 0) {
      return NextResponse.json({
        success: true,
        imported: 0,
        totalAvailable,
        message: "No transactions found in the given date range.",
      });
    }

    // Insert into database
    const db = getDb();
    const insert = db.prepare(`
      INSERT OR REPLACE INTO transactions (id, date, name, amount, category, subcategory, account_name, account_mask)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction(
      (
        txns: {
          id: string;
          date: string;
          name: string;
          amount: number;
          category: string;
          subcategory: string;
          account_name: string;
          account_mask: string;
        }[]
      ) => {
        let count = 0;
        for (const txn of txns) {
          insert.run(
            txn.id,
            txn.date,
            txn.name,
            txn.amount,
            txn.category,
            txn.subcategory,
            txn.account_name,
            txn.account_mask
          );
          count++;
        }
        return count;
      }
    );

    const imported = insertMany(transactions);

    return NextResponse.json({
      success: true,
      imported,
      totalAvailable,
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    console.error("Plaid sync error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to sync with Plaid";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
