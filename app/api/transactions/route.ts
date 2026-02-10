import { NextRequest, NextResponse } from "next/server";
import { getTransactions, getCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const search = searchParams.get("search") || undefined;
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const { transactions, total } = getTransactions({
      category,
      startDate,
      endDate,
      search,
      limit,
      offset,
    });

    const categories = getCategories();

    return NextResponse.json({
      transactions,
      total,
      categories,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Transactions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
