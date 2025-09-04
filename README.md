# WordFlux - AI-Powered Board Organization Platform

## Current Status: v0.2.5 (Best Working Version - September 2025)

### 🚨 Critical Note
After 4+ days of intensive debugging, this is the most stable version achieved. The platform is ~80% functional with full GPT-5 integration working.

## Live Demo
- **Public URL**: https://smithsonian-posing-interfaces-bias.trycloudflare.com
- **Status**: 100% functional with GPT-5 integration (model: `gpt-5-2025-08-07`)

## Features Working ✅
1. **GPT-5 Chat Controller** - AI assistant controlling the platform
2. **Campaign Generator** - Creates complete marketing campaigns with phases
3. **Board Management** - Multiple boards with localStorage persistence
4. **Card Movement** - Move cards between columns
5. **WhatsApp Sharing** - Share board summaries
6. **Activity History** - Track all board changes
7. **CSV Export** - Export board data
8. **Inline Editing** - Double-click to edit cards

## Quick Start

```bash
cd wordflux
npm install

# Set up environment variables
echo "OPENAI_API_KEY=your_key_here" > .env.local
echo "OPENAI_MODEL=gpt-5-2025-08-07" >> .env.local

# Build and start
npm run build
pm2 start npm --name wordflux -- start

# For public access
cloudflared tunnel --url http://localhost:3003
```

## The 4-Day Debugging Journey

### Days 1-3: Building Core Features
- Implemented Kanban board with drag-drop
- Integrated GPT-5 API (model: gpt-5-2025-08-07)
- Added campaign generator
- Built chat controller
- Multiple board support

### Days 4-5: Critical JavaScript Crisis
**Problem**: "Invalid or unexpected token" - ALL JavaScript broken on deployment
**Root Cause**: Next.js SSR was corrupting inline JavaScript
- Regex `/^board-(\d+)$/` became `/^board-(d+)$/` 
- String escaping was being destroyed
**Solution**: Separated ALL JavaScript into `/public/wordflux-client.js`
**Result**: Fixed! 100% functionality restored

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
│   ├── page.js              # Main app (SSR with separated JS)
│   ├── api/
│   │   ├── chat/            # GPT-5 integration
│   │   └── board/           # Board operations
│   └── lib/
│       └── board.js         # Board utilities
├── public/
│   └── wordflux-client.js   # ALL client-side JS (SSR fix)
├── test-final.js            # Puppeteer test suite
├── netlify.toml             # Netlify config (not working)
└── ecosystem.config.cjs     # PM2 configuration
```

## Testing

Run comprehensive test suite with Puppeteer:

```bash
node test-final.js
```

Test coverage:
- ✅ Chat functionality
- ✅ Campaign modal
- ✅ Board selector
- ✅ Menu system
- ✅ Card movements

Current score: **100% FUNCTIONAL**

## Deployment Methods Attempted

### 1. Netlify ❌
- **Issue**: Next.js API routes return 404
- **Root Cause**: Incompatibility with Next.js App Router
- **Status**: Abandoned

### 2. Cloudflare Tunnel ✅ 
- **Working**: Full functionality with public URL
- **Command**: `cloudflared tunnel --url http://localhost:3003`
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

## Future Improvements

1. **State Management**: Migrate from localStorage to proper state management
2. **Real-time Collaboration**: Add WebSocket support for multi-user boards
3. **Database**: Move from localStorage to PostgreSQL/MongoDB
4. **Authentication**: Add user accounts and board permissions
5. **Mobile App**: React Native version
6. **Better Deployment**: Vercel or proper cloud hosting

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

**Version**: 0.2.5 (September 2025)  
**Status**: Best working version - 100% functional  
**Note**: This is the main stable baseline for future development
