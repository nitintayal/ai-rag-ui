# CLAUDE.md — AI Agent Context

## What This Is

React frontend for the AI Personal Assistant. Chat with streaming, tasks, calendar, journal, settings (incl. AI model + personal API key), dark mode, voice input, Web Push notifications, pull-to-refresh, PWA-installable.

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
public/
├── sw.js                 # Service worker: network-first caching + push notification display/click
└── manifest.json         # PWA manifest

src/
├── main.jsx              # Root: ThemeProvider → App
├── App.jsx               # AuthProvider → routing by activeView state + mobile history drawer + pull-to-refresh
├── config.js             # API_BASE (auto-detects hostname)
├── api.js                # authHeaders() + authFetch() (dispatches "auth:401" event on 401)
├── hooks/
│   ├── useAuth.jsx       # Auth context: login, register, google, logout, token
│   ├── useTheme.jsx      # Dark mode context: toggle, localStorage persistence
│   ├── useVoice.jsx      # Speech-to-text: start, stop, listening state
│   ├── usePushNotifications.js  # Web Push: SW registration, VAPID subscribe/unsubscribe
│   └── usePullToRefresh.js      # Mobile pull-to-refresh gesture
└── components/
    ├── LoginPage.jsx     # Email/password + Google OAuth + forgot password + email verification
    ├── ChatWindow.jsx    # Message list + auto-scroll + loaded messages
    ├── InputBox.jsx      # Text input + send + upload (+) + voice mic + timezone in payload
    ├── Message.jsx       # Bubble (user/agent) + markdown + sources
    ├── ChatHistory.jsx   # Past conversations list (sidebar on desktop, drawer on mobile)
    ├── TasksPanel.jsx    # CRUD + status filters + priority badges + recurrence
    ├── CalendarPanel.jsx # Event CRUD + all-day + recurrence
    ├── JournalPanel.jsx  # CRUD + semantic search + pagination
    ├── SettingsPanel.jsx # Profile + password + AI model/API key + push toggle + dark mode
    ├── Sidebar.jsx       # Desktop nav + chat history + user avatar
    └── BottomNav.jsx     # Mobile nav
```

## Key Patterns

- **No React Router**: View switching via `activeView` state in App.jsx. Values: `chat`, `tasks`, `journal`, `calendar`, `settings`.
- **Auth**: `useAuth()` hook provides `user`, `token`, `login()`, `logout()`, etc. Token + user cached in localStorage. No `/auth/me` call on refresh (prevents flash).
- **API calls**: Every component receives `token` as prop → builds headers with `Authorization: Bearer ${token}`. Use `getHeaders()` function (not a static object) to avoid stale closures. `src/api.js::authFetch()` wraps fetch and fires an `auth:401` window event on 401 so the app can log out.
- **SSE streaming**: `InputBox.jsx` reads `fetch()` response as a `ReadableStream`, parses `data: {"token": "..."}` lines, updates message state incrementally. On Safari/iOS (unreliable streaming) it falls back to non-streaming `POST /chat/sync`.
- **Timezone**: chat payloads include `timezone: Intl.DateTimeFormat().resolvedOptions().timeZone` so the backend can build date context in the user's local time.
- **Push notifications**: `usePushNotifications(token)` registers `public/sw.js`, fetches the VAPID public key from `/push/vapid-public-key`, and subscribes via `/push/subscribe`. Toggle lives in SettingsPanel. `sw.js` shows notifications on `push` events and focuses/opens the app on click.
- **Pull-to-refresh**: `usePullToRefresh` (touch-based) in AppContent, with a visual indicator — mobile/PWA only.
- **Mobile chat history**: `ChatHistory` renders in the desktop Sidebar and in a slide-over drawer on mobile (`showHistoryDrawer` state in App.jsx).
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
