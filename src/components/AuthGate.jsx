import { useEffect, useState } from 'react'
import { hasAdminUser } from '../db/users'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'

/**
 * Shown whenever nobody is signed in. On the very first run (no admin
 * account exists yet) it forces the admin setup form; after that it's a
 * normal login screen with a link to self-register a cashier account.
 */
export default function AuthGate() {
  const [checking, setChecking] = useState(true)
  const [needsAdmin, setNeedsAdmin] = useState(false)
  const [mode, setMode] = useState('login')

  useEffect(() => {
    hasAdminUser().then((has) => {
      setNeedsAdmin(!has)
      setMode(has ? 'login' : 'register')
      setChecking(false)
    })
  }, [])

  if (checking) {
    return <div className="grid h-full place-items-center text-slate-400">Loading…</div>
  }

  return mode === 'register' ? (
    <RegisterForm forceAdmin={needsAdmin} onSwitchToLogin={() => setMode('login')} />
  ) : (
    <LoginForm onSwitchToRegister={() => setMode('register')} />
  )
}
