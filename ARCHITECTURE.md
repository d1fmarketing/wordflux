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
- `OPENAI_MODEL` or `OPENAI_CHAT_MODEL` (optional): Model name; defaults to `gpt-5`.
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

## Planned Enhancements (tracked in tasks)
- LocalStorage persistence for board state (load first from local, then API; auto‑save on changes).
- Actionable AI suggestions (e.g., one‑click "Apply" to move cards).
- Inline card title editing.
- CSV export and activity history.

