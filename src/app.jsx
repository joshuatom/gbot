import { useState, useRef, useEffect } from "react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { motion, AnimatePresence } from "framer-motion"
 
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
    if (match.index > lastIndex) parts.push({ type: "text", content: text.slice(lastIndex, match.index) })
    parts.push({ type: "code", language: match[1] || "python", content: match[2].trim() })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) parts.push({ type: "text", content: text.slice(lastIndex) })
  return parts.length > 0 ? parts : [{ type: "text", content: text }]
}
 
function Message({ msg }) {
  const isBot = msg.sender === "bot"
  const parts = parseMessage(msg.text)
 
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 32,
        rotateX: isBot ? 25 : -25,
        rotateY: isBot ? -12 : 12,
        scale: 0.88,
        z: -80
      }}
      animate={{
        opacity: 1,
        y: 0,
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        z: 0
      }}
      transition={{
        type: "spring",
        stiffness: 220,
        damping: 24,
        mass: 0.8
      }}
      style={{
        display: "flex",
        justifyContent: isBot ? "flex-start" : "flex-end",
        marginBottom: 16,
        perspective: "1200px",
        transformStyle: "preserve-3d"
      }}
    >
      {isBot && (
        <motion.div
          initial={{ scale: 0, rotateY: -180, rotateZ: -90 }}
          animate={{ scale: 1, rotateY: 0, rotateZ: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 22, delay: 0.05 }}
          whileHover={{
            scale: 1.15,
            rotateY: 15,
            rotateX: -10,
            boxShadow: "0 8px 30px rgba(178,10,44,0.5)"
          }}
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, #b20a2c, #7a0620)",
            color: "#fffbd5",
            display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 15,
            fontWeight: 800, marginRight: 10, flexShrink: 0,
            boxShadow: "0 4px 20px rgba(178,10,44,0.45), inset 0 1px 0 rgba(255,251,213,0.2)",
            fontFamily: "'Georgia', serif",
            border: "1.5px solid rgba(255,251,213,0.3)",
            transformStyle: "preserve-3d",
            cursor: "default"
          }}
        >P</motion.div>
      )}
 
      <div style={{ maxWidth: "76%", transformStyle: "preserve-3d" }}>
        {parts.map((part, i) =>
          part.type === "code" ? (
            <motion.div
              key={i}
              initial={{ opacity: 0, rotateX: 30, y: 20, scale: 0.93 }}
              animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
              transition={{ delay: i * 0.07, type: "spring", stiffness: 200, damping: 22 }}
              whileHover={{
                rotateX: -3,
                rotateY: isBot ? 2 : -2,
                scale: 1.01,
                boxShadow: "0 16px 40px rgba(178,10,44,0.3)"
              }}
              style={{
                borderRadius: 10,
                overflow: "hidden",
                marginTop: 10,
                border: "1.5px solid rgba(178,10,44,0.4)",
                boxShadow: "0 6px 24px rgba(178,10,44,0.18), 0 2px 8px rgba(0,0,0,0.4)",
                transformStyle: "preserve-3d"
              }}
            >
              <div style={{
                background: "linear-gradient(90deg, #1a0a0e, #2d1015)",
                color: "#fffbd5",
                padding: "7px 14px",
                fontSize: 11,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid rgba(178,10,44,0.35)",
                fontFamily: "'Courier New', monospace",
                letterSpacing: "0.08em"
              }}>
                <span style={{ color: "#e8a0ac", fontWeight: 600 }}>{part.language}</span>
                <motion.span
                  whileHover={{ scale: 1.1, color: "#b20a2c" }}
                  whileTap={{ scale: 0.92 }}
                  style={{ cursor: "pointer", color: "rgba(255,251,213,0.5)", transition: "color 0.2s", fontWeight: 600 }}
                  onClick={() => navigator.clipboard.writeText(part.content)}
                >Copy</motion.span>
              </div>
              <SyntaxHighlighter
                language={part.language}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  borderRadius: "0 0 8px 8px",
                  background: "#120508",
                  fontSize: 13
                }}
              >
                {part.content}
              </SyntaxHighlighter>
            </motion.div>
          ) : (
            <motion.div
              key={i}
              initial={{
                opacity: 0,
                x: isBot ? -30 : 30,
                rotateY: isBot ? -20 : 20,
                rotateX: 10,
                scale: 0.9
              }}
              animate={{ opacity: 1, x: 0, rotateY: 0, rotateX: 0, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 210,
                damping: 22,
                delay: i * 0.06
              }}
              whileHover={{
                rotateY: isBot ? 3 : -3,
                rotateX: -2,
                scale: 1.015,
                boxShadow: isBot
                  ? "0 12px 36px rgba(178,10,44,0.25)"
                  : "0 12px 36px rgba(178,10,44,0.45)"
              }}
              style={{
                padding: "11px 16px",
                borderRadius: isBot ? "4px 18px 18px 18px" : "18px 4px 18px 18px",
                background: isBot
                  ? "linear-gradient(145deg, rgba(255,251,213,0.06) 0%, rgba(255,251,213,0.02) 100%)"
                  : "linear-gradient(145deg, #b20a2c, #7a0620)",
                color: isBot ? "#fffbd5" : "#fffbd5",
                fontSize: 14.5,
                lineHeight: 1.55,
                marginTop: i > 0 ? 5 : 0,
                boxShadow: isBot
                  ? "0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,251,213,0.08)"
                  : "0 6px 28px rgba(178,10,44,0.5), inset 0 1px 0 rgba(255,251,213,0.15)",
                border: isBot
                  ? "1.5px solid rgba(255,251,213,0.1)"
                  : "1.5px solid rgba(255,251,213,0.2)",
                transformStyle: "preserve-3d",
                fontFamily: "'Georgia', 'Times New Roman', serif",
                letterSpacing: "0.01em"
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
      initial={{ opacity: 0, y: 16, rotateX: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, rotateX: -15, scale: 0.92 }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      style={{ display: "flex", alignItems: "center", marginBottom: 14 }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        background: "linear-gradient(135deg, #b20a2c, #7a0620)",
        color: "#fffbd5",
        display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 15,
        fontWeight: 800, marginRight: 10, flexShrink: 0,
        boxShadow: "0 4px 18px rgba(178,10,44,0.45)",
        fontFamily: "'Georgia', serif",
        border: "1.5px solid rgba(255,251,213,0.3)"
      }}>P</div>
      <div style={{
        padding: "12px 18px",
        borderRadius: "4px 18px 18px 18px",
        background: "rgba(255,251,213,0.04)",
        border: "1.5px solid rgba(255,251,213,0.1)",
        display: "flex", gap: 5, alignItems: "center",
        boxShadow: "0 4px 16px rgba(0,0,0,0.3)"
      }}>
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ y: [0, -6, 0], scaleY: [1, 0.7, 1] }}
            transition={{ repeat: Infinity, duration: 1.0, delay: i * 0.18, ease: "easeInOut" }}
            style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "linear-gradient(135deg, #b20a2c, #e84060)"
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}
 
export default function App() {
  const [messages, setMessages] = useState([
    { id: 1, sender: "bot", text: "Hi! I'm PyBot, your coding assistant. How can I help you today?" }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const chatHistory = useRef([])
 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])
 
  const sendMessage = async () => {
    const text = input.trim()
    if (!text || isLoading) return
    const userMsg = { id: Date.now(), sender: "user", text }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsLoading(true)
    chatHistory.current.push({ role: "user", content: text })
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1024,
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...chatHistory.current]
        })
      })
      const data = await response.json()
      const reply = data.choices[0].message.content
      chatHistory.current.push({ role: "assistant", content: reply })
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: "bot", text: reply }])
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: "bot", text: "⚠️ Could not reach Groq API. Check your API key." }])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }
 
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }
 
  const clearChat = () => {
    chatHistory.current = []
    setMessages([{ id: 1, sender: "bot", text: "Hi! I'm PyBot, your coding assistant. How can I help you today?" }])
  }
 
  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      background: "#0f0305",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      perspective: "1000px"
    }}>
 
      {/* Atmospheric background layers */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `
          radial-gradient(ellipse 70% 50% at 20% 10%, rgba(178,10,44,0.12) 0%, transparent 60%),
          radial-gradient(ellipse 60% 60% at 80% 90%, rgba(255,251,213,0.04) 0%, transparent 55%),
          radial-gradient(ellipse 40% 40% at 50% 50%, rgba(178,10,44,0.04) 0%, transparent 70%)
        `
      }} />
 
      {/* Subtle grain texture overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1,
        opacity: 0.025,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: "180px"
      }} />
 
      {/* Fine horizontal rule lines for editorial texture */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1,
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(255,251,213,0.012) 28px, rgba(255,251,213,0.012) 29px)"
      }} />
 
      {/* Header */}
      <motion.div
        initial={{ y: -70, opacity: 0, rotateX: 30 }}
        animate={{ y: 0, opacity: 1, rotateX: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 22 }}
        style={{
          padding: "14px 28px",
          background: "rgba(15,3,5,0.85)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(178,10,44,0.25)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          zIndex: 10, position: "relative",
          boxShadow: "0 4px 30px rgba(0,0,0,0.4), 0 1px 0 rgba(178,10,44,0.15)"
        }}
      >
        {/* Logo / Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <motion.div
            whileHover={{ scale: 1.12, rotateY: 20, rotateX: -10 }}
            whileTap={{ scale: 0.93, rotateZ: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "linear-gradient(135deg, #b20a2c 0%, #7a0620 60%, #3d0010 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 17, fontWeight: 800, color: "#fffbd5",
              boxShadow: "0 0 0 1.5px rgba(255,251,213,0.2), 0 6px 24px rgba(178,10,44,0.6)",
              transformStyle: "preserve-3d",
              cursor: "default",
              letterSpacing: "-0.02em"
            }}
          >P</motion.div>
          <div>
            <div style={{
              color: "#fffbd5", fontWeight: 700, fontSize: 17,
              letterSpacing: "0.12em", textTransform: "uppercase",
              textShadow: "0 2px 12px rgba(178,10,44,0.5)",
              fontFamily: "'Georgia', serif"
            }}>PyBot</div>
            <div style={{ fontSize: 10.5, display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
              <motion.span
                animate={{
                  scale: [1, 1.4, 1],
                  boxShadow: ["0 0 0px rgba(178,10,44,0)", "0 0 8px rgba(178,10,44,0.8)", "0 0 0px rgba(178,10,44,0)"]
                }}
                transition={{ repeat: Infinity, duration: 2.2 }}
                style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "#b20a2c", display: "inline-block",
                  border: "1px solid rgba(255,251,213,0.4)"
                }}
              />
              <span style={{ color: "rgba(255,251,213,0.55)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Courier New', monospace" }}>Active</span>
            </div>
          </div>
        </div>
 
        {/* Decorative center line */}
        <div style={{
          position: "absolute", left: "50%", transform: "translateX(-50%)",
          display: "flex", alignItems: "center", gap: 10
        }}>
          <div style={{ width: 40, height: 1, background: "linear-gradient(90deg, transparent, rgba(178,10,44,0.5))" }} />
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(178,10,44,0.6)", border: "1px solid rgba(255,251,213,0.2)" }} />
          <div style={{ width: 40, height: 1, background: "linear-gradient(90deg, rgba(178,10,44,0.5), transparent)" }} />
        </div>
 
        <motion.button
          whileHover={{ scale: 1.05, rotateX: -5, borderColor: "rgba(178,10,44,0.8)", color: "#fffbd5" }}
          whileTap={{ scale: 0.93, rotateX: 5 }}
          onClick={clearChat}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,251,213,0.15)",
            borderRadius: 7, color: "rgba(255,251,213,0.45)",
            padding: "6px 14px", fontSize: 11, cursor: "pointer",
            transition: "all 0.2s",
            fontFamily: "'Courier New', monospace",
            letterSpacing: "0.1em", textTransform: "uppercase",
            transformStyle: "preserve-3d"
          }}
        >Clear</motion.button>
      </motion.div>
 
      {/* Messages area */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "28px 28px 12px",
        display: "flex", flexDirection: "column",
        position: "relative", zIndex: 2
      }}>
        <AnimatePresence>
          {messages.map(msg => <Message key={msg.id} msg={msg} />)}
          {isLoading && <TypingIndicator key="typing" />}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
 
      {/* Input area */}
      <motion.div
        initial={{ y: 70, opacity: 0, rotateX: -20 }}
        animate={{ y: 0, opacity: 1, rotateX: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 22 }}
        style={{
          padding: "16px 28px 20px",
          background: "rgba(15,3,5,0.9)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(178,10,44,0.2)",
          position: "relative", zIndex: 10,
          boxShadow: "0 -4px 30px rgba(0,0,0,0.4)"
        }}
      >
        <motion.div
          whileFocusWithin={{
            boxShadow: "0 0 0 1.5px rgba(178,10,44,0.6), 0 0 30px rgba(178,10,44,0.15)",
            borderColor: "rgba(178,10,44,0.5)"
          }}
          style={{
            display: "flex", gap: 12, alignItems: "flex-end",
            background: "rgba(255,251,213,0.025)",
            border: "1px solid rgba(255,251,213,0.1)",
            borderRadius: 12, padding: "11px 14px",
            transition: "box-shadow 0.3s, border-color 0.3s"
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about code…"
            rows={1}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: "#fffbd5", fontSize: 14, resize: "none", lineHeight: 1.55,
              maxHeight: 120, overflowY: "auto",
              fontFamily: "'Georgia', serif",
              letterSpacing: "0.01em"
            }}
            onInput={e => {
              e.target.style.height = "auto"
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"
            }}
          />
          <motion.button
            whileHover={input.trim() && !isLoading ? {
              scale: 1.12,
              rotateY: 15,
              rotateX: -8,
              boxShadow: "0 8px 30px rgba(178,10,44,0.7)"
            } : {}}
            whileTap={input.trim() && !isLoading ? {
              scale: 0.88,
              rotateZ: 12,
              rotateX: 8
            } : {}}
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            style={{
              width: 38, height: 38, borderRadius: "50%",
              background: input.trim() && !isLoading
                ? "linear-gradient(135deg, #b20a2c, #7a0620)"
                : "rgba(255,251,213,0.06)",
              border: input.trim() && !isLoading
                ? "1.5px solid rgba(255,251,213,0.25)"
                : "1px solid rgba(255,251,213,0.08)",
              cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              boxShadow: input.trim() && !isLoading
                ? "0 4px 18px rgba(178,10,44,0.55), inset 0 1px 0 rgba(255,251,213,0.15)"
                : "none",
              transformStyle: "preserve-3d"
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke={input.trim() && !isLoading ? "#fffbd5" : "rgba(255,251,213,0.25)"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={input.trim() && !isLoading ? "#fffbd5" : "rgba(255,251,213,0.25)"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
        </motion.div>
 
        <div style={{
          textAlign: "center", color: "rgba(255,251,213,0.2)",
          fontSize: 10.5, marginTop: 9,
          fontFamily: "'Courier New', monospace",
          letterSpacing: "0.1em", textTransform: "uppercase"
        }}>
          Enter to send · Shift+Enter for new line
        </div>
      </motion.div>
 
      <style>{`
        * { box-sizing: border-box; }
        ::placeholder { color: rgba(255,251,213,0.22) !important; font-family: 'Georgia', serif; font-style: italic; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(178,10,44,0.5); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #b20a2c; }
      `}</style>
    </div>
  )
}