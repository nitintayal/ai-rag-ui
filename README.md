# AI Personal Assistant — Frontend

React chat UI for the [AI Personal Assistant](https://github.com/nitintayal/ai-rag-agent) backend.

**Live:** [ai-rag-ui.vercel.app](https://ai-rag-ui.vercel.app)

## Features

- **Streaming chat** — real-time SSE token streaming
- **Multi-turn conversations** — context maintained, past chats in sidebar
- **Chat history** — resume past conversations, delete old ones
- **Task manager** — create, complete, filter by status, priority badges
- **Journal** — CRUD with semantic search and pagination
- **Settings** — profile, password change, appearance toggle
- **Dark mode** — system-aware with manual toggle, persisted in localStorage
- **Voice input** — browser Speech-to-Text, tap mic to dictate
- **Mobile PWA** — installable from browser, standalone mode
- **File upload** — PDF, TXT, XLSX via `+` button in chat input
- **Authentication** — email/password + Google OAuth login
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
└── AppContent (authenticated)
    ├── Sidebar (desktop)
    │   ├── New Chat / Nav (Chat, Tasks, Journal)
    │   ├── ChatHistory (recent conversations)
    │   └── User avatar → Settings
    ├── BottomNav (mobile) — Chat, Tasks, Journal, Settings, Dark toggle
    └── Main Content
        ├── ChatWindow → InputBox (SSE + voice + upload)
        ├── TasksPanel (CRUD + filters)
        ├── JournalPanel (CRUD + search + pagination)
        └── SettingsPanel (profile, password, dark mode)
```

## API Endpoints

| Endpoint | Component | Purpose |
|----------|-----------|---------|
| `/auth/register` | LoginPage | Register |
| `/auth/login` | LoginPage | Login |
| `/auth/google` | App | Google OAuth |
| `/auth/me` | useAuth | Verify token |
| `/chat` | InputBox | SSE streaming chat |
| `/conversations` | ChatHistory | List past chats |
| `/conversations/{id}/messages` | App | Load chat messages |
| `/conversations/{id}` | ChatHistory | Delete chat |
| `/upload` | InputBox | File upload |
| `/tasks` | TasksPanel | CRUD |
| `/journal/entries` | JournalPanel | CRUD |
| `/journal/search` | JournalPanel | Search |
| `/auth/profile` | SettingsPanel | Update name |
| `/auth/change-password` | SettingsPanel | Change password |
