import { NextResponse } from "next/server";
import {
  getSummary,
  getSpendingByCategory,
  getMonthlyTotals,
  getTopMerchants,
  getSubscriptions,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const summary = getSummary();
    const categorySpending = getSpendingByCategory();
    const monthlyTotals = getMonthlyTotals(12);
    const topMerchants = getTopMerchants(10);
    const subscriptions = getSubscriptions();

    return NextResponse.json({
      summary,
      categorySpending,
      monthlyTotals,
      topMerchants,
      subscriptions,
    });
  } catch (error) {
    console.error("Summary error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
