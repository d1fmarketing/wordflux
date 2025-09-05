# WordFlux API Docs

Base URL (dev): `http://localhost:3000`

All endpoints return JSON. Errors include `{ error: string }` with an appropriate HTTP status code (usually 500 for server errors).

## Health
- GET `/api/health`
  - Response: `{ ok: true }`
  - Usage:
    ```bash
    curl http://localhost:3000/api/health
    ```

## AI Assistant (GPT-5)
- POST `/api/ai`
  - Model: `gpt-5-mini` (configurable via OPENAI_MODEL env var)
  - Body:
    ```json
    { "message": "string", "board": { /* optional board override */ } }
    ```
  - Response:
    ```json
    { 
      "reply": "brief response ≤60 words",
      "actions": [{ "op": "create_card", "args": {...} }],
      "board": { /* updated board state */ },
      "version": 123,
      "rawActions": [ /* GPT-5 raw response */ ]
    }
    ```
  - Error Responses:
    ```json
    { "error": "version_conflict", "currentVersion": 10, "expectedVersion": 9 }
    { "error": "AI service error", "reply": "Failed to process request" }
    ```
  - Tightened to ≤60 words, JSON-only for board modifications
  - Supports card queries: `"cardQuery": "title:bug priority:high"`
  - Example:
    ```bash
    curl -s -X POST \
      -H 'Content-Type: application/json' \
      -d '{"message":"Add a task for user testing"}' \
      http://localhost:3000/api/ai | jq .
    ```

## Chat (Alternative GPT-5 Endpoint)
- POST `/api/chat`
  - Body:
    ```json
    { "message": "string", "board": { /* optional board override */ } }
    ```
  - Response:
    ```json
    { "response": "assistant text",
      "suggestions": [{ "type": "move" | "merge" | "wip", "text": "string" }],
      "model": "gpt-5-mini" }
    ```
  - Example:
    ```bash
    curl -s -X POST \
      -H 'Content-Type: application/json' \
      -d '{"message":"What should we prioritize next?"}' \
      http://localhost:3000/api/chat | jq .
    ```

## Board: Get
- GET `/api/board/get`
  - Response: `{ board: Board }`
  - Example:
    ```bash
    curl http://localhost:3000/api/board/get | jq .
    ```

## Board: Seed
- POST `/api/board/seed`
  - Creates the default sample board in DynamoDB or in memory (fallback).
  - Response: `{ ok: true }` or `{ board }` depending on implementation.
  - Example:
    ```bash
    curl -X POST http://localhost:3000/api/board/seed
    ```

## Board: Move Card (simple)
- POST `/api/board/move-card`
  - Body:
    ```json
    { "fromColumnId": "Backlog", "toColumnId": "Doing", "cardId": "backlog-1", "position": 0 }
    ```
  - Response: `{ ok: true, board: Board }`
  - Example:
    ```bash
    curl -s -X POST \
      -H 'Content-Type: application/json' \
      -d '{"fromColumnId":"Backlog","toColumnId":"Doing","cardId":"backlog-1"}' \
      http://localhost:3000/api/board/move-card | jq .
    ```

## Board: Apply (generalized mutations)
- POST `/api/board/apply`
  - Body (select one `op` and provide `args`):
    - `set_wip_limit`: `{ columnId, limit }`
    - `move_card`: `{ fromColumnId, toColumnId, cardId, position? }`
    - `create_card`: `{ columnId, title, description?, owner?, priority? }`
    - `create_column`: `{ name }`
    - `add_card`: `{ columnId, title, desc?, owner?, priority?, id? }` (legacy)
    - `update_card`: `{ columnId, cardId, title?, desc?, owner?, priority? }`
    - `delete_card`: `{ columnId, cardId }`
    - `duplicate_card`: `{ columnId, cardId }`
    - `add_column`: `{ id?, name }`
    - `rename_column`: `{ columnId, newName }`
    - `delete_column`: `{ columnId }`
    - `move_column`: `{ fromIndex, toIndex }`
  - Response: `{ ok: true, board: Board }`
  - Example (set WIP limit):
    ```bash
    curl -s -X POST \
      -H 'Content-Type: application/json' \
      -d '{"op":"set_wip_limit","args":{"columnId":"Doing","limit":3}}' \
      http://localhost:3000/api/board/apply | jq .
    ```

## Env Status
- GET `/api/env`
  - Returns whether AWS/DynamoDB is configured and whether the in‑memory fallback is active.
  - Example:
    ```bash
    curl http://localhost:3000/api/env | jq .
    ```

## Views Management
- POST `/api/views/save`
  - Save a filter view configuration
  - Body:
    ```json
    { "name": "string",
      "filters": { "q": "string", "priority": ["h","m"], "owner": ["rj"] } }
    ```
  - Response: `{ ok: true, saved: {...} }`
  - Example:
    ```bash
    curl -s -X POST \
      -H 'Content-Type: application/json' \
      -d '{"name":"High Priority","filters":{"priority":["h"]}}' \
      http://localhost:3000/api/views/save | jq .
    ```

- GET `/api/views/get`
  - Retrieve saved filter views
  - Response: `{ views: [...] }`
  - Example:
    ```bash
    curl http://localhost:3000/api/views/get | jq .
    ```

## Billing
- POST `/api/billing/checkout`
  - Initialize Stripe checkout for Pro upgrade
  - Body: `{ "email": "user@example.com" }`
  - Response: `{ "url": "stripe_checkout_url" }`
  - Currently returns stub response

## Types (shape overview)
```ts
type Card = {
  id: string;
  title: string;
  desc?: string;
  owner?: string;
  priority?: 'l' | 'm' | 'h';
};

type Column = {
  id: string;   // slug identifier
  name: string; // display name
  cards: Card[];
};

type Board = {
  id: string;
  wipLimits?: Record<string, number>;
  columns: Column[];
};

type FilterView = {
  name: string;
  filters: {
    q: string;
    priority: string[];
    owner: string[];
  };
};
```

