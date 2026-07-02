import { useState, useRef, useEffect } from "react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism"
import { motion, AnimatePresence } from "framer-motion"
import { auth, db } from "./firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"
import {
  collection, addDoc, query, orderBy,
  onSnapshot, serverTimestamp,
  doc, setDoc, getDocs, deleteDoc
} from "firebase/firestore"
import Login from "./Login"

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

const SYSTEM_PROMPT = `You are PyBot, a coding assistant.
When asked to write code:
- Always use Python unless another language is specified
- Keep code short and beginner friendly
- Add brief comments explaining what the code does
- Format code in a code block
- Give a one line explanation before the code
For general conversation just reply naturally and friendly.`

/* ─────────────────────────────────────────────
   Typewriter hook
───────────────────────────────────────────── */
function useTypewriter(text, speed = 13, enabled = true) {
  const [displayed, setDisplayed] = useState(enabled ? "" : text)
  const [done, setDone] = useState(!enabled)
  useEffect(() => {
    if (!enabled) { setDisplayed(text); setDone(true); return }
    setDisplayed(""); setDone(false)
    if (!text) return
    let i = 0
    const id = setInterval(() => {
      i++; setDisplayed(text.slice(0, i))
      if (i >= text.length) { clearInterval(id); setDone(true) }
    }, speed)
    return () => clearInterval(id)
  }, [text, speed, enabled])
  return { displayed, done }
}

/* ─────────────────────────────────────────────
   Message parser
───────────────────────────────────────────── */
function parseMessage(text) {
  const re = /```(\w+)?\n?([\s\S]*?)```/g
  const parts = []; let last = 0, m
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: "text", content: text.slice(last, m.index) })
    parts.push({ type: "code", language: m[1] || "python", content: m[2].trim() })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ type: "text", content: text.slice(last) })
  return parts.length > 0 ? parts : [{ type: "text", content: text }]
}

/* ─────────────────────────────────────────────
   TypewriterText
───────────────────────────────────────────── */
function TypewriterText({ content, animate }) {
  const { displayed, done } = useTypewriter(content, 13, animate)
  return (
    <span>
      {animate ? displayed : content}
      {animate && !done && (
        <span style={{
          display: "inline-block", width: 2, height: "1em",
          background: "#b20a2c", marginLeft: 2,
          verticalAlign: "text-bottom",
          animation: "blink 0.65s steps(1) infinite"
        }} />
      )}
    </span>
  )
}

/* ─────────────────────────────────────────────
   Message bubble
───────────────────────────────────────────── */
function Message({ msg, isLatest }) {
  const isBot = msg.sender === "bot"
  const parts = parseMessage(msg.text)

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      style={{
        display: "flex", gap: 10, alignItems: "flex-start",
        marginBottom: 18,
        flexDirection: isBot ? "row" : "row-reverse"
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
        background: isBot
          ? "linear-gradient(135deg,#b20a2c,#e8193c)"
          : "#fffbd5",
        color: isBot ? "#fffbd5" : "#b20a2c",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 800, fontFamily: "Georgia,serif",
        border: isBot
          ? "2px solid rgba(178,10,44,0.2)"
          : "2px solid #b20a2c",
        boxShadow: isBot
          ? "0 2px 10px rgba(178,10,44,0.25)"
          : "0 2px 8px rgba(178,10,44,0.15)"
      }}>
        {isBot ? "P" : "U"}
      </div>

      {/* Content */}
      <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{
          fontSize: 10.5, fontWeight: 700, letterSpacing: "0.09em",
          color: isBot ? "rgba(178,10,44,0.5)" : "rgba(26,5,8,0.38)",
          fontFamily: "monospace", textTransform: "uppercase",
          textAlign: isBot ? "left" : "right", marginBottom: 1
        }}>
          {isBot ? "PyBot" : "You"}
        </div>

        {parts.map((part, i) =>
          part.type === "code" ? (
            <div key={i} style={{
              borderRadius: 10, overflow: "hidden",
              border: "1px solid rgba(178,10,44,0.18)",
              boxShadow: "0 3px 14px rgba(178,10,44,0.08)"
            }}>
              <div style={{
                background: "#b20a2c", color: "#fffbd5",
                padding: "6px 14px", fontSize: 10.5,
                display: "flex", justifyContent: "space-between", alignItems: "center",
                fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase"
              }}>
                <span style={{ fontWeight: 700 }}>{part.language}</span>
                <motion.span
                  whileHover={{ opacity: 1 }} whileTap={{ scale: 0.9 }}
                  style={{ cursor: "pointer", opacity: 0.75, fontWeight: 600, fontSize: 10 }}
                  onClick={() => navigator.clipboard.writeText(part.content)}
                >Copy</motion.span>
              </div>
              <SyntaxHighlighter
                language={part.language}
                style={oneLight}
                customStyle={{ margin: 0, background: "#fff8ee", fontSize: 12.5 }}
              >
                {part.content}
              </SyntaxHighlighter>
            </div>
          ) : (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: isBot ? -12 : 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 26, delay: i * 0.04 }}
              style={{
                padding: "10px 14px",
                borderRadius: isBot ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
                background: isBot
                  ? "#ffffff"
                  : "linear-gradient(135deg,#b20a2c,#d41232)",
                color: isBot ? "#1a0508" : "#fffbd5",
                fontSize: 14, lineHeight: 1.65,
                fontFamily: "Georgia,serif",
                boxShadow: isBot
                  ? "0 2px 10px rgba(178,10,44,0.07)"
                  : "0 3px 16px rgba(178,10,44,0.25)",
                border: isBot ? "1px solid rgba(178,10,44,0.1)" : "none"
              }}
            >
              <TypewriterText
                content={part.content}
                animate={isBot && isLatest && i === 0}
              />
            </motion.div>
          )
        )}
      </div>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────
   Typing indicator
───────────────────────────────────────────── */
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 18 }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
        background: "linear-gradient(135deg,#b20a2c,#e8193c)",
        color: "#fffbd5", display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 13, fontWeight: 800,
        fontFamily: "Georgia,serif",
        boxShadow: "0 2px 10px rgba(178,10,44,0.25)"
      }}>P</div>
      <div>
        <div style={{
          fontSize: 10.5, fontWeight: 700, letterSpacing: "0.09em",
          color: "rgba(178,10,44,0.5)", fontFamily: "monospace",
          textTransform: "uppercase", marginBottom: 3
        }}>PyBot</div>
        <div style={{
          padding: "10px 16px", borderRadius: "4px 14px 14px 14px",
          background: "#ffffff", border: "1px solid rgba(178,10,44,0.1)",
          display: "flex", gap: 5, alignItems: "center",
          boxShadow: "0 2px 10px rgba(178,10,44,0.07)"
        }}>
          {[0, 1, 2].map(i => (
            <motion.div key={i}
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.16 }}
              style={{ width: 7, height: 7, borderRadius: "50%", background: "#b20a2c" }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────
   Loading screen
───────────────────────────────────────────── */
function LoadingScreen() {
  return (
    <div style={{
      display: "flex", height: "100vh",
      alignItems: "center", justifyContent: "center",
      background: "#fffbd5", flexDirection: "column", gap: 16
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "3px solid rgba(178,10,44,0.15)",
          borderTopColor: "#b20a2c"
        }}
      />
      <div style={{
        color: "rgba(178,10,44,0.5)", fontSize: 12,
        fontFamily: "monospace", letterSpacing: "0.15em",
        textTransform: "uppercase"
      }}>Loading…</div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   LocalStorage helpers
───────────────────────────────────────────── */
const getLocalSessions = (uid) => {
  try {
    const data = localStorage.getItem(`pybot_sessions_${uid}`)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

const saveLocalSessions = (uid, list) => {
  try {
    localStorage.setItem(`pybot_sessions_${uid}`, JSON.stringify(list))
  } catch (e) {
    console.error(e)
  }
}

const getLocalMessages = (uid, sessionId) => {
  try {
    const data = localStorage.getItem(`pybot_messages_${uid}_${sessionId}`)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

const saveLocalMessages = (uid, sessionId, list) => {
  try {
    localStorage.setItem(`pybot_messages_${uid}_${sessionId}`, JSON.stringify(list))
  } catch (e) {
    console.error(e)
  }
}

/* ─────────────────────────────────────────────
   Main App
───────────────────────────────────────────── */
let sessionCounter = Date.now()

export default function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Multi-session state
  const [sessions, setSessions] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [useLocalFallback, setUseLocalFallback] = useState(false)

  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const chatHistories = useRef({})
  const firestoreUnsub = useRef(null)

  /* ── Auth listener ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthLoading(false)
      if (!u) {
        setSessions([])
        setActiveId(null)
        setMessages([])
      }
    })
    return unsub
  }, [])

  /* ── Load sessions list from Firestore / LocalStorage ── */
  useEffect(() => {
    if (!user) return

    if (useLocalFallback) {
      const list = getLocalSessions(user.uid)
      setSessions(list)
      // Auto-select first session if none active
      if (list.length > 0 && !activeId) {
        setActiveId(list[0].id)
      }
      // If no sessions, create a default one
      if (list.length === 0) {
        createNewChat(user)
      }
      return
    }

    const sessionsRef = collection(db, "users", user.uid, "sessions")
    const q = query(sessionsRef, orderBy("updatedAt", "desc"))
    const unsub = onSnapshot(q, 
      (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setSessions(list)
        // Auto-select first session if none active
        if (list.length > 0 && !activeId) {
          setActiveId(list[0].id)
        }
        // If no sessions, create a default one
        if (list.length === 0) {
          createNewChat(user)
        }
      },
      (err) => {
        console.error("Firestore onSnapshot error, falling back to local storage:", err)
        setUseLocalFallback(true)
      }
    )
    return unsub
  }, [user, useLocalFallback, activeId])

  /* ── Load messages for active session ── */
  useEffect(() => {
    if (!user || !activeId) return

    if (useLocalFallback) {
      const msgs = getLocalMessages(user.uid, activeId)
      if (msgs.length === 0) {
        const welcome = {
          id: "welcome",
          sender: "bot",
          text: "Hi! I'm PyBot, your coding assistant. How can I help you today?"
        }
        setMessages([welcome])
        chatHistories.current[activeId] = []
      } else {
        setMessages(msgs)
        chatHistories.current[activeId] = msgs.map(m => ({
          role: m.sender === "bot" ? "assistant" : "user",
          content: m.text
        }))
      }
      return
    }

    if (firestoreUnsub.current) firestoreUnsub.current()

    const msgsRef = collection(db, "users", user.uid, "sessions", activeId, "messages")
    const q = query(msgsRef, orderBy("createdAt", "asc"))

    firestoreUnsub.current = onSnapshot(q, 
      (snap) => {
        const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        if (msgs.length === 0) {
          const welcome = {
            id: "welcome",
            sender: "bot",
            text: "Hi! I'm PyBot, your coding assistant. How can I help you today?"
          }
          setMessages([welcome])
          chatHistories.current[activeId] = []
        } else {
          setMessages(msgs)
          chatHistories.current[activeId] = msgs.map(m => ({
            role: m.sender === "bot" ? "assistant" : "user",
            content: m.text
          }))
        }
      },
      (err) => {
        console.error("Firestore messages subscription error, falling back to local storage:", err)
        setUseLocalFallback(true)
      }
    )
    return () => { if (firestoreUnsub.current) firestoreUnsub.current() }
  }, [user, activeId, useLocalFallback])

  /* ── Auto scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  /* ── Create new chat session ── */
  const createNewChat = async (u = user) => {
    if (!u) return
    sessionCounter++
    const newId = "local_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)

    if (useLocalFallback) {
      const list = getLocalSessions(u.uid)
      const newList = [{ id: newId, title: "New Chat", updatedAt: Date.now() }, ...list]
      saveLocalSessions(u.uid, newList)
      setSessions(newList)
      setActiveId(newId)
      setInput("")
      return
    }

    try {
      const sessRef = doc(collection(db, "users", u.uid, "sessions"))
      await setDoc(sessRef, {
        title: "New Chat",
        updatedAt: serverTimestamp()
      })
      setActiveId(sessRef.id)
      setInput("")
    } catch (err) {
      console.error("Failed to create Firestore session, switching to local fallback:", err)
      setUseLocalFallback(true)
      // Retry locally
      const list = getLocalSessions(u.uid)
      const newList = [{ id: newId, title: "New Chat", updatedAt: Date.now() }, ...list]
      saveLocalSessions(u.uid, newList)
      setSessions(newList)
      setActiveId(newId)
      setInput("")
    }
  }

  /* ── Delete session ── */
  const deleteSession = async (id, e) => {
    e.stopPropagation()
    if (!user) return

    if (useLocalFallback) {
      const remaining = sessions.filter(s => s.id !== id)
      saveLocalSessions(user.uid, remaining)
      setSessions(remaining)
      localStorage.removeItem(`pybot_messages_${user.uid}_${id}`)
      delete chatHistories.current[id]
      if (activeId === id) {
        if (remaining.length > 0) setActiveId(remaining[0].id)
        else createNewChat()
      }
      return
    }

    try {
      // Delete all messages in the session
      const msgsRef = collection(db, "users", user.uid, "sessions", id, "messages")
      const snap = await getDocs(msgsRef)
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)))
      // Delete the session doc
      await deleteDoc(doc(db, "users", user.uid, "sessions", id))
      delete chatHistories.current[id]
      if (activeId === id) {
        const remaining = sessions.filter(s => s.id !== id)
        if (remaining.length > 0) setActiveId(remaining[0].id)
        else createNewChat()
      }
    } catch (err) {
      console.error("Delete session Firestore operation failed, switching to local fallback:", err)
      setUseLocalFallback(true)
      // Retry delete locally
      const remaining = sessions.filter(s => s.id !== id)
      saveLocalSessions(user.uid, remaining)
      setSessions(remaining)
      localStorage.removeItem(`pybot_messages_${user.uid}_${id}`)
      delete chatHistories.current[id]
      if (activeId === id) {
        if (remaining.length > 0) setActiveId(remaining[0].id)
        else createNewChat()
      }
    }
  }

  /* ── Save message ── */
  const saveMessage = async (sessionId, sender, text) => {
    if (!user) return

    if (useLocalFallback) {
      const msgs = getLocalMessages(user.uid, sessionId)
      const newMsg = {
        id: Date.now() + "_" + Math.random().toString(36).substr(2, 4),
        sender,
        text,
        createdAt: Date.now()
      }
      const updatedMsgs = [...msgs, newMsg]
      saveLocalMessages(user.uid, sessionId, updatedMsgs)
      setMessages(updatedMsgs)

      // Update session title
      const list = getLocalSessions(user.uid)
      const updatedList = list.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            title: sender === "user" && s.title === "New Chat"
              ? text.slice(0, 38) + (text.length > 38 ? "…" : "")
              : s.title,
            updatedAt: Date.now()
          }
        }
        return s
      })
      saveLocalSessions(user.uid, updatedList)
      setSessions(updatedList)
      return
    }

    try {
      const msgsRef = collection(db, "users", user.uid, "sessions", sessionId, "messages")
      await addDoc(msgsRef, { sender, text, createdAt: serverTimestamp() })
      // Update session title from first user message
      const session = sessions.find(s => s.id === sessionId)
      if (sender === "user" && session?.title === "New Chat") {
        await setDoc(
          doc(db, "users", user.uid, "sessions", sessionId),
          { title: text.slice(0, 38) + (text.length > 38 ? "…" : ""), updatedAt: serverTimestamp() },
          { merge: true }
        )
      } else {
        await setDoc(
          doc(db, "users", user.uid, "sessions", sessionId),
          { updatedAt: serverTimestamp() },
          { merge: true }
        )
      }
    } catch (err) {
      console.error("Save message Firestore operation failed, falling back to local storage:", err)
      setUseLocalFallback(true)
      // Retry save locally
      await saveMessage(sessionId, sender, text)
    }
  }

  /* ── Send message ── */
  const sendMessage = async () => {
    const text = input.trim()
    if (!text || isLoading || !activeId) return
    const sessionId = activeId

    const userMsg = { id: Date.now(), sender: "user", text }
    setMessages(prev => [...prev, userMsg])
    await saveMessage(sessionId, "user", text)
    setInput("")
    setIsLoading(true)

    if (!chatHistories.current[sessionId]) chatHistories.current[sessionId] = []
    chatHistories.current[sessionId].push({ role: "user", content: text })

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1024,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...chatHistories.current[sessionId]
          ]
        })
      })
      const data = await response.json()
      const reply = data.choices[0].message.content
      chatHistories.current[sessionId].push({ role: "assistant", content: reply })
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: "bot", text: reply }])
      await saveMessage(sessionId, "bot", reply)
    } catch (apiErr) {
      console.error("Groq API error:", apiErr)
      const errMsg = "⚠️ Could not reach Groq API. Check your API key."
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: "bot", text: errMsg }])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  /* ── Sign out ── */
  const handleSignOut = async () => {
    if (firestoreUnsub.current) firestoreUnsub.current()
    await signOut(auth)
    chatHistories.current = {}
    setSessions([]); setActiveId(null); setMessages([])
  }

  const filtered = sessions.filter(s =>
    (s.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeSession = sessions.find(s => s.id === activeId)

  /* ── Guards ── */
  if (authLoading) return <LoadingScreen />
  if (!user) return <Login />

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <div style={{
      display: "flex", height: "100vh", overflow: "hidden",
      background: "#fffbd5", fontFamily: "Georgia,'Times New Roman',serif"
    }}>

      {/* ══════════════════════════════
          SIDEBAR
      ══════════════════════════════ */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 272, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            style={{
              height: "100vh", flexShrink: 0, overflow: "hidden",
              background: "#160406",
              display: "flex", flexDirection: "column",
              borderRight: "1px solid rgba(178,10,44,0.2)"
            }}
          >
            <div style={{ width: 272, display: "flex", flexDirection: "column", height: "100%" }}>

              {/* Sidebar top */}
              <div style={{
                padding: "15px 13px 11px",
                borderBottom: "1px solid rgba(255,251,213,0.06)"
              }}>
                {/* Brand row */}
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: "linear-gradient(135deg,#b20a2c,#e8193c)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, fontWeight: 800, color: "#fffbd5",
                    fontFamily: "Georgia,serif",
                    boxShadow: "0 3px 12px rgba(178,10,44,0.45)"
                  }}>P</div>
                  <span style={{
                    color: "#fffbd5", fontWeight: 700, fontSize: 15.5,
                    fontFamily: "Georgia,serif", letterSpacing: "0.04em", flex: 1
                  }}>PyBot</span>
                  <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => setSidebarOpen(false)}
                    style={{
                      background: "transparent", border: "none", cursor: "pointer",
                      color: "rgba(255,251,213,0.3)", padding: 4, display: "flex",
                      alignItems: "center", borderRadius: 6
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
                  </motion.button>
                </div>

                {/* New Chat */}
                <motion.button
                  whileHover={{ background: "rgba(178,10,44,0.82)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => createNewChat()}
                  style={{
                    width: "100%", padding: "8px 13px",
                    background: "#b20a2c", border: "none", borderRadius: 8,
                    color: "#fffbd5", fontSize: 13, fontWeight: 700,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
                    fontFamily: "Georgia,serif",
                    boxShadow: "0 3px 14px rgba(178,10,44,0.35)",
                    transition: "background 0.18s"
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                  New Chat
                </motion.button>
              </div>

              {/* Search */}
              <div style={{ padding: "9px 13px 6px" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 7,
                  background: "rgba(255,251,213,0.05)",
                  border: "1px solid rgba(255,251,213,0.09)",
                  borderRadius: 8, padding: "6px 10px"
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,251,213,0.35)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search chats..."
                    style={{
                      background: "transparent", border: "none", outline: "none",
                      color: "rgba(255,251,213,0.75)", fontSize: 12.5,
                      width: "100%", fontFamily: "Georgia,serif"
                    }}
                  />
                </div>
              </div>

              {/* Chat list */}
              <div style={{ flex: 1, overflowY: "auto", padding: "4px 7px 14px" }}>
                {filtered.length === 0 ? (
                  <div style={{
                    textAlign: "center", color: "rgba(255,251,213,0.22)",
                    fontSize: 12.5, fontStyle: "italic", marginTop: 22,
                    fontFamily: "Georgia,serif"
                  }}>No chats.</div>
                ) : (
                  filtered.map(s => (
                    <motion.div
                      key={s.id}
                      whileHover={{ background: "rgba(255,251,213,0.07)" }}
                      onClick={() => setActiveId(s.id)}
                      style={{
                        padding: "8px 9px",
                        borderRadius: 8, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 7,
                        background: s.id === activeId
                          ? "rgba(178,10,44,0.22)"
                          : "transparent",
                        border: s.id === activeId
                          ? "1px solid rgba(178,10,44,0.28)"
                          : "1px solid transparent",
                        marginBottom: 1, transition: "background 0.14s"
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                        stroke={s.id === activeId ? "#e8a0ac" : "rgba(255,251,213,0.3)"}
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      <span style={{
                        flex: 1, color: s.id === activeId ? "#fffbd5" : "rgba(255,251,213,0.55)",
                        fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden",
                        textOverflow: "ellipsis", fontFamily: "Georgia,serif"
                      }}>{s.title || "New Chat"}</span>
                      <motion.span
                        whileHover={{ color: "#e8193c", opacity: 1 }}
                        onClick={e => deleteSession(s.id, e)}
                        style={{
                          color: "rgba(255,251,213,0.18)", fontSize: 15,
                          lineHeight: 1, cursor: "pointer", flexShrink: 0,
                          opacity: 0.7, padding: "0 2px"
                        }}
                      >×</motion.span>
                    </motion.div>
                  ))
                )}
              </div>

              {/* User footer */}
              <div style={{
                padding: "11px 13px",
                borderTop: "1px solid rgba(255,251,213,0.06)",
                display: "flex", alignItems: "center", gap: 9
              }}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="avatar"
                    style={{ width: 28, height: 28, borderRadius: "50%", border: "1.5px solid rgba(178,10,44,0.5)" }} />
                ) : (
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "#fffbd5", color: "#b20a2c",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800, fontFamily: "Georgia,serif",
                    border: "1.5px solid rgba(178,10,44,0.4)"
                  }}>
                    {(user.displayName || user.email || "U")[0].toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{
                    color: "rgba(255,251,213,0.7)", fontSize: 11.5,
                    whiteSpace: "nowrap", overflow: "hidden",
                    textOverflow: "ellipsis", fontFamily: "Georgia,serif"
                  }}>{user.displayName || user.email}</div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, color: "#e8193c" }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSignOut}
                  title="Sign out"
                  style={{
                    background: "transparent", border: "none", cursor: "pointer",
                    color: "rgba(255,251,213,0.3)", padding: 4, display: "flex",
                    flexShrink: 0, transition: "color 0.18s"
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                </motion.button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════
          MAIN PANEL
      ══════════════════════════════ */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        overflow: "hidden", position: "relative"
      }}>
        {/* Background texture */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "radial-gradient(circle, rgba(178,10,44,0.065) 1px, transparent 1px)",
          backgroundSize: "26px 26px", zIndex: 0
        }} />
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          background: "radial-gradient(ellipse 65% 60% at 50% 45%, rgba(255,252,195,0.4) 0%, transparent 70%)"
        }} />

        {/* ── Top bar ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 18px",
          background: "rgba(255,251,213,0.92)",
          backdropFilter: "blur(10px)",
          borderBottom: "1.5px solid rgba(178,10,44,0.1)",
          zIndex: 10, position: "relative",
          boxShadow: "0 1px 10px rgba(178,10,44,0.05)"
        }}>
          {/* Hamburger (when sidebar closed) */}
          {!sidebarOpen && (
            <motion.button
              whileHover={{ scale: 1.08, background: "rgba(178,10,44,0.08)" }}
              whileTap={{ scale: 0.93 }}
              onClick={() => setSidebarOpen(true)}
              style={{
                background: "transparent",
                border: "1px solid rgba(178,10,44,0.2)",
                borderRadius: 7, cursor: "pointer",
                color: "#b20a2c", padding: "5px 7px",
                display: "flex", alignItems: "center"
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            </motion.button>
          )}

          <span style={{
            color: "#b20a2c", fontWeight: 700, fontSize: 13.5,
            fontFamily: "Georgia,serif", letterSpacing: "0.03em",
            flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
          }}>
            {activeSession?.title || "PyBot"}
          </span>

          {/* Storage status pill */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: useLocalFallback ? "rgba(178,10,44,0.06)" : "rgba(76,175,80,0.08)",
            border: useLocalFallback ? "1px solid rgba(178,10,44,0.18)" : "1px solid rgba(76,175,80,0.22)",
            borderRadius: 20, padding: "3px 9px", marginRight: 8
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: useLocalFallback ? "#b20a2c" : "#4caf50"
            }} />
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: useLocalFallback ? "#b20a2c" : "#2e7d32",
              fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.05em"
            }}>
              {useLocalFallback ? "Local Storage" : "Cloud Sync"}
            </span>
          </div>

          {/* User avatar in topbar */}
          {user.photoURL ? (
            <img src={user.photoURL} alt="avatar"
              style={{ width: 26, height: 26, borderRadius: "50%", border: "1.5px solid rgba(178,10,44,0.4)" }} />
          ) : (
            <div style={{
              width: 26, height: 26, borderRadius: "50%",
              background: "#fffbd5", color: "#b20a2c",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 800, fontFamily: "Georgia,serif",
              border: "1.5px solid #b20a2c"
            }}>
              {(user.displayName || user.email || "U")[0].toUpperCase()}
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.04, background: "rgba(178,10,44,0.07)" }}
            whileTap={{ scale: 0.94 }}
            onClick={() => createNewChat()}
            style={{
              background: "transparent",
              border: "1.5px solid rgba(178,10,44,0.24)",
              borderRadius: 7, color: "#b20a2c", padding: "5px 12px",
              fontSize: 11, cursor: "pointer", fontFamily: "monospace",
              letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600,
              transition: "background 0.18s"
            }}
          >+ New</motion.button>
        </div>

        {/* ── Messages ── */}
        <div style={{
          flex: 1, overflowY: "auto",
          padding: messages.length <= 1 && !isLoading ? "0" : "24px 22px 14px",
          position: "relative", zIndex: 2,
          display: "flex", flexDirection: "column"
        }}>
          {messages.length <= 1 && !isLoading ? (
            /* Empty state */
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 12
            }}>
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 22 }}
                style={{
                  width: 70, height: 70, borderRadius: 20,
                  background: "linear-gradient(135deg,#b20a2c,#e8193c)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 30, fontWeight: 800, color: "#fffbd5",
                  fontFamily: "Georgia,serif",
                  boxShadow: "0 8px 34px rgba(178,10,44,0.3)",
                  border: "3px solid rgba(255,251,213,0.6)"
                }}
              >P</motion.div>
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.14 }}
                style={{ textAlign: "center" }}
              >
                <div style={{
                  color: "#b20a2c", fontWeight: 700, fontSize: 24,
                  fontFamily: "Georgia,serif", letterSpacing: "0.04em"
                }}>PyBot</div>
                <div style={{
                  color: "rgba(178,10,44,0.42)", fontSize: 11.5, marginTop: 4,
                  fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase"
                }}>Your Coding Assistant</div>
              </motion.div>
              {/* Chips */}
              <motion.div
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.26 }}
                style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 6, maxWidth: 420 }}
              >
                {["Write a Python function", "Explain recursion", "Fix my code", "Sort algorithm"].map(chip => (
                  <motion.button
                    key={chip}
                    whileHover={{ scale: 1.04, background: "rgba(178,10,44,0.09)" }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => { setInput(chip); inputRef.current?.focus() }}
                    style={{
                      background: "#ffffff", border: "1.5px solid rgba(178,10,44,0.2)",
                      borderRadius: 20, padding: "7px 15px", fontSize: 12.5,
                      color: "#b20a2c", cursor: "pointer", fontFamily: "Georgia,serif",
                      boxShadow: "0 2px 8px rgba(178,10,44,0.07)",
                      transition: "background 0.18s"
                    }}
                  >{chip}</motion.button>
                ))}
              </motion.div>
            </div>
          ) : (
            <div style={{ paddingTop: 6 }}>
              <AnimatePresence>
                {messages.map((msg, idx) => (
                  <Message
                    key={msg.id}
                    msg={msg}
                    isLatest={idx === messages.length - 1}
                  />
                ))}
                {isLoading && <TypingIndicator key="typing" />}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── Input bar ── */}
        <div style={{
          padding: "12px 18px 16px",
          background: "rgba(255,251,213,0.96)",
          backdropFilter: "blur(10px)",
          borderTop: "1.5px solid rgba(178,10,44,0.1)",
          position: "relative", zIndex: 10,
          boxShadow: "0 -2px 14px rgba(178,10,44,0.05)"
        }}>
          <motion.div
            whileFocusWithin={{
              boxShadow: "0 0 0 2.5px rgba(178,10,44,0.2), 0 4px 18px rgba(178,10,44,0.09)",
              borderColor: "rgba(178,10,44,0.38)"
            }}
            style={{
              display: "flex", alignItems: "center", gap: 9,
              background: "#ffffff",
              border: "1.5px solid rgba(178,10,44,0.15)",
              borderRadius: 13, padding: "9px 10px 9px 14px",
              boxShadow: "0 2px 12px rgba(178,10,44,0.06)",
              transition: "box-shadow 0.25s, border-color 0.25s"
            }}
          >
            {/* Attach / plus icon */}
            <motion.button
              whileHover={{ scale: 1.15, color: "#b20a2c" }}
              whileTap={{ scale: 0.9 }}
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                color: "rgba(178,10,44,0.28)", padding: 0,
                display: "flex", flexShrink: 0, transition: "color 0.2s"
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>
              </svg>
            </motion.button>

            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a message..."
              rows={1}
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                color: "#1a0508", fontSize: 14, resize: "none", lineHeight: 1.5,
                maxHeight: 120, overflowY: "auto", fontFamily: "Georgia,serif"
              }}
              onInput={e => {
                e.target.style.height = "auto"
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"
              }}
            />

            <motion.button
              whileHover={input.trim() && !isLoading ? { scale: 1.1, rotate: 12 } : {}}
              whileTap={input.trim() && !isLoading ? { scale: 0.88 } : {}}
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              style={{
                width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                background: input.trim() && !isLoading
                  ? "linear-gradient(135deg,#b20a2c,#e8193c)"
                  : "rgba(178,10,44,0.08)",
                border: "none",
                cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: input.trim() && !isLoading
                  ? "0 3px 14px rgba(178,10,44,0.36)"
                  : "none",
                transition: "background 0.2s, box-shadow 0.2s"
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13"
                  stroke={input.trim() && !isLoading ? "#fffbd5" : "rgba(178,10,44,0.28)"}
                  strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z"
                  stroke={input.trim() && !isLoading ? "#fffbd5" : "rgba(178,10,44,0.28)"}
                  strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.button>
          </motion.div>

          <div style={{
            textAlign: "center", color: "rgba(178,10,44,0.26)",
            fontSize: 10, marginTop: 7,
            fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase"
          }}>Enter to send · Shift+Enter for new line</div>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        ::placeholder { color: rgba(178,10,44,0.26) !important; font-style: italic; }
        input::placeholder { color: rgba(255,251,213,0.28) !important; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(178,10,44,0.22); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #b20a2c; }
      `}</style>
    </div>
  )
}