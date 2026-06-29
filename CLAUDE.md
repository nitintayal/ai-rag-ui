# CLAUDE.md — AI Agent Context

## What This Is

React frontend for the AI Personal Assistant. Chat with streaming, tasks, journal, settings, dark mode, voice input, PWA-installable.

## How to Run

```bash
npm install
npm run dev       # dev server at localhost:5173
npm run build     # production build → dist/
```

## Tech Stack

React 19 / Vite / Tailwind CSS / react-markdown

## Project Layout

```
src/
├── main.jsx              # Root: ThemeProvider → App
├── App.jsx               # AuthProvider → routing by activeView state
├── config.js             # API_BASE (auto-detects hostname)
├── api.js                # Auth headers helper
├── hooks/
│   ├── useAuth.jsx       # Auth context: login, register, google, logout, token
│   ├── useTheme.jsx      # Dark mode context: toggle, localStorage persistence
│   └── useVoice.jsx      # Speech-to-text: start, stop, listening state
└── components/
    ├── LoginPage.jsx     # Email/password + Google OAuth + forgot password
    ├── ChatWindow.jsx    # Message list + auto-scroll + loaded messages
    ├── InputBox.jsx      # Text input + send + upload (+) + voice mic
    ├── Message.jsx       # Bubble (user/agent) + markdown + sources
    ├── ChatHistory.jsx   # Sidebar list of past conversations
    ├── TasksPanel.jsx    # CRUD + status filters + priority badges
    ├── JournalPanel.jsx  # CRUD + semantic search + pagination
    ├── SettingsPanel.jsx # Profile + password + dark mode toggle
    ├── Sidebar.jsx       # Desktop nav + chat history + user avatar
    ├── BottomNav.jsx     # Mobile nav + dark mode toggle
    └── FileUpload.jsx    # (unused — upload moved to InputBox)
```

## Key Patterns

- **No React Router**: View switching via `activeView` state in App.jsx. Values: `chat`, `tasks`, `journal`, `settings`.
- **Auth**: `useAuth()` hook provides `user`, `token`, `login()`, `logout()`, etc. Token + user cached in localStorage. No `/auth/me` call on refresh (prevents flash).
- **API calls**: Every component receives `token` as prop → builds headers with `Authorization: Bearer ${token}`. Use `getHeaders()` function (not a static object) to avoid stale closures.
- **SSE streaming**: `InputBox.jsx` reads `fetch()` response as a `ReadableStream`, parses `data: {"token": "..."}` lines, updates message state incrementally.
- **Dark mode**: `darkMode: "class"` in Tailwind config. `useTheme()` toggles `dark` class on `<html>`. All components use `dark:` variants.
- **Google OAuth redirect**: App.jsx detects `#id_token=...` in URL hash on load, calls `/auth/google`, clears hash.

## Environment Variables

```
VITE_API_BASE=https://your-backend.onrender.com   # API URL (strips trailing slash)
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com  # optional, enables Google login button
```

## Adding a New Panel/View

1. Create `src/components/MyPanel.jsx`
2. Import in `App.jsx`, add `{activeView === "myview" && <MyPanel token={token} />}`
3. Add button in `Sidebar.jsx` and `BottomNav.jsx` with `setActiveView("myview")`

## Common Issues

- **Stale auth headers**: Use `getHeaders()` function, not a `const hdrs = ...` at component top level
- **useEffect fires before token**: Add `token` to dependency array, guard with `if (!token) return`
- **Google login flash**: `processingAuth` state initializes synchronously from URL hash — no login page flicker
- **Build fails**: Check Tailwind `dark:` classes aren't malformed — every `dark:` must have a light counterpart
