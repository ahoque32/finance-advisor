import { NextRequest, NextResponse } from "next/server";
import { parseCSV } from "@/lib/csv-parser";
import { insertTransactions } from "@/lib/queries";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "File must be a CSV" }, { status: 400 });
    }

    const content = await file.text();
    const { transactions, errors, skipped } = parseCSV(content);

    if (transactions.length === 0) {
      return NextResponse.json(
        { error: "No valid transactions found", errors },
        { status: 400 }
      );
    }

    const inserted = insertTransactions(transactions);

    return NextResponse.json({
      success: true,
      inserted,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
}
