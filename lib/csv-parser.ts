export interface ParsedTransaction {
  date: string;
  name: string;
  amount: number;
  category: string;
  subcategory: string;
  account_name: string;
  account_mask: string;
}

export interface ParseResult {
  transactions: ParsedTransaction[];
  errors: string[];
  skipped: number;
}

export function parseCSV(content: string): ParseResult {
  const lines = content.trim().split("\n");
  const transactions: ParsedTransaction[] = [];
  const errors: string[] = [];
  let skipped = 0;

  if (lines.length < 2) {
    return { transactions: [], errors: ["CSV file is empty or has no data rows"], skipped: 0 };
  }

  // Parse header
  const header = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());

  // Map column indices
  const dateIdx = findColumn(header, ["date", "transaction_date", "trans_date", "posted_date"]);
  const nameIdx = findColumn(header, ["name", "description", "merchant", "memo", "payee"]);
  const amountIdx = findColumn(header, ["amount", "transaction_amount", "debit"]);
  const categoryIdx = findColumn(header, ["category", "type", "transaction_type"]);
  const subcategoryIdx = findColumn(header, ["subcategory", "sub_category", "detailed_category"]);
  const accountIdx = findColumn(header, ["account", "account_name"]);
  const maskIdx = findColumn(header, ["account_mask", "mask", "last_four"]);

  if (dateIdx === -1) {
    return { transactions: [], errors: ["Missing required column: date"], skipped: 0 };
  }
  if (nameIdx === -1) {
    return { transactions: [], errors: ["Missing required column: name/description"], skipped: 0 };
  }
  if (amountIdx === -1) {
    return { transactions: [], errors: ["Missing required column: amount"], skipped: 0 };
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      skipped++;
      continue;
    }

    try {
      const cols = parseCSVLine(line);

      const dateRaw = cols[dateIdx]?.trim();
      const name = cols[nameIdx]?.trim();
      const amountRaw = cols[amountIdx]?.trim();

      if (!dateRaw || !name || !amountRaw) {
        errors.push(`Row ${i + 1}: missing required field`);
        skipped++;
        continue;
      }

      const date = normalizeDate(dateRaw);
      if (!date) {
        errors.push(`Row ${i + 1}: invalid date "${dateRaw}"`);
        skipped++;
        continue;
      }

      const amount = parseFloat(amountRaw.replace(/[$,]/g, ""));
      if (isNaN(amount)) {
        errors.push(`Row ${i + 1}: invalid amount "${amountRaw}"`);
        skipped++;
        continue;
      }

      transactions.push({
        date,
        name,
        amount,
        category: categoryIdx !== -1 ? (cols[categoryIdx]?.trim() || "UNCATEGORIZED") : "UNCATEGORIZED",
        subcategory: subcategoryIdx !== -1 ? (cols[subcategoryIdx]?.trim() || "") : "",
        account_name: accountIdx !== -1 ? (cols[accountIdx]?.trim() || "") : "",
        account_mask: maskIdx !== -1 ? (cols[maskIdx]?.trim() || "") : "",
      });
    } catch (e) {
      errors.push(`Row ${i + 1}: parse error`);
      skipped++;
    }
  }

  return { transactions, errors, skipped };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function findColumn(header: string[], candidates: string[]): number {
  for (const candidate of candidates) {
    const idx = header.indexOf(candidate);
    if (idx !== -1) return idx;
  }
  return -1;
}

function normalizeDate(raw: string): string | null {
  // Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  // Try MM/DD/YYYY or M/D/YYYY
  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, month, day, year] = slashMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Try MM-DD-YYYY
  const dashMatch = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dashMatch) {
    const [, month, day, year] = dashMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Try Date.parse as fallback
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return null;
}
