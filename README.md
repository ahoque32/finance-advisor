# 💰 Finance Advisor

AI-powered transaction analyzer. Upload your transactions and ask questions about your spending habits using natural language.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-4-38B2AC) ![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003B57)

## Features

- **💬 AI Chat** — Ask natural-language questions about your spending (powered by Gemini 2.5 Flash)
- **📤 CSV Upload** — Drag-and-drop CSV file upload with flexible column mapping
- **🏦 Bank Import** — Import transactions directly from your bank via Plaid
- **📊 Transaction View** — Browse, search, filter, and paginate your transactions
- **🔍 Smart Analysis** — Automatic spending categorization, subscription detection, trend analysis
- **📱 Mobile-First** — Responsive dark theme that looks great on iPhone

## Quick Start

```bash
# Clone
git clone https://github.com/ahoque32/finance-advisor.git
cd finance-advisor

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key for AI chat |
| `PLAID_CLIENT_ID` | No | Plaid client ID for bank imports |
| `PLAID_SECRET` | No | Plaid secret for bank imports |
| `PLAID_ACCESS_TOKEN` | No | Plaid access token for bank imports |

## Usage

### Upload Transactions

1. Navigate to **📤 Upload**
2. Drag & drop a CSV file or click to browse
3. CSV should have columns: `date`, `name`, `amount`, `category` (optional)

Example CSV:
```csv
date,name,amount,category
2026-02-01,Starbucks,5.25,FOOD_AND_DRINK
2026-02-01,Paycheck,-3200.00,INCOME
2026-02-03,Netflix,15.99,ENTERTAINMENT
```

> **Note:** Positive amounts = expenses, negative amounts = income

### Import from Bank

1. Navigate to **📤 Upload**
2. Click **🏦 Import from Bank**
3. Last 90 days of transactions will be imported via Plaid

### Chat with AI

Navigate to **💬 Chat** and ask questions like:

- "Where am I overspending month to month?"
- "What subscriptions do I have?"
- "How much did I spend on food last month?"
- "What are my top 5 expense categories?"
- "Which merchants do I visit most frequently?"
- "How has my spending changed compared to last month?"

## Architecture

```
├── app/
│   ├── api/
│   │   ├── chat/         → AI Q&A endpoint
│   │   ├── upload/       → CSV ingest
│   │   ├── transactions/ → List/filter
│   │   ├── summary/      → Aggregated stats
│   │   └── plaid/sync/   → Bank import
│   ├── chat/             → Chat UI
│   ├── transactions/     → Transaction table
│   ├── upload/           → CSV upload + Plaid import
│   └── page.tsx          → Landing page
├── components/
│   ├── chat-input.tsx
│   ├── chat-message.tsx
│   └── nav.tsx
├── lib/
│   ├── db.ts             → SQLite connection + schema
│   ├── queries.ts        → Query functions
│   ├── csv-parser.ts     → CSV parsing
│   ├── gemini.ts         → Gemini API client
│   ├── classifier.ts     → Question classification
│   ├── context-builder.ts → Data context for AI
│   ├── system-prompt.ts  → AI system prompt
│   └── plaid.ts          → Plaid API client
└── data/
    └── finance.db        → SQLite database (auto-created)
```

## Tech Stack

- **Next.js 16** — React framework with App Router
- **TypeScript** — Type safety
- **Tailwind CSS 4** — Utility-first styling
- **better-sqlite3** — Fast, synchronous SQLite
- **Google Gemini 2.5 Flash** — AI model (OpenAI-compatible API)
- **Plaid API** — Bank transaction import

## Development

```bash
npm run dev     # Start dev server
npm run build   # Production build
npm run start   # Start production server
npm run lint    # Run ESLint
```

## License

MIT
