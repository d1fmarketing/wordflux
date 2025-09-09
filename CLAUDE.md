# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
WordFlux is a Kanban board application with AI-powered chat, currently operating in **Minimal Mode** (v0.4.0-minimal). The app embeds a Planka board via iframe on the left side and provides a GPT-powered chat panel on the right.

**Current Mode**: Minimal - Internal board APIs removed, using Planka embed instead
**Production URL**: https://hewlett-influences-estate-insight.trycloudflare.com
**Local URL**: http://localhost:3000

## Architecture

### Tech Stack
- **Framework**: Next.js 14.2.5 (App Router), React 18.3
- **Styling**: Tailwind CSS with CSS variables
- **AI Integration**: OpenAI GPT-5 (gpt-5-mini model)
- **Board**: Planka (embedded via iframe with proxy)
- **State Management**: SWR for data fetching
- **Deployment**: PM2 process manager, Cloudflare Tunnel
- **Testing**: Playwright E2E tests, custom test agents

### Key Directories
```
/home/ubuntu/wordflux/
├── app/                 # Next.js app directory
│   ├── components/      # React components (ChatPanel, Board embed)
│   ├── api/            # API routes
│   │   ├── chat/       # AI chat endpoint
│   │   ├── health/     # Health check
│   │   └── planka/     # Planka proxy route
│   └── lib/            # Utilities and hooks
├── agents/             # Automated testing and deployment
├── tests/              # Playwright test suites
├── scripts/            # Utility scripts (seed, probe, validate)
├── public/             # Static assets
└── .next/              # Build output
```

## Common Commands

### Development
```bash
# Start development server (requires OpenAI key)
npm run dev

# Start with in-memory board + stubbed chat (no external deps)
npm run dev:local

# Start with HTTPS (uses self-signed cert)
npm run dev:https
```

### Building & Deployment
```bash
# Build for production
npm run build

# Start production server
npm start
# or with PM2
pm2 start npm --name wordflux -- start

# Restart after changes
pm2 restart wordflux --update-env

# Deploy with agent (includes all checks)
node agents/deploy-agent.cjs production
```

### Testing
```bash
# Lint and typecheck (ALWAYS run before committing)
npm run lint
npm run format

# Run API regression tests
npm run test:api

# Run UI tests
npm run test:ui

# Run E2E tests
npm run test:e2e

# Run comprehensive test with agent
node agents/test-agent.cjs --local
```

### Monitoring
```bash
# Check health
curl -s http://localhost:3000/api/health | jq

# PM2 status
pm2 status
pm2 logs wordflux --lines 50

# Monitor with agent
node agents/monitor-agent.cjs --once
```

### Planka Operations
```bash
# Seed Planka board (if using Planka adapter)
npm run seed:planka

# Verify Planka connection
npm run planka:verify

# Run Planka self-test
npm run planka:selftest
```

## API Endpoints (Minimal Mode)

### Available Endpoints
- `GET /api/health` - Returns `{ ok, status, version: "0.4.0-minimal", features: ["planka-embed","chat"] }`
- `POST /api/chat` - Chat with AI, returns `{ response, suggestions?, model? }`
- `/planka/[[...path]]` - Proxy to Planka instance (for HTTPS-safe iframe)

### Removed Endpoints (No longer exist in minimal mode)
- ~~`/api/board/*`~~ (get/apply/move/seed)
- ~~`/api/agent/interpret`~~
- ~~Admin adapter/verify endpoints~~

## Environment Configuration

### Required Variables
```bash
# OpenAI Configuration
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5-mini  # or gpt-5-2025-08-07

# For Planka HTTPS embed
NEXT_PUBLIC_PLANKA_BASE_URL=https://your-planka.example.com

# For Planka HTTP (dev/local) with proxy
PLANKA_BASE_URL=http://localhost:3015
NEXT_PUBLIC_PLANKA_BASE_URL=/planka  # Uses same-origin proxy
PLANKA_PROXY_TIMEOUT_MS=10000        # Optional
```

### Optional Variables
```bash
# Testing mode (stubbed responses)
ENABLE_TEST_ENDPOINTS=1

# In-memory board (no AWS needed)
TEST_INMEMORY=1

# Lite UI mode (hides extras)
NEXT_PUBLIC_LITE_UI=1

# Force grid view instead of iframe
NEXT_PUBLIC_FORCE_GRID=1

# Toast notification duration
NEXT_PUBLIC_TOAST_DURATION_MS=5000
```

## High-Level Architecture

### Frontend Flow
1. **Main Page** (`app/page.js`): Renders Planka iframe + ChatPanel side-by-side
2. **Chat Integration**: ChatPanel sends messages to `/api/chat` endpoint
3. **Planka Embed**: Uses iframe with proxy route for HTTP→HTTPS compatibility
4. **State Management**: SWR for data fetching with proper cache invalidation

### Backend Flow
1. **Chat API** (`app/api/chat/route.js`): Processes messages through OpenAI
2. **Health Check** (`app/api/health/route.js`): Returns system status
3. **Planka Proxy** (`app/api/planka/[[...path]]/route.js`): Proxies requests to Planka instance
4. **Error Handling**: Consistent error envelope `{ error, details }`

### Testing Infrastructure
1. **Test Agent** (`agents/test-agent.cjs`): Comprehensive test runner
2. **Deploy Agent** (`agents/deploy-agent.cjs`): Build and deployment pipeline
3. **Monitor Agent** (`agents/monitor-agent.cjs`): Health monitoring
4. **Orchestrator** (`agents/orchestrator.cjs`): Coordinates multiple agents

## Important Patterns

### Error Handling
All API routes should return consistent error format:
```javascript
return NextResponse.json(
  { error: 'Error message', details: additionalInfo },
  { status: 400 }
);
```

### Chat Response Format
AI responses should follow this structure:
```javascript
{
  response: "AI message here",
  suggestions: ["suggestion1", "suggestion2"],  // Optional
  model: "gpt-5-mini"  // Optional
}
```

### Testing Pattern
Always test in this order:
1. Run lint and format checks
2. Test locally with `npm run dev:local`
3. Run API tests with `npm run test:api`
4. Run UI tests with `npm run test:ui`
5. Deploy with agent verification

## Migration Notes

### From Full Board to Minimal Mode
The project transitioned from internal board implementation to Planka embed:
- **Before**: Full internal Kanban with DynamoDB, drag-drop, etc.
- **After**: Planka iframe + Chat panel only
- **Reason**: Simplification and leveraging existing Planka functionality

### Legacy Code
- `tests/` directory contains some tests for removed board APIs - ignore these in minimal mode
- `docs/` may reference removed functionality
- Many test files (test-*.js) in root are for legacy board features

## Development Best Practices

### When Making Changes
1. Understand current mode (Minimal vs Full)
2. Check if functionality still exists before modifying
3. Run lint before committing: `npm run lint`
4. Test both local and production modes
5. Use agents for deployment, not manual commands

### Code Style
- Use existing patterns in codebase
- Prefer functional components with hooks
- Use TypeScript types where available
- Handle errors gracefully with try-catch
- Keep AI responses concise (≤60 words for actions)

### Testing Requirements
- Always include error cases in tests
- Test both success and failure paths  
- Use Playwright for UI testing
- Mock external services in tests when possible

## Debugging Tips

### Common Issues
1. **"Cannot find module"**: Run `npm install`
2. **Port already in use**: Check PM2 processes with `pm2 status`
3. **Planka connection fails**: Verify PLANKA_BASE_URL is correct
4. **Chat not working**: Check OPENAI_API_KEY is set
5. **HTTPS issues**: Use proxy mode for HTTP Planka instances

### Useful Debug Commands
```bash
# Check environment variables
env | grep -E "PLANKA|OPENAI|NEXT_PUBLIC"

# Test chat endpoint
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hello"}'

# Check PM2 logs for errors
pm2 logs wordflux --err --lines 100

# Kill all PM2 processes and restart
pm2 kill && pm2 start ecosystem.config.cjs
```

## Process Management

### PM2 Ecosystem Files
- `ecosystem.config.cjs` - Main production config
- `ecosystem.canary.cjs` - Canary deployment config  
- `ecosystem.probe.cjs` - Health probe config

### PM2 Commands
```bash
# Start all processes
pm2 start ecosystem.config.cjs

# View status
pm2 status

# Monitor resources
pm2 monit

# Restart specific process
pm2 restart wordflux

# Stop all
pm2 stop all

# Delete process
pm2 delete wordflux
```

## Quick Reference

### File Locations
- Main app: `app/page.js`
- Chat component: `app/components/ChatPanel.jsx`
- Chat API: `app/api/chat/route.js`
- Health check: `app/api/health/route.js`
- Environment: `.env.local`
- PM2 config: `ecosystem.config.cjs`

### Key Dependencies
- Next.js 14.2.5
- React 18.3.1
- OpenAI SDK (via API)
- Tailwind CSS
- SWR for data fetching
- Playwright for testing

### External Services
- OpenAI API (GPT-5)
- Planka (if configured)
- Cloudflare Tunnel (for public access)
- AWS DynamoDB (legacy, not used in minimal mode)

---
*Last updated: September 7, 2025 - Minimal Mode v0.4.0*