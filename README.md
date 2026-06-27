# AI Personal Assistant — Frontend

React chat UI for the AI Personal Assistant backend. Features streaming chat, task management, journal with semantic search, and document upload.

## Features

- **Streaming chat** — real-time token-by-token responses via Server-Sent Events (SSE)
- **Multi-turn conversations** — context maintained across messages via `conversation_id`
- **Task manager** — create, complete, filter by status, prioritize, and delete tasks
- **Journal** — create, edit, delete, search (semantic), and paginate journal entries
- **Document upload** — PDF, TXT, XLSX file ingestion into the knowledge base
- **Markdown rendering** — formatted AI responses with react-markdown
- **Source citations** — clickable source links (documents and URLs) on AI responses
- **Responsive layout** — collapsible sidebar, mobile-friendly design

## Tech Stack

- **React 19** — functional components with hooks
- **Vite** — build tool and dev server
- **Tailwind CSS** — utility-first styling
- **react-markdown** — markdown rendering for AI responses
- **Fetch API** — SSE streaming via ReadableStream

## Project Structure

```
src/
├── main.jsx                    # React root
├── App.jsx                     # Root component, view switching, conversation state
├── index.css                   # Tailwind directives
└── components/
    ├── ChatWindow.jsx          # Chat container, message list, auto-scroll
    ├── InputBox.jsx            # Chat input, SSE streaming handler, source parsing
    ├── Message.jsx             # Message bubble, markdown, source links
    ├── Sidebar.jsx             # Navigation (Chat, Tasks, Journal), file upload
    ├── FileUpload.jsx          # Document upload widget
    ├── TasksPanel.jsx          # Task CRUD, status filters, priority badges
    └── JournalPanel.jsx        # Journal CRUD, semantic search, pagination
```

## Component Architecture

```
App (state: activeView, conversationId)
├── Sidebar
│   ├── New Chat button
│   ├── FileUpload (PDF/TXT/XLSX)
│   └── Nav: Chat | Tasks | Journal
│
└── Main Content (conditional render)
    ├── ChatWindow (activeView === "chat")
    │   ├── Message[] (user: green, agent: white+border)
    │   │   ├── ReactMarkdown
    │   │   └── Source pills (clickable links)
    │   ├── Typing indicator (animated dots)
    │   └── InputBox
    │       └── SSE stream → parse tokens → update messages
    │
    ├── TasksPanel (activeView === "tasks")
    │   ├── Status filters (All, Pending, In Progress, Done)
    │   ├── New task form (title, description, due date, priority)
    │   └── Task cards (checkbox toggle, priority badge, delete)
    │
    └── JournalPanel (activeView === "journal")
        ├── Semantic search bar
        ├── New/edit entry form (title, mood, content)
        ├── Entry cards (edit, delete)
        └── Pagination (load more)
```

## Setup

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. Requires the backend running at `http://localhost:8000`.

## API Integration

All API calls target `http://localhost:8000`. The SSE chat endpoint returns `data: {token}` events for real-time streaming.

| Endpoint | Method | Component | Purpose |
|----------|--------|-----------|---------|
| `/chat` | POST | InputBox | SSE streaming chat with `{question, user_id, conversation_id}` |
| `/upload` | POST | FileUpload | Upload PDF/TXT/XLSX documents |
| `/tasks` | GET | TasksPanel | List tasks with optional status filter |
| `/tasks` | POST | TasksPanel | Create task with `{title, description, due_date, priority}` |
| `/tasks/{id}` | PATCH | TasksPanel | Update task status/priority |
| `/tasks/{id}` | DELETE | TasksPanel | Delete a task |
| `/journal/entries` | GET | JournalPanel | List entries with pagination |
| `/journal/entries` | POST | JournalPanel | Create journal entry |
| `/journal/entries/{id}` | PATCH | JournalPanel | Update an entry |
| `/journal/entries/{id}` | DELETE | JournalPanel | Delete an entry |
| `/journal/search` | POST | JournalPanel | Semantic search with `{user_id, query, k}` |

## SSE Streaming Format

The `/chat` endpoint returns Server-Sent Events:

```
data: {"token": "Hello"}
data: {"token": " world"}
data: {"token": "!"}
data: {"done": true, "conversation_id": "uuid-here"}
```

Sources are sent as a final token: `\n\nSOURCES:["file.pdf", "https://..."]`

## Build

```bash
npm run build     # Production build → dist/
npm run preview   # Preview production build
```
