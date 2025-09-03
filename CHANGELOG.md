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
