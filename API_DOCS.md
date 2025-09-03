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

## Chat (GPT‑5)
- POST `/api/chat`
  - Body:
    ```json
    { "message": "string", "board": { /* optional board override */ } }
    ```
  - Response:
    ```json
    { "response": "assistant text",
      "suggestions": [{ "type": "move" | "merge" | "wip", "text": "string" }],
      "model": "gpt-5" }
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
    - `add_card`: `{ columnId, title, desc?, owner?, priority?, id? }`
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
```

