# WordFlux - AI-Powered Board Organization Platform

## Current Status: v0.3.3 (Production Ready - September 2025)

### 🎯 Product Release
WordFlux has evolved from demo to production-ready product with inline card creation, column management, saved views, and Pro monetization features. Full GPT-5 integration with tightened AI responses (≤60 words).

## Live Demo
- **Public URL**: https://smithsonian-posing-interfaces-bias.trycloudflare.com
- **Status**: 100% functional with GPT-5 integration (model: `gpt-5-mini`)

## Features Working ✅
1. **GPT-5 Chat Controller** - Tightened AI responses (≤60 words), action-focused
2. **Inline Card Creation** - "Add card" button in each column footer
3. **Column Management** - Create, rename, and delete columns dynamically
4. **Saved Filter Views** - Save and load filter combinations
5. **Pro Monetization** - Voice & Image features gated with upgrade prompt
6. **Campaign Generator** - Creates complete marketing campaigns
7. **Board Management** - Multiple boards with localStorage persistence
8. **Card Operations** - Move, edit, delete with toast notifications
9. **WhatsApp Sharing** - Share board summaries
10. **Activity History** - Track all board changes
11. **CSV Export** - Export board data
12. **Mobile Responsive** - Collapsible chat sidebar with FAB toggle

## Quick Start

```bash
cd wordflux
npm install

# Set up environment variables
echo "OPENAI_API_KEY=your_key_here" > .env.local
echo "OPENAI_MODEL=gpt-5-mini" >> .env.local

# Build and start
npm run build
pm2 start npm --name wordflux -- start

# For public access
cloudflared tunnel --url http://localhost:3000
```

## GPT-5 Documentation
See [GPT5_SETUP.md](./GPT5_SETUP.md) for detailed setup, troubleshooting, and best practices.

## The 4-Day Debugging Journey

### Development Timeline

#### v0.2.x: Foundation (Days 1-3)
- Implemented Kanban board with drag-drop
- Integrated GPT-5 API (model: gpt-5-mini)
- Added campaign generator
- Built chat controller
- Multiple board support

#### Critical JavaScript Crisis (Days 4-5)
**Problem**: "Invalid or unexpected token" - ALL JavaScript broken on deployment
**Solution**: Separated ALL JavaScript into `/public/wordflux-client.js`

#### v0.3.3: Product Release (Day 6)
- **Inline Card Creation**: Add cards directly from column footers
- **Column Management**: Dynamic column operations (add/rename/delete)
- **Saved Views**: Filter persistence with localStorage
- **Pro Features**: Monetization with gated Voice & Image features
- **Toast Notifications**: User feedback via react-hot-toast
- **Component Architecture**: Extracted Column component for modularity
- **AI Tightening**: Responses limited to ≤60 words, JSON-only actions

## Environment Variables

```env
OPENAI_API_KEY=your_api_key_here    # Required
OPENAI_MODEL=gpt-5-2025-08-07       # GPT-5 model ID
PORT=3003                            # Server port
```

## Project Structure

```
wordflux/
├── app/
│   ├── page.js              # Main app with Toaster & Pro features
│   ├── components/
│   │   ├── Board.jsx        # Board container with SWR
│   │   ├── Column.jsx       # Column component with inline add
│   │   ├── Card.jsx         # Card with edit/delete
│   │   ├── FilterBar.jsx    # Filters with saved views
│   │   ├── ChatPanel.jsx    # AI chat interface
│   │   └── UpgradePrompt.jsx # Pro monetization modal
│   ├── api/
│   │   ├── ai/              # Tightened GPT-5 (≤60 words)
│   │   ├── board/           # Enhanced board operations
│   │   │   └── apply/       # New ops: create_card, create_column
│   │   ├── views/           # Save/load filter views
│   │   └── billing/         # Stripe checkout (stub)
│   └── lib/
│       └── board.js         # Board utilities
├── public/
│   └── wordflux-client.js   # Legacy client JS (SSR fix)
├── test-product.js          # v0.3.3 feature tests
├── test-final.js            # Legacy test suite
└── ecosystem.config.cjs     # PM2 configuration
```

## Testing

### v0.3.3 Product Tests
```bash
node test-product.js
```

Test coverage:
- ✅ Filters and search
- ✅ Saved views
- ✅ Inline card creation (3 buttons)
- ✅ Column management
- ✅ Chat integration
- ✅ Pro features gate (Voice with PRO badge)
- ✅ Toast notifications
- ✅ Mobile responsive (chat toggle FAB)
- ✅ Screenshots: desktop, tablet, mobile

### Legacy Tests
```bash
node test-final.js
```

Current score: **100% FUNCTIONAL**

## Deployment Methods Attempted

### 1. Netlify ❌
- **Issue**: Next.js API routes return 404
- **Root Cause**: Incompatibility with Next.js App Router
- **Status**: Abandoned

### 2. Cloudflare Tunnel ✅ 
- **Working**: Full functionality with public URL
- **Command**: `cloudflared tunnel --url http://localhost:3000`
- **URL**: Changes each session (e.g., smithsonian-posing-interfaces-bias.trycloudflare.com)

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **AI Model**: GPT-5 (gpt-5-2025-08-07)  
- **Deployment**: PM2 + Cloudflare Tunnel
- **Storage**: localStorage (client-side)
- **Testing**: Puppeteer
- **Node**: v22.19.0

## Key Files Explained

### `/public/wordflux-client.js`
The most critical file - contains ALL client-side JavaScript logic separated from SSR to avoid corruption. This separation fixed the "Invalid or unexpected token" errors.

### `/app/page.js`
Main application component with SSR. Passes initial board data via `window.__WF_INITIAL_BOARD`.

### `/test-final.js`  
Puppeteer test suite that validates all functionality. Run this to verify the platform is working.

## PM2 Process Management

```bash
# Start
pm2 start npm --name wordflux -- start

# Monitor
pm2 logs wordflux
pm2 status

# Restart after changes
pm2 restart wordflux
```

## API Enhancements (v0.3.3)

### New Operations in `/api/board/apply`
- `create_card`: Add card inline with `{ columnId, title, description, owner, priority }`
- `create_column`: Add new column with `{ name }`
- `rename_column`: Rename existing column
- `delete_column`: Remove column and its cards

### New Endpoints
- `POST /api/views/save`: Save filter view
- `GET /api/views/get`: Load saved views
- `POST /api/ai`: Tightened AI with JSON schema responses
- `POST /api/billing/checkout`: Stripe integration (Pro upgrade)

## Next Steps (Roadmap)

### Immediate (After PR)
1. **Realtime Voice**: Function-calling for Voice sessions
2. **Usage Metering**: 100 free actions, Pro = unlimited
3. **Multi-board Sharing**: Board permissions and collaboration

### Future
1. **Database**: PostgreSQL with Prisma ORM
2. **Authentication**: NextAuth.js with social logins
3. **Real-time**: Socket.io for live collaboration
4. **Mobile App**: React Native with shared components
5. **Enterprise**: SSO, audit logs, compliance

## Lessons Learned

1. **Next.js SSR can corrupt inline JavaScript** - Always separate client code
2. **Test with automation** - Puppeteer caught issues manual testing missed
3. **GPT-5 is powerful** - The AI integration transforms the UX
4. **Persistence matters** - Users frustrated when work is lost
5. **Deployment complexity** - What works locally may break in production

## Credits

Built with extreme frustration and persistence by **RJ** over 4-5 days of intensive debugging.

Special recognition for finally solving the SSR JavaScript corruption issue that was breaking everything.

## License

MIT

---

**Version**: 0.3.3 (September 2025)  
**Status**: Production Ready - Full Product Release  
**Note**: Evolved from demo to monetizable product with Pro features
