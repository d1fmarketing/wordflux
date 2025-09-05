# Changelog

All notable changes to this project are documented here.

## v0.3.4 – GPT-5 Integration Fixes & UX Improvements (September 2025)

### GPT-5 Fixes
- **Fixed SSL errors**: Changed internal API calls from HTTPS to HTTP (localhost:3000)
- **Fixed drag-and-drop glitch**: Cards no longer jump when dragged with filters active
  - Find cards by ID instead of filtered index
  - Map filtered indices to unfiltered positions correctly
  - Block same-column reordering when filters are active
- **Fixed version conflicts**: Proper board version tracking and conflict resolution
- **Fixed model configuration**: Using correct GPT-5 model names (gpt-5, gpt-5-mini, gpt-5-nano)
- **Fixed operations format**: Board operations now sent as arrays as expected by API

### Documentation
- **Created GPT5_SETUP.md**: Complete setup and troubleshooting guide for GPT-5
- **Updated all docs**: Corrected model information across README, API_DOCS, ARCHITECTURE

### UX Improvements Completed
- **Filter pills**: Active filters shown as dismissible pills with one-click clear
- **Quick priority chips**: Fast filtering with High/Medium/Low buttons
- **Select visible**: One-click to select all filtered cards for bulk operations
- **Keyboard navigation**: 
  - Tab to focus cards
  - Enter opens card inspector
  - Space toggles selection
  - Alt+Arrow moves cards between columns
  - Full ARIA support for screen readers
- **Undo system**: 5-second undo for delete/move operations with toast notifications
- **Visual polish**:
  - WIP badges with glow effect when at/over limit
  - Enhanced drop zone highlighting with gradient borders
  - Empty state messages with helpful prompts
  - Loading skeletons with smooth animations
  - Inline title editing on double-click
- **Saved views enhancement**:
  - View chips displayed as pills
  - One-click view deletion
  - Better visual organization
- **Performance optimizations**:
  - React.memo on Card and Column components
  - Optimized re-renders
  - Improved drag-and-drop performance

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

- v0.3.3 – Production Release (From Demo to Product)
  - Inline card creation with "Add card" button in each column
  - Column management (create/rename/delete columns)
  - Tightened AI responses (≤60 words, JSON-only actions)
  - Saved filter views with localStorage persistence
  - Pro monetization with gated Voice & Image features
  - Toast notifications via react-hot-toast
  - Component extraction (Column.jsx) for modularity
  - Mobile responsive with collapsible chat sidebar
  - Enhanced API operations: create_card, create_column
  - Comprehensive Puppeteer test suite
  - Screenshots for desktop/tablet/mobile viewports
