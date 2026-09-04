import { useState } from 'react'
import { useApp } from '../context/AppContext'

const field =
  'w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200'

export default function LoginForm({ onSwitchToRegister }) {
  const { login } = useApp()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const ok = await login(username, password)
      if (!ok) setError('Wrong username or password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-xs flex-col justify-center p-6">
      <div className="mb-6 text-center">
        <div className="mb-2 text-4xl">🍸</div>
        <h1 className="text-lg font-semibold text-slate-800">Nox Lounge POS</h1>
        <p className="text-sm text-slate-400">Sign in to start your shift.</p>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <input
          className={field}
          placeholder="Username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className={field}
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm font-medium text-rose-500">{error}</p>}
        <button
          disabled={busy || !username || !password}
          className="w-full rounded-xl bg-teal-600 py-3 font-bold text-white active:bg-teal-700 disabled:opacity-40"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <button
        onClick={onSwitchToRegister}
        className="mt-4 text-center text-sm font-medium text-teal-600"
      >
        New cashier? Create an account
      </button>
    </div>
  )
}
