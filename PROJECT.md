# Finance Advisor — AI-Powered Transaction Analyzer

## Overview
Single-user MVP web app that lets users analyze their full transaction history using AI.
Upload transactions (CSV or Plaid API), ask natural-language questions, get accurate insights.

## Tech Stack
- **Frontend:** Next.js 16 + React 19 + Tailwind CSS
- **Backend:** Next.js API routes
- **AI Model:** Google Gemini 2.5 Flash (OpenAI-compatible API)
- **Database:** SQLite (via better-sqlite3) for transaction storage + querying
- **Deployment:** Local dev first, Cloud Run later

## API Keys
- **Gemini API Key:** Read from env `GEMINI_API_KEY`
- **Plaid (optional):** Read from env `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ACCESS_TOKEN`

## Architecture

```
┌─────────────────────────────────────┐
│          Next.js Frontend           │
│  - Chat interface                   │
│  - CSV upload                       │
│  - Transaction table view           │
│  - Insights dashboard               │
└──────────┬──────────────────────────┘
           │
┌──────────▼──────────────────────────┐
│        API Routes (Backend)          │
│                                      │
│  POST /api/upload     → CSV ingest   │
│  POST /api/chat       → AI Q&A      │
│  GET  /api/transactions → List/filter│
│  GET  /api/summary    → Aggregates   │
│  POST /api/plaid/sync → Plaid import │
└──────────┬──────────────────────────┘
           │
┌──────────▼──────────────────────────┐
│         Data Layer                   │
│                                      │
│  SQLite DB:                          │
│  - transactions table                │
│  - categories table                  │
│  - monthly_summaries (materialized)  │
│                                      │
│  Query Engine:                       │
│  - Pre-built SQL aggregations        │
│  - Category grouping                 │
│  - Monthly/weekly/daily rollups      │
│  - Merchant frequency analysis       │
│  - Subscription detection            │
└──────────┬──────────────────────────┘
           │
┌──────────▼──────────────────────────┐
│       AI Orchestration               │
│                                      │
│  1. Parse user question              │
│  2. Run relevant SQL queries         │
│  3. Build context with real data     │
│  4. Send to Gemini with system prompt│
│  5. Return grounded response         │
│                                      │
│  System prompt enforces:             │
│  - Only reference actual data        │
│  - Include specific numbers          │
│  - Flag uncertainty                  │
│  - Finance-aware formatting          │
└──────────────────────────────────────┘
```

## Data Schema

### transactions
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Plaid transaction_id or generated UUID |
| date | TEXT | YYYY-MM-DD |
| name | TEXT | Merchant/description |
| amount | REAL | Positive=debit, Negative=credit |
| category | TEXT | Primary category (e.g., FOOD_AND_DRINK) |
| subcategory | TEXT | Detailed category |
| account_name | TEXT | Account nickname |
| account_mask | TEXT | Last 4 digits |

### CSV Format Expected
```csv
date,name,amount,category
2026-02-01,Starbucks,-5.25,FOOD_AND_DRINK
2026-02-01,Paycheck,3000.00,INCOME
```

## Task Breakdown

### Task 1: Project Scaffolding
- `npx create-next-app@latest` with TypeScript, Tailwind, App Router
- Add dependencies: better-sqlite3, @types/better-sqlite3
- Set up SQLite database initialization
- Create `.env.example` with required env vars
- **PR: `setup/scaffolding`**

### Task 2: Data Layer — Transaction Storage & Queries
- SQLite schema creation (transactions table)
- CSV upload parser + ingestion endpoint (`POST /api/upload`)
- Transaction listing endpoint (`GET /api/transactions`)
- Pre-built query functions:
  - `getSpendingByCategory(startDate, endDate)`
  - `getMonthlyTotals(months)`
  - `getTopMerchants(limit)`
  - `getSubscriptions()` (recurring similar amounts)
  - `getSpendingTrend(category, months)`
- **PR: `feature/data-layer`**

### Task 3: AI Orchestration Layer
- Gemini API client (OpenAI-compatible format)
- Question classifier (what type of query is this?)
- Context builder (run relevant SQL queries, format as context)
- System prompt with finance-aware grounding rules
- Chat endpoint (`POST /api/chat`)
- Conversation history (in-memory, last 10 messages)
- **PR: `feature/ai-layer`**

### Task 4: Frontend — Chat Interface
- Clean dark-theme chat UI (matches Mission Control aesthetic)
- Message bubbles (user + AI)
- Loading states, error handling
- Markdown rendering for AI responses
- Mobile-responsive
- **PR: `feature/chat-ui`**

### Task 5: Frontend — Upload & Transaction View
- CSV file upload with drag-and-drop
- Upload progress indicator
- Transaction table with sorting/filtering
- Category filter chips
- Date range picker
- Transaction count + totals summary
- **PR: `feature/upload-ui`**

### Task 6: Plaid Integration (Optional)
- Plaid sync endpoint using existing credentials
- "Import from Bank" button on UI
- Map Plaid categories to our schema
- **PR: `feature/plaid-integration`**

### Task 7: Polish & README
- README with setup instructions + example queries
- Example CSV file for testing
- Error boundaries, loading skeletons
- Final cleanup
- **PR: `feature/polish`**

## Example Queries
- "Where am I overspending month to month?"
- "What subscriptions do I have that I rarely use?"
- "How much did I spend on food last quarter?"
- "What's my average monthly spend on entertainment?"
- "Which merchants do I visit most frequently?"
- "How has my spending changed compared to last month?"
- "What are my top 5 expense categories?"

## Privacy
- All data stored locally in SQLite
- No data leaves the system except for AI inference (Gemini API)
- No auth required (single-user MVP)
- No telemetry or analytics
