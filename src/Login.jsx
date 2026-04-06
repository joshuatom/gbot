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
    <div style={{
      display: "flex",
      height: "100vh",
      alignItems: "center",
      justifyContent: "center",
      background: "#fffbd5",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      position: "relative",
      overflow: "hidden"
    }}>

      {/* Decorative background shapes */}
      <div style={{
        position: "fixed", top: -80, right: -80,
        width: 320, height: 320, borderRadius: "50%",
        background: "rgba(178,10,44,0.08)",
        pointerEvents: "none"
      }} />
      <div style={{
        position: "fixed", bottom: -60, left: -60,
        width: 260, height: 260, borderRadius: "50%",
        background: "rgba(178,10,44,0.06)",
        pointerEvents: "none"
      }} />
      <div style={{
        position: "fixed", top: "40%", left: "8%",
        width: 4, height: 120,
        background: "rgba(178,10,44,0.15)",
        pointerEvents: "none"
      }} />
      <div style={{
        position: "fixed", bottom: "20%", right: "10%",
        width: 4, height: 80,
        background: "rgba(178,10,44,0.1)",
        pointerEvents: "none"
      }} />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 22 }}
        style={{
          width: 400,
          background: "#fff8cc",
          borderRadius: 4,
          border: "1.5px solid rgba(178,10,44,0.25)",
          padding: "40px 36px",
          boxShadow: "6px 6px 0px rgba(178,10,44,0.12)",
          position: "relative"
        }}
      >
        {/* Top rule */}
        <div style={{
          position: "absolute", top: 0, left: 36, right: 36, height: 3,
          background: "#b20a2c", borderRadius: "0 0 2px 2px"
        }} />

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <motion.div
            animate={{ rotate: [0, 3, -3, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "#b20a2c",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 700, color: "#fffbd5",
              margin: "0 auto 14px",
              letterSpacing: "-0.5px"
            }}
          >B</motion.div>
          <div style={{ color: "#1a0a0d", fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px" }}>
            PyBot
          </div>
          <div style={{ color: "#8a5060", fontSize: 13, marginTop: 5, fontFamily: "'Georgia', serif", fontStyle: "italic" }}>
            {isSignUp ? "Create your account" : "Welcome back"}
          </div>
        </div>

        {/* Google button */}
        <motion.button
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          onClick={handleGoogle}
          style={{
            width: "100%", padding: "11px 0", borderRadius: 4,
            background: "#fffbd5",
            border: "1.5px solid rgba(178,10,44,0.3)",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            fontSize: 14, fontWeight: 500, color: "#1a0a0d",
            marginBottom: 20,
            fontFamily: "'Georgia', serif",
            transition: "border-color 0.2s, background 0.2s"
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.3-.1-2.7-.4-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36.5 24 36.5c-5.2 0-9.6-3.5-11.2-8.2l-6.5 5C9.5 39.5 16.3 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.8l6.2 5.2C40.8 35.5 44 30.2 44 24c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          Continue with Google
        </motion.button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(178,10,44,0.2)" }} />
          <span style={{ color: "#b20a2c", fontSize: 11, letterSpacing: "0.1em", fontFamily: "'Georgia', serif" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "rgba(178,10,44,0.2)" }} />
        </div>

        {/* Inputs */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{
            width: "100%", padding: "11px 14px", borderRadius: 4,
            background: "#fffbd5",
            border: "1.5px solid rgba(178,10,44,0.25)",
            color: "#1a0a0d", fontSize: 14,
            outline: "none", marginBottom: 10, boxSizing: "border-box",
            fontFamily: "'Georgia', serif",
            transition: "border-color 0.2s"
          }}
          onFocus={e => e.target.style.borderColor = "#b20a2c"}
          onBlur={e => e.target.style.borderColor = "rgba(178,10,44,0.25)"}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleEmail()}
          style={{
            width: "100%", padding: "11px 14px", borderRadius: 4,
            background: "#fffbd5",
            border: "1.5px solid rgba(178,10,44,0.25)",
            color: "#1a0a0d", fontSize: 14,
            outline: "none", marginBottom: 18, boxSizing: "border-box",
            fontFamily: "'Georgia', serif",
            transition: "border-color 0.2s"
          }}
          onFocus={e => e.target.style.borderColor = "#b20a2c"}
          onBlur={e => e.target.style.borderColor = "rgba(178,10,44,0.25)"}
        />

        {error && (
          <div style={{ color: "#b20a2c", fontSize: 12, marginBottom: 12, textAlign: "center", fontStyle: "italic" }}>
            {error}
          </div>
        )}

        {/* Primary button */}
        <motion.button
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          onClick={handleEmail}
          style={{
            width: "100%", padding: "12px 0", borderRadius: 4,
            background: "#b20a2c",
            border: "none", color: "#fffbd5",
            fontSize: 14, fontWeight: 600, cursor: "pointer",
            fontFamily: "'Georgia', serif",
            letterSpacing: "0.03em",
            boxShadow: "3px 3px 0px rgba(178,10,44,0.3)"
          }}
        >
          {isSignUp ? "Create Account" : "Sign In"}
        </motion.button>

        {/* Toggle */}
        <div style={{ textAlign: "center", marginTop: 18, color: "#8a5060", fontSize: 13, fontFamily: "'Georgia', serif" }}>
          {isSignUp ? "Already have an account?" : "Don't have an account?"}
          <span
            onClick={() => { setIsSignUp(!isSignUp); setError("") }}
            style={{ color: "#b20a2c", cursor: "pointer", marginLeft: 5, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </span>
        </div>
      </motion.div>
    </div>
  )
}