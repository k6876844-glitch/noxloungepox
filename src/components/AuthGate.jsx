import { useEffect, useState } from 'react'
import { hasAdminUser } from '../db/users'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'

/**
 * Shown whenever nobody is signed in. On the very first run (no admin
 * account exists yet) it forces the admin setup form; after that it's a
 * normal login screen with links to self-register a cashier or admin
 * account, whichever tab is selected.
 */
export default function AuthGate() {
  const [checking, setChecking] = useState(true)
  const [firstRun, setFirstRun] = useState(false)
  const [mode, setMode] = useState('login')
  const [registerRole, setRegisterRole] = useState('cashier')

  useEffect(() => {
    hasAdminUser().then((has) => {
      setFirstRun(!has)
      setMode(has ? 'login' : 'register')
      setRegisterRole('admin')
      setChecking(false)
    })
  }, [])

  if (checking) {
    return <div className="grid h-full place-items-center text-slate-400">Loading…</div>
  }

  return mode === 'register' ? (
    <RegisterForm
      role={registerRole}
      firstRun={firstRun}
      onSwitchToLogin={() => setMode('login')}
    />
  ) : (
    <LoginForm
      onSwitchToRegister={(role) => {
        setRegisterRole(role)
        setMode('register')
      }}
    />
  )
}
