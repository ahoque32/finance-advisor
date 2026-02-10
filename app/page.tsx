export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-2">💰 Finance Advisor</h1>
        <p className="text-zinc-400 mb-6">
          AI-powered transaction analyzer. Upload your transactions and ask questions about your spending.
        </p>
        <div className="flex flex-col gap-3">
          <a
            href="/chat"
            className="bg-white/10 hover:bg-white/20 transition-colors rounded-xl px-6 py-3 font-medium"
          >
            💬 Chat with AI
          </a>
          <a
            href="/transactions"
            className="bg-white/10 hover:bg-white/20 transition-colors rounded-xl px-6 py-3 font-medium"
          >
            📊 View Transactions
          </a>
          <a
            href="/upload"
            className="bg-white/10 hover:bg-white/20 transition-colors rounded-xl px-6 py-3 font-medium"
          >
            📤 Upload CSV
          </a>
        </div>
      </div>
    </div>
  );
}
