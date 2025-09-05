# WordFlux Architecture

## Overview
WordFlux is a Next.js App Router application that combines a kanban‑style board with an AI assistant. The assistant uses OpenAI’s Chat Completions API (GPT‑5 by default) to provide actionable guidance based on the live board state. Board data persists to DynamoDB when AWS is configured, with a progressive fallback to an in‑memory store for local development.

Key parts:
- Next.js App Router under `app/` with API routes at `app/api/.../route.js`.
- Board data access in `app/lib/board.js` (DynamoDB + in‑memory fallback).
- Chat integration in `app/api/chat/route.js` using `OPENAI_API_KEY` and a GPT‑5 compatible model.
- Board mutation routes in `app/api/board/*` (e.g., `get`, `seed`, `move-card`, `apply`).

## Runtime Flow

### UI → API → OpenAI → UI
1. User types a prompt in the left‑hand “GPT‑5 Assistant” panel (see `app/page.js`).
2. The browser posts to `POST /api/chat` with `{ message, board? }`.
3. The server handler (`app/api/chat/route.js`):
   - Reads `OPENAI_API_KEY` and resolves model: `OPENAI_MODEL` or `OPENAI_CHAT_MODEL` (default `gpt-5`).
   - Loads current board with `getBoard()` for context.
   - Calls `https://api.openai.com/v1/chat/completions` with a system prompt and the board state embedded in the user message.
   - Parses the assistant’s text and extracts lightweight suggestion tags (e.g., `move`, `merge`, `wip`).
4. Response returns JSON: `{ response, suggestions, model }`, which the client renders in the chat log.

### Board Data Flow
- `getBoard(autoSeed=false)` in `app/lib/board.js`:
  - If `AWS_REGION` and `DYNAMO_TABLE` are present, fetch from DynamoDB (`pk = BOARD_PK || "board#default"`).
  - Otherwise, use an in‑memory object. When `autoSeed` is true, a default sample board is created on first access.
- `putBoard(board)` writes back to DynamoDB if configured, or mirrors to the in‑memory store as a fallback.

### Board Mutation APIs
- `POST /api/board/move-card`: Minimal endpoint to move a card between columns.
- `POST /api/board/apply`: Generalized mutations (set WIP limits, add/update/delete/duplicate cards, add/rename/delete columns, move columns, move cards).
- `POST /api/board/seed`: Seeds the default board (useful for local or empty tables).
- `GET /api/board/get`: Returns the current board.

## Files of Interest
- `app/page.js`: Server‑renders the board and includes a small inline script for chat and "Move →" buttons.
- `app/api/chat/route.js`: GPT‑5 chat integration and suggestion extraction.
- `app/lib/board.js`: DynamoDB client, in‑memory fallback, seed data, and env status.
- `app/api/board/*/route.js`: Thin HTTP handlers over board mutations.

## Environment Variables
- `OPENAI_API_KEY` (required): API key for OpenAI.
- `OPENAI_MODEL` (optional): Model name; defaults to `gpt-5-mini`. Available: `gpt-5`, `gpt-5-mini`, `gpt-5-nano`.
- `AWS_REGION` (optional): Enables DynamoDB persistence when set with `DYNAMO_TABLE`.
- `DYNAMO_TABLE` (optional): DynamoDB table name.
- `BOARD_PK` (optional): Partition key for the board item. Defaults to `board#default`.

Notes
- AWS credentials must be available on the host (e.g., `~/.aws/credentials`).
- When AWS variables are not set, the app uses a process‑lifetime in‑memory board.

## Error Handling & Resilience
- Chat API failures return `{ error }` with status 500; the UI prints a simple error bubble.
- DynamoDB failures fall back to in‑memory store when possible so local development remains unblocked.

## Local Development
- `npm run dev` starts Next.js on `:3000`.
- `npm run dev:https` uses `server.js` on `:3443` and expects `cert.pem`/`key.pem` in the current working directory.
- Seed the board via `npm run seed` or `POST /api/board/seed`.

## v0.3.3 Production Release Updates

### New Component Architecture
- **Board.jsx**: Main board container with SWR for data fetching
- **Column.jsx**: Column component with inline AddCardInline for card creation
- **Card.jsx**: Card component with edit and delete operations
- **FilterBar.jsx**: Filters with SavedViews dropdown for persistence
- **ChatPanel.jsx**: AI chat interface with length modes
- **UpgradePrompt.jsx**: Pro feature monetization modal with useProStatus hook

### GPT-5 Integration Details
- **Model Configuration**: Uses `gpt-5-mini` for optimal cost/performance balance
- **Internal API Calls**: Fixed to use `http://localhost:3000` to avoid SSL errors
- **Version Tracking**: Board operations include version for conflict detection
- **Error Handling**: Graceful handling of version conflicts with retry logic
- **Action DSL**: Supports create_card, update_card, move_card, delete_card, comment operations
- **Card Queries**: Flexible targeting via ID or search queries ("title:foo priority:high")
- **See [GPT5_SETUP.md](./GPT5_SETUP.md)** for detailed troubleshooting guide

### Enhanced API Endpoints
- **POST /api/ai**: GPT-5 powered assistant (≤60 words, JSON-only actions)
- **POST /api/board/apply**: New operations: create_card, create_column, rename_column, delete_column
- **POST /api/views/save**: Save filter configurations
- **GET /api/views/get**: Retrieve saved views
- **POST /api/billing/checkout**: Stripe integration for Pro upgrade

### Completed Features (v0.3.3)
- ✅ Inline card creation with "Add card" buttons in column footers
- ✅ Dynamic column management (create/rename/delete)
- ✅ Tightened AI responses (≤60 words, JSON-only for board modifications)
- ✅ Saved filter views with localStorage persistence
- ✅ Pro monetization with Voice & Image feature gating
- ✅ Toast notifications via react-hot-toast for user feedback
- ✅ Mobile responsive design with collapsible chat sidebar
- ✅ Component extraction for improved modularity

### Upcoming Features (Roadmap)
- Realtime Voice with function-calling for hands-free operation
- Usage metering (100 free actions, Pro = unlimited)
- Multi-board sharing with permissions
- PostgreSQL database with Prisma ORM
- Socket.io for real-time collaboration
- NextAuth.js for authentication

