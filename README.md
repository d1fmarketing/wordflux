# WordFlux Minimal — Planka + Chat

**Version**: 0.4.0-minimal  
**Status**: Production Ready  
**URL**: https://hewlett-influences-estate-insight.trycloudflare.com

## Overview

WordFlux Minimal is a streamlined application that combines a Planka board embed with an AI-powered chat assistant. The app provides a clean interface with Planka on the left and GPT-5 powered chat on the right for workflow management and task organization.

## Features

- **Planka Integration**: Embedded Planka board via iframe with HTTPS proxy support
- **AI Chat Assistant**: GPT-5 powered conversational interface for workflow guidance
- **Minimal Architecture**: Simplified codebase with only essential endpoints
- **Production Ready**: Stable deployment with PM2 process management

## API Endpoints

### Available
- `GET /api/health` - Health check endpoint
- `POST /api/chat` - AI chat interface
- `/planka/[[...path]]` - Proxy route for Planka (HTTPS-safe iframe)

### Removed (No longer in minimal mode)
- ~~`/api/board/*`~~ - Internal board operations
- ~~`/api/agent/*`~~ - Agent interpretation
- ~~`/api/admin/*`~~ - Admin endpoints

## Quick Start

### Prerequisites
- Node.js 22.19.0 or higher
- PM2 for process management
- OpenAI API key for chat functionality

### Installation

```bash
cd wordflux
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your configuration
```

### Environment Configuration

```bash
# Required
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5-mini  # or gpt-5-2025-08-07

# For Planka HTTPS embed
NEXT_PUBLIC_PLANKA_BASE_URL=https://your-planka.example.com

# For Planka HTTP (local/dev) with proxy
PLANKA_BASE_URL=http://localhost:3015
NEXT_PUBLIC_PLANKA_BASE_URL=/planka  # Uses same-origin proxy
PLANKA_PROXY_TIMEOUT_MS=10000        # Optional
```

### Running the Application

#### Development Mode
```bash
# Standard development
npm run dev

# Local mode (no external dependencies)
npm run dev:local

# HTTPS development
npm run dev:https
```

#### Production Mode
```bash
# Build the application
npm run build

# Start with PM2
pm2 start npm --name wordflux -- start

# Or direct start
npm start
```

### Public Access via Cloudflare Tunnel
```bash
# Start tunnel (URL changes each session)
cloudflared tunnel --url http://localhost:3000

# Or use PM2-managed tunnel
pm2 start cloudflared --name wordflux-tunnel -- tunnel --no-autoupdate --url http://localhost:3000
```

## Project Structure

```
wordflux/
├── app/
│   ├── api/           # Minimal API routes
│   │   ├── chat/      # AI chat endpoint
│   │   ├── health/    # Health check
│   │   └── planka/    # Planka proxy
│   ├── components/    # React components
│   │   ├── ChatPanel.jsx
│   │   ├── ChatInput.jsx
│   │   └── ErrorBoundary.jsx
│   └── lib/           # Utilities
├── public/            # Static assets
├── scripts/           # Utility scripts
├── tests/             # Test suites
└── _archive/          # Legacy code archive
```

## Testing

```bash
# Run API tests
npm run test:api

# Run UI tests
npm run test:ui

# Run all E2E tests
npm run test:e2e

# Lint and format
npm run lint
npm run format
```

## Process Management

```bash
# View processes
pm2 status

# View logs
pm2 logs wordflux --lines 50

# Restart application
pm2 restart wordflux --update-env

# Save PM2 configuration
pm2 save
```

## Monitoring

```bash
# Health check
curl -s http://localhost:3000/api/health | jq

# Test chat endpoint
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hello"}' | jq
```

## Migration from Full Version

This minimal version has removed the internal Kanban board implementation in favor of Planka embed. Legacy code has been archived in `_archive/` directory for reference.

### Key Changes
- Removed internal board APIs and database dependencies
- Simplified to chat + Planka embed only
- Reduced dependencies by ~60%
- Streamlined codebase for easier maintenance

## Tech Stack

- **Framework**: Next.js 14.2.5 (App Router)
- **UI**: React 18.3.1
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT-5
- **Deployment**: PM2 + Cloudflare Tunnel

## Support

For issues or questions, please check the CLAUDE.md file for detailed development guidance or create an issue in the repository.

## License

MIT

---

**Last Updated**: September 7, 2025