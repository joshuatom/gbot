import { useState, useRef, useEffect } from "react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { motion, AnimatePresence } from "framer-motion"
import { auth, db } from "./firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore"
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

function parseMessage(text) {
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g
  const parts = []
  let lastIndex = 0
  let match
  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex)
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) })
    parts.push({ type: "code", language: match[1] || "python", content: match[2].trim() })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length)
    parts.push({ type: "text", content: text.slice(lastIndex) })
  return parts.length > 0 ? parts : [{ type: "text", content: text }]
}

function Message({ msg }) {
  const isBot = msg.sender === "bot"
  const parts = parseMessage(msg.text)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotateX: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      style={{
        display: "flex",
        justifyContent: isBot ? "flex-start" : "flex-end",
        marginBottom: 12,
        perspective: "800px"
      }}
    >
      {isBot && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #fc466b, #3f5efb)",
            color: "#fff", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 14, fontWeight: 600,
            marginRight: 8, flexShrink: 0,
            boxShadow: "0 4px 15px rgba(63,94,251,0.4)"
          }}
        >B</motion.div>
      )}
      <div style={{ maxWidth: "75%" }}>
        {parts.map((part, i) =>
          part.type === "code" ? (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: isBot ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{ borderRadius: 8, overflow: "hidden", marginTop: 8 }}
            >
              <div style={{
                background: "#1e1e1e", color: "#fff",
                padding: "6px 12px", fontSize: 11,
                display: "flex", justifyContent: "space-between"
              }}>
                <span>{part.language}</span>
                <span
                  style={{ cursor: "pointer", color: "#94a3b8" }}
                  onClick={() => navigator.clipboard.writeText(part.content)}
                >Copy</span>
              </div>
              <SyntaxHighlighter
                language={part.language}
                style={vscDarkPlus}
                customStyle={{ margin: 0, borderRadius: "0 0 8px 8px" }}
              >
                {part.content}
              </SyntaxHighlighter>
            </motion.div>
          ) : (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: isBot ? -20 : 20, rotateY: isBot ? -15 : 15 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: i * 0.05 }}
              style={{
                padding: "10px 14px",
                borderRadius: isBot ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
                background: isBot
                  ? "linear-gradient(135deg, #1e293b, #0f172a)"
                  : "linear-gradient(135deg, #fc466b, #3f5efb)",
                color: "#fff",
                fontSize: 15, lineHeight: 1.5,
                marginTop: i > 0 ? 4 : 0,
                boxShadow: isBot
                  ? "0 4px 20px rgba(0,0,0,0.3)"
                  : "0 4px 20px rgba(252,70,107,0.35)",
                border: isBot ? "1px solid #334155" : "none"
              }}
            >
              {part.content}
            </motion.div>
          )
        )}
      </div>
    </motion.div>
  )
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      style={{ display: "flex", alignItems: "center", marginBottom: 12 }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        background: "linear-gradient(135deg, #fc466b, #3f5efb)",
        color: "#fff", display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 14, fontWeight: 600,
        marginRight: 8, flexShrink: 0,
        boxShadow: "0 4px 15px rgba(63,94,251,0.4)"
      }}>B</div>
      <div style={{
        padding: "10px 16px",
        borderRadius: "4px 16px 16px 16px",
        background: "#1e293b",
        border: "1px solid #334155",
        display: "flex", gap: 4, alignItems: "center"
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "linear-gradient(135deg, #fc466b, #3f5efb)",
            animation: "bounce 1.2s infinite",
            animationDelay: `${i * 0.2}s`
          }} />
        ))}
      </div>
    </motion.div>
  )
}

function LoadingScreen() {
  return (
    <div style={{
      display: "flex", height: "100vh",
      alignItems: "center", justifyContent: "center",
      background: "#060b18"
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "3px solid transparent",
          borderTopColor: "#fc466b",
          borderRightColor: "#3f5efb"
        }}
      />
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [messages, setMessages] = useState([
    { id: "welcome", sender: "bot", text: "Hi! I'm PyBot, your coding assistant. How can I help you today?" }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const chatHistory = useRef([])

  // Auth state listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthLoading(false)
    })
    return unsub
  }, [])

  // Load messages from Firestore when user logs in
  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, "users", user.uid, "messages"),
      orderBy("createdAt", "asc")
    )
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      if (msgs.length > 0) {
        setMessages(msgs)
        chatHistory.current = msgs.map(m => ({
          role: m.sender === "bot" ? "assistant" : "user",
          content: m.text
        }))
      }
    })
    return unsub
  }, [user])

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const saveMessage = async (sender, text) => {
    if (!user) return
    await addDoc(collection(db, "users", user.uid, "messages"), {
      sender,
      text,
      createdAt: serverTimestamp()
    })
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || isLoading) return

    const userMsg = { id: Date.now(), sender: "user", text }
    setMessages(prev => [...prev, userMsg])
    await saveMessage("user", text)
    setInput("")
    setIsLoading(true)
    chatHistory.current.push({ role: "user", content: text })

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
            ...chatHistory.current
          ]
        })
      })
      const data = await response.json()
      const reply = data.choices[0].message.content
      chatHistory.current.push({ role: "assistant", content: reply })
      const botMsg = { id: Date.now() + 1, sender: "bot", text: reply }
      setMessages(prev => [...prev, botMsg])
      await saveMessage("bot", reply)
    } catch {
      const errMsg = { id: Date.now() + 1, sender: "bot", text: "⚠️ Could not reach Groq API. Check your API key." }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    chatHistory.current = []
    setMessages([{
      id: "welcome",
      sender: "bot",
      text: "Hi! I'm PyBot, your coding assistant. How can I help you today?"
    }])
  }

  const handleSignOut = async () => {
    await signOut(auth)
    chatHistory.current = []
    setMessages([{
      id: "welcome",
      sender: "bot",
      text: "Hi! I'm PyBot, your coding assistant. How can I help you today?"
    }])
  }

  if (authLoading) return <LoadingScreen />
  if (!user) return <Login />

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100vh", background: "#060b18",
      fontFamily: "'Inter', 'Segoe UI', sans-serif"
    }}>

      {/* Background blobs */}
      <div style={{ position: "fixed", top: "-20%", left: "-10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(252,70,107,0.08) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: "-20%", right: "-10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(63,94,251,0.08) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* Header */}
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        style={{
          padding: "16px 24px",
          background: "rgba(15,23,42,0.8)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(252,70,107,0.15)",
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          zIndex: 10, position: "relative"
        }}
      >
        {/* Left: logo + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "linear-gradient(135deg, #fc466b, #3f5efb)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 700, color: "#fff",
              boxShadow: "0 4px 20px rgba(252,70,107,0.4)"
            }}
          >B</motion.div>
          <div>
            <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 15 }}>PyBot</div>
            <div style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }}
              />
              <span style={{ color: "#22c55e" }}>Online</span>
            </div>
          </div>
        </div>

        {/* Right: user info + buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt="avatar"
              style={{ width: 30, height: 30, borderRadius: "50%", border: "2px solid #fc466b" }}
            />
          )}
          <span style={{ color: "#94a3b8", fontSize: 12 }}>
            {user.displayName || user.email}
          </span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearChat}
            style={{
              background: "transparent",
              border: "1px solid #334155",
              borderRadius: 8, color: "#94a3b8",
              padding: "6px 12px", fontSize: 12, cursor: "pointer"
            }}
          >Clear</motion.button>
          <motion.button
            whileHover={{ scale: 1.05, borderColor: "#fc466b" }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSignOut}
            style={{
              background: "transparent",
              border: "1px solid #fc466b",
              borderRadius: 8, color: "#fc466b",
              padding: "6px 12px", fontSize: 12, cursor: "pointer"
            }}
          >Sign out</motion.button>
        </div>
      </motion.div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "24px 24px 8px",
        display: "flex", flexDirection: "column",
        position: "relative", zIndex: 1
      }}>
        <AnimatePresence>
          {messages.map(msg => <Message key={msg.id} msg={msg} />)}
          {isLoading && <TypingIndicator key="typing" />}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        style={{
          padding: "16px 24px",
          background: "rgba(15,23,42,0.8)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(63,94,251,0.15)",
          position: "relative", zIndex: 10
        }}
      >
        <motion.div
          whileFocusWithin={{ boxShadow: "0 0 0 2px rgba(252,70,107,0.3), 0 0 20px rgba(63,94,251,0.2)" }}
          style={{
            display: "flex", gap: 10, alignItems: "flex-end",
            background: "#0f172a", border: "1px solid #334155",
            borderRadius: 14, padding: "10px 14px"
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
            rows={1}
            style={{
              flex: 1, background: "transparent", border: "none",
              outline: "none", color: "#f1f5f9", fontSize: 14,
              resize: "none", lineHeight: 1.5, maxHeight: 120,
              overflowY: "auto", fontFamily: "inherit"
            }}
            onInput={e => {
              e.target.style.height = "auto"
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"
            }}
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9, rotateZ: 15 }}
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            style={{
              width: 36, height: 36, borderRadius: "50%",
              background: input.trim() && !isLoading
                ? "linear-gradient(135deg, #fc466b, #3f5efb)"
                : "#334155",
              border: "none",
              cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              boxShadow: input.trim() && !isLoading
                ? "0 4px 15px rgba(252,70,107,0.4)"
                : "none"
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>
        </motion.div>
        <div style={{ textAlign: "center", color: "#475569", fontSize: 11, marginTop: 8 }}>
          Enter to send · Shift+Enter for new line
        </div>
      </motion.div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
      `}</style>
    </div>
  )
}