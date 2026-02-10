"use client";

import { useState, useEffect, useCallback } from "react";
import { Nav } from "@/components/nav";

interface Transaction {
  id: string;
  date: string;
  name: string;
  amount: number;
  category: string;
  subcategory: string;
  account_name: string;
  account_mask: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set("category", selectedCategory);
      if (search) params.set("search", search);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      params.set("limit", String(limit));
      params.set("offset", String(offset));

      const res = await fetch(`/api/transactions?${params}`);
      const data = await res.json();

      setTransactions(data.transactions || []);
      setTotal(data.total || 0);
      setCategories(data.categories || []);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, search, startDate, endDate, offset]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Reset offset when filters change
  useEffect(() => {
    setOffset(0);
  }, [selectedCategory, search, startDate, endDate]);

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  // Summary stats
  const totalSpending = transactions
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);
  const totalIncome = transactions
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div className="flex flex-col min-h-screen">
      <Nav />

      <div className="flex-1 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">📊 Transactions</h1>
              <p className="text-zinc-400 text-sm mt-1">
                {total} transaction{total !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <div className="glass rounded-xl p-3">
              <p className="text-xs text-zinc-500">Transactions</p>
              <p className="text-lg font-bold">{total}</p>
            </div>
            <div className="glass rounded-xl p-3">
              <p className="text-xs text-zinc-500">Spending</p>
              <p className="text-lg font-bold text-red-400">
                ${totalSpending.toFixed(2)}
              </p>
            </div>
            <div className="glass rounded-xl p-3 col-span-2 sm:col-span-1">
              <p className="text-xs text-zinc-500">Income</p>
              <p className="text-lg font-bold text-green-400">
                ${totalIncome.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm
                       placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50
                       w-full sm:w-auto flex-1 sm:flex-initial min-w-[180px]"
            />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50
                       [color-scheme:dark]"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50
                       [color-scheme:dark]"
            />
          </div>

          {/* Category chips */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              <button
                onClick={() => setSelectedCategory("")}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  selectedCategory === ""
                    ? "bg-blue-600 text-white"
                    : "bg-white/5 text-zinc-400 hover:bg-white/10"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() =>
                    setSelectedCategory(cat === selectedCategory ? "" : cat)
                  }
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white"
                      : "bg-white/5 text-zinc-400 hover:bg-white/10"
                  }`}
                >
                  {cat.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          )}

          {/* Transaction table */}
          {isLoading ? (
            <div className="glass rounded-xl p-8 text-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-zinc-400 text-sm">Loading...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center">
              <p className="text-zinc-400">No transactions found.</p>
              <a
                href="/upload"
                className="inline-block mt-2 text-sm text-blue-400 hover:text-blue-300"
              >
                Upload a CSV →
              </a>
            </div>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="sm:hidden space-y-2">
                {transactions.map((txn) => (
                  <div key={txn.id} className="glass rounded-xl p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {txn.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {txn.date} · {txn.category.replace(/_/g, " ")}
                        </p>
                      </div>
                      <p
                        className={`text-sm font-mono font-medium ml-2 ${
                          txn.amount < 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {txn.amount < 0 ? "+" : "-"}$
                        {Math.abs(txn.amount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table view */}
              <div className="hidden sm:block glass rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-4 py-3 text-zinc-500 font-medium">
                        Date
                      </th>
                      <th className="text-left px-4 py-3 text-zinc-500 font-medium">
                        Name
                      </th>
                      <th className="text-left px-4 py-3 text-zinc-500 font-medium">
                        Category
                      </th>
                      <th className="text-right px-4 py-3 text-zinc-500 font-medium">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn) => (
                      <tr
                        key={txn.id}
                        className="border-b border-white/5 hover:bg-white/5"
                      >
                        <td className="px-4 py-3 text-zinc-400">{txn.date}</td>
                        <td className="px-4 py-3">{txn.name}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-white/5 px-2 py-0.5 rounded-full">
                            {txn.category.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-mono ${
                            txn.amount < 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {txn.amount < 0 ? "+" : "-"}$
                          {Math.abs(txn.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    disabled={offset === 0}
                    className="bg-white/5 hover:bg-white/10 disabled:opacity-30 px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    ← Previous
                  </button>
                  <span className="text-sm text-zinc-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setOffset(offset + limit)}
                    disabled={currentPage >= totalPages}
                    className="bg-white/5 hover:bg-white/10 disabled:opacity-30 px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
