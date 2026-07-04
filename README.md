# AI Personal Assistant — Frontend

React chat UI for the [AI Personal Assistant](https://github.com/nitintayal/ai-rag-agent) backend.

**Live:** [ai-rag-ui.vercel.app](https://ai-rag-ui.vercel.app)

## Features

- **Streaming chat** — real-time SSE token streaming (Safari/iOS falls back to non-streaming `/chat/sync`)
- **Multi-turn conversations** — context maintained, past chats in sidebar (desktop) or history drawer (mobile)
- **Chat history** — resume past conversations, delete old ones
- **Task manager** — create, complete, filter by status, priority badges, due dates, recurrence
- **Calendar** — event CRUD with all-day events, location, and recurrence
- **Journal** — CRUD with semantic search and pagination
- **Settings** — profile, password change, appearance toggle, AI model picker (provider/model + optional personal API key), push notification toggle
- **Push notifications** — Web Push via service worker, subscribe/unsubscribe in Settings
- **Dark mode** — system-aware with manual toggle, persisted in localStorage
- **Voice input** — browser Speech-to-Text, tap mic to dictate
- **Mobile PWA** — installable from browser, standalone mode, pull-to-refresh
- **File upload** — PDF, TXT, XLSX via `+` button in chat input
- **Authentication** — email/password + Google OAuth login
- **Timezone-aware** — browser timezone sent with each chat message for correct date handling
- **Responsive** — sidebar on desktop, bottom nav on mobile

## Tech Stack

React 19 / Vite / Tailwind CSS / react-markdown

## Setup

```bash
npm install
npm run dev
```

Set `VITE_API_BASE` for production (e.g. your Render URL). Defaults to `http://{current-hostname}:8000`.

Optional: `VITE_GOOGLE_CLIENT_ID` for Google OAuth button.

## Architecture

```
App (AuthProvider + ThemeProvider)
├── LoginPage (email/password + Google OAuth + forgot password)
└── AppContent (authenticated, pull-to-refresh on mobile)
    ├── Sidebar (desktop)
    │   ├── New Chat / Nav (Chat, Tasks, Calendar, Journal)
    │   ├── ChatHistory (recent conversations)
    │   └── User avatar → Settings
    ├── BottomNav (mobile) — Chat, Tasks, Calendar, Journal, Settings
    ├── Mobile history drawer (ChatHistory in a slide-over panel)
    └── Main Content
        ├── ChatWindow → InputBox (SSE + voice + upload + timezone)
        ├── TasksPanel (CRUD + filters + recurrence)
        ├── CalendarPanel (event CRUD + recurrence)
        ├── JournalPanel (CRUD + search + pagination)
        └── SettingsPanel (profile, password, AI model + API key, push, dark mode)
```

## API Endpoints

| Endpoint | Component | Purpose |
|----------|-----------|---------|
| `/auth/register` | LoginPage | Register |
| `/auth/login` | LoginPage | Login |
| `/auth/google` | App | Google OAuth |
| `/auth/verify-email` | LoginPage | Email verification |
| `/auth/forgot-password` | LoginPage | Request password reset |
| `/auth/me` | useAuth | Verify token |
| `/chat` | InputBox | SSE streaming chat |
| `/chat/sync` | InputBox | Non-streaming fallback (Safari/iOS) |
| `/conversations` | ChatHistory | List past chats |
| `/conversations/{id}/messages` | App | Load chat messages |
| `/conversations/{id}` | ChatHistory | Delete chat |
| `/upload` | InputBox | File upload |
| `/tasks` | TasksPanel | CRUD |
| `/tasks/send-reminders` | — | Backend reminder trigger (referenced in Settings; called manually or by a cron) |
| `/calendar/events` | CalendarPanel | Event CRUD |
| `/journal/entries` | JournalPanel | CRUD |
| `/journal/search` | JournalPanel | Search |
| `/auth/profile` | SettingsPanel | Update name |
| `/auth/change-password` | SettingsPanel | Change password |
| `/auth/llm-settings` | SettingsPanel | Save AI provider/model/API key |
| `/auth/llm-settings/available` | SettingsPanel | List available models |
| `/push/vapid-public-key` | usePushNotifications | Get VAPID key |
| `/push/subscribe` | usePushNotifications | Subscribe/unsubscribe push |
