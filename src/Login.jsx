import { useState } from "react"
import { motion } from "framer-motion"
import { auth, googleProvider } from "./firebase"
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState("")

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEmail = async () => {
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#060b18", fontFamily: "'Inter', sans-serif" }}>

      {/* Background blobs */}
      <div style={{ position: "fixed", top: "-20%", left: "-10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(252,70,107,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-20%", right: "-10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(63,94,251,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

      <motion.div
        initial={{ opacity: 0, y: 40, rotateX: 15 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        style={{ width: 380, background: "rgba(15,23,42,0.9)", backdropFilter: "blur(12px)", borderRadius: 20, border: "1px solid rgba(252,70,107,0.15)", padding: 32 }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
            style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #fc466b, #3f5efb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: "#fff", margin: "0 auto 12px", boxShadow: "0 8px 32px rgba(252,70,107,0.4)" }}
          >B</motion.div>
          <div style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 700 }}>PyBot</div>
          <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
            {isSignUp ? "Create your account" : "Welcome back"}
          </div>
        </div>

        {/* Google button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGoogle}
          style={{ width: "100%", padding: "11px 0", borderRadius: 10, background: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 14, fontWeight: 500, color: "#1e293b", marginBottom: 20 }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.3-.1-2.7-.4-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36.5 24 36.5c-5.2 0-9.6-3.5-11.2-8.2l-6.5 5C9.5 39.5 16.3 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.8l6.2 5.2C40.8 35.5 44 30.2 44 24c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          Continue with Google
        </motion.button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: "#1e293b" }} />
          <span style={{ color: "#475569", fontSize: 12 }}>or</span>
          <div style={{ flex: 1, height: 1, background: "#1e293b" }} />
        </div>

        {/* Email & Password */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: "100%", padding: "11px 14px", borderRadius: 10, background: "#0f172a", border: "1px solid #334155", color: "#f1f5f9", fontSize: 14, outline: "none", marginBottom: 10, boxSizing: "border-box" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleEmail()}
          style={{ width: "100%", padding: "11px 14px", borderRadius: 10, background: "#0f172a", border: "1px solid #334155", color: "#f1f5f9", fontSize: 14, outline: "none", marginBottom: 16, boxSizing: "border-box" }}
        />

        {error && (
          <div style={{ color: "#fc466b", fontSize: 12, marginBottom: 12, textAlign: "center" }}>
            {error}
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleEmail}
          style={{ width: "100%", padding: "11px 0", borderRadius: 10, background: "linear-gradient(135deg, #fc466b, #3f5efb)", border: "none", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 20px rgba(252,70,107,0.3)" }}
        >
          {isSignUp ? "Create Account" : "Sign In"}
        </motion.button>

        <div style={{ textAlign: "center", marginTop: 16, color: "#64748b", fontSize: 13 }}>
          {isSignUp ? "Already have an account?" : "Don't have an account?"}
          <span
            onClick={() => { setIsSignUp(!isSignUp); setError("") }}
            style={{ color: "#fc466b", cursor: "pointer", marginLeft: 5 }}
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </span>
        </div>
      </motion.div>
    </div>
  )
}