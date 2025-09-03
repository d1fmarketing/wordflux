# Changelog

All notable changes to this project are documented here.

- v0.2.0 – First working GPT-5 MVP
  - Chat endpoint wired to OpenAI Chat Completions
  - Server-rendered board with sample columns/cards
  - Basic suggestion extraction (move/merge/wip)

- v0.2.1 – Board persistence (localStorage)
  - Load board from localStorage first, fallback to SSR/API
  - Auto-save to localStorage after card moves
  - Optimistic UI updates; no page reload on move

- v0.2.2 – Actionable GPT-5 suggestions
  - Parse assistant replies for actions (move, set WIP, merge)
  - Render inline “Apply” buttons after AI messages
  - Execute actions with optimistic updates and persistence

- v0.2.3 – Card quick edit (inline)
  - Double-click card title to edit inline
  - Enter or click outside saves; Escape cancels
  - Immediate localStorage save + server sync

- v0.2.4 – Export board to CSV
  - Added "Export CSV" button in header
  - CSV includes metadata rows and all cards
  - Filename: wordflux-board-YYYY-MM-DD-HHmm.csv

- v0.2.5 – Activity history (last 20)
  - Tracks moves, edits, AI applies, and exports
  - Stores in localStorage at `wf.history`
  - Collapsible history panel in chat sidebar

- v0.3.0 – GPT-5 Campaign Generator
  - Prominent "Generate Campaign" button + modal form
  - Sends structured prompt to GPT-5 and parses JSON plan
  - Auto-creates phase columns and task cards with deadlines, owners
  - Optimistic board updates + background API sync

- v0.3.1 – Multiple boards
  - Board selector with create-new and index display
  - Per-board storage keys and history
  - Export filenames include board name

- v0.3.2 – WhatsApp share
  - One-click share to WhatsApp with board summary
  - Includes last 3 recent activities
  - Works per selected board
