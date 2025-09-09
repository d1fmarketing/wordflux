WordFlux Minimal API

This build exposes a minimal set of endpoints.

Base URL: http://localhost:3000 (or your public tunnel/domain)

Endpoints
- GET /api/health
  - 200 OK
  - { ok: true, status: "healthy", version: "0.4.0-minimal", features: ["planka-embed","chat"], timestamp }

- POST /api/chat
  - Body: { message: string }
  - 200 OK: { response: string, suggestions?: array, model?: string }
  - 500 on OpenAI errors (set ENABLE_TEST_ENDPOINTS=1 to stub response)

- /planka/[[...path]]
  - Same-origin proxy to PLANKA_BASE_URL (for HTTPS-safe iframe embedding)
  - Forwards headers, rewrites Set-Cookie/Location/HTML base URLs
  - Timeout: PLANKA_PROXY_TIMEOUT_MS (default 10000)

Environment Variables
- NEXT_PUBLIC_PLANKA_BASE_URL
  - If HTTPS Planka: https://your-planka.example.com
  - If HTTP Planka: set to /planka (uses same-origin proxy)
- PLANKA_BASE_URL (required when using /planka proxy)
  - e.g., http://localhost:3015
- PLANKA_PROXY_TIMEOUT_MS (optional)
  - Default: 10000
- OPENAI_API_KEY (for /api/chat)
- ENABLE_TEST_ENDPOINTS=1 (optional, returns stubbed chat response)

Notes
- All former internal board endpoints are removed in this build (no /api/board/*).
- Legacy docs/tests referring to the internal board are out of scope in minimal mode.

