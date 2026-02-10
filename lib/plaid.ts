const PLAID_BASE_URL = "https://production.plaid.com";

interface PlaidTransaction {
  transaction_id: string;
  date: string;
  name: string;
  amount: number;
  personal_finance_category?: {
    primary: string;
    detailed: string;
  };
  category?: string[];
  account_id: string;
}

interface PlaidAccount {
  account_id: string;
  name: string;
  mask: string | null;
}

interface PlaidTransactionsResponse {
  accounts: PlaidAccount[];
  transactions: PlaidTransaction[];
  total_transactions: number;
}

function getPlaidCredentials() {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  const accessToken = process.env.PLAID_ACCESS_TOKEN;

  if (!clientId || !secret || !accessToken) {
    throw new Error("Plaid credentials not configured. Set PLAID_CLIENT_ID, PLAID_SECRET, and PLAID_ACCESS_TOKEN.");
  }

  return { clientId, secret, accessToken };
}

export async function fetchPlaidTransactions(
  startDate: string,
  endDate: string
): Promise<{
  transactions: {
    id: string;
    date: string;
    name: string;
    amount: number;
    category: string;
    subcategory: string;
    account_name: string;
    account_mask: string;
  }[];
  totalAvailable: number;
}> {
  const { clientId, secret, accessToken } = getPlaidCredentials();

  const allTransactions: PlaidTransaction[] = [];
  const accountMap = new Map<string, PlaidAccount>();
  let offset = 0;
  let totalTransactions = 0;

  // Paginate through all transactions
  do {
    const response = await fetch(`${PLAID_BASE_URL}/transactions/get`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        secret: secret,
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
        options: {
          count: 500,
          offset,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Plaid API error:", response.status, errorBody);
      throw new Error(`Plaid API error: ${response.status}`);
    }

    const data: PlaidTransactionsResponse = await response.json();

    // Build account map
    for (const account of data.accounts) {
      accountMap.set(account.account_id, account);
    }

    allTransactions.push(...data.transactions);
    totalTransactions = data.total_transactions;
    offset += data.transactions.length;
  } while (offset < totalTransactions);

  // Map to our format
  const transactions = allTransactions.map((txn) => {
    const account = accountMap.get(txn.account_id);
    const category = txn.personal_finance_category?.primary
      || txn.category?.[0]
      || "UNCATEGORIZED";
    const subcategory = txn.personal_finance_category?.detailed
      || txn.category?.slice(1).join(" > ")
      || "";

    return {
      id: `plaid-${txn.transaction_id}`,
      date: txn.date,
      name: txn.name,
      amount: txn.amount, // Plaid: positive = debit, negative = credit
      category: category.toUpperCase().replace(/ /g, "_"),
      subcategory,
      account_name: account?.name || "",
      account_mask: account?.mask || "",
    };
  });

  return { transactions, totalAvailable: totalTransactions };
}
