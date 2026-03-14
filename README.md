# ai-rag-ui

💬 **React Chat UI for the AI RAG Agent**

A modern **ChatGPT-style interface** built with **React, Vite, and Tailwind CSS** that connects to the **AI RAG Agent backend**.
The UI enables users to interact with a Retrieval-Augmented Generation (RAG) system through a **streaming chat interface**.

---

# 🚀 Features

* 💬 ChatGPT-style chat interface
* ⚡ Streaming responses from backend
* 📜 Chat message bubbles
* 📂 Sidebar chat layout
* ⌨️ Enter-to-send messages
* 🔄 Auto-scroll to latest message
* 🎨 Tailwind CSS styling
* 🔗 FastAPI backend integration

---

# 🧠 Architecture

```
User
 ↓
React Chat UI
 ↓
FastAPI API (/ask)
 ↓
LangGraph Agent
 ↓
RAG Retrieval
 ↓
Vector Database (FAISS)
 ↓
Local LLM
 ↓
Streaming Response
```

The UI receives **streamed responses** from the backend and displays them progressively to simulate a **typing effect similar to ChatGPT**.

---

# 🛠 Tech Stack

* **React**
* **Vite**
* **Tailwind CSS**
* **JavaScript (ES6+)**
* **Fetch API (ReadableStream for streaming)**

---

# 📂 Project Structure

```
ai-rag-ui
│
├── src
│   ├── components
│   │   ├── Sidebar.jsx
│   │   ├── ChatWindow.jsx
│   │   ├── Message.jsx
│   │   └── InputBox.jsx
│   │
│   ├── App.jsx
│   └── index.css
│
├── index.html
├── package.json
└── vite.config.js
```

---

# ▶️ Run Locally

### 1️⃣ Install dependencies

```
npm install
```

### 2️⃣ Start development server

```
npm run dev
```

Open the application:

```
http://localhost:5173
```

---

# 🔗 Backend Dependency

This UI connects to the **AI RAG Agent backend**.

Backend repository:

```
ai-rag-agent
```

Start the backend server:

```
uvicorn api:app --reload
```

Default API endpoint used by the UI:

```
http://localhost:8000/ask
```

---

# 💬 Example Request

User asks:

```
What employee information is available?
```

The UI sends:

```
POST /ask
{
  "question": "What employee information is available?"
}
```

The backend streams the answer, which is rendered progressively in the chat interface.

---

# 📸 UI Layout

```
----------------------------------------
| Sidebar |                            |
| Chats   |        Chat Messages       |
|         |                            |
|         |                            |
|         |----------------------------|
|         |   Send message input       |
----------------------------------------
```

---

# 🔄 Streaming Responses

The UI reads streamed responses using the **ReadableStream API**:

```javascript
const reader = res.body.getReader()
```

This enables **real-time incremental response rendering**.

---

# 🧩 Future Enhancements

Planned improvements include:

* 📜 Markdown rendering for answers
* 🌙 Dark mode support
* 🧠 Chat history persistence
* 📂 Document upload for RAG ingestion
* ⚡ WebSocket streaming
* 🔐 Wallet / Web3 integration

---

# 🔗 Related Repository

Backend AI agent:

```
ai-rag-agent
```

Provides:

* LangGraph agent orchestration
* Retrieval-Augmented Generation (RAG)
* FAISS vector database
* Local LLM inference
* FastAPI API layer

---

# 📜 License

MIT License
