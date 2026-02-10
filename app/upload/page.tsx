"use client";

import { useState, useCallback } from "react";
import { Nav } from "@/components/nav";

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    inserted?: number;
    skipped?: number;
    errors?: string[];
    error?: string;
  } | null>(null);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ error: "Upload failed. Please try again." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) {
      uploadFile(file);
    } else {
      setResult({ error: "Please upload a CSV file." });
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Nav />

      <div className="flex-1 px-4 py-8">
        <div className="max-w-xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">📤 Upload Transactions</h1>
          <p className="text-zinc-400 mb-6">
            Upload a CSV file with your transaction data. Expected columns: date, name, amount, category (optional).
          </p>

          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`glass rounded-2xl p-12 text-center transition-all cursor-pointer ${
              isDragging
                ? "border-blue-500 bg-blue-500/10 scale-[1.02]"
                : "hover:bg-white/5"
            }`}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-zinc-400">Processing...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="text-4xl">📁</div>
                <p className="text-lg font-medium">
                  {isDragging ? "Drop it here!" : "Drag & drop a CSV file"}
                </p>
                <p className="text-zinc-500 text-sm">or click to browse</p>
              </div>
            )}
          </div>

          {/* Result */}
          {result && (
            <div className="mt-6">
              {result.success ? (
                <div className="glass rounded-xl p-4 border-green-500/30">
                  <p className="text-green-400 font-medium mb-1">
                    ✅ Upload successful!
                  </p>
                  <p className="text-sm text-zinc-400">
                    {result.inserted} transactions imported
                    {result.skipped ? `, ${result.skipped} skipped` : ""}
                  </p>
                  {result.errors && result.errors.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-sm text-yellow-400 cursor-pointer">
                        ⚠ {result.errors.length} warning(s)
                      </summary>
                      <ul className="mt-1 text-xs text-zinc-500 space-y-1">
                        {result.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                  <a
                    href="/transactions"
                    className="inline-block mt-3 text-sm text-blue-400 hover:text-blue-300"
                  >
                    View transactions →
                  </a>
                </div>
              ) : (
                <div className="glass rounded-xl p-4 border-red-500/30">
                  <p className="text-red-400 font-medium">
                    ❌ {result.error || "Upload failed"}
                  </p>
                  {result.errors && (
                    <ul className="mt-2 text-xs text-zinc-500 space-y-1">
                      {result.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {/* CSV Format help */}
          <div className="glass rounded-xl p-4 mt-6">
            <h3 className="font-medium mb-2 text-sm">Expected CSV Format</h3>
            <pre className="text-xs text-zinc-400 overflow-x-auto">
{`date,name,amount,category
2026-02-01,Starbucks,-5.25,FOOD_AND_DRINK
2026-02-01,Paycheck,3000.00,INCOME`}
            </pre>
            <p className="text-xs text-zinc-500 mt-2">
              Positive amounts = expenses, negative = income. Category is optional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
