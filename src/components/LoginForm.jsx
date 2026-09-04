import { useState } from 'react'
import { useApp } from '../context/AppContext'

const field =
  'w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200'

export default function LoginForm({ onSwitchToRegister }) {
  const { login, logout } = useApp()
  const [role, setRole] = useState('cashier')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const session = await login(username, password)
      if (!session) {
        setError('Wrong username or password.')
      } else if (session.role !== role) {
        logout()
        setError(
          `That account is ${session.role === 'admin' ? 'an admin' : 'a cashier'} account — switch the tab above and try again.`,
        )
      }
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

      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
        {[
          { id: 'cashier', label: 'Cashier' },
          { id: 'admin', label: 'Admin' },
        ].map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => {
              setRole(r.id)
              setError('')
            }}
            className={`rounded-lg py-2 text-sm font-semibold transition ${
              role === r.id
                ? 'bg-white text-teal-700 shadow'
                : 'text-slate-500 active:text-slate-700'
            }`}
          >
            {r.label}
          </button>
        ))}
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
          {busy ? 'Signing in…' : `Sign in as ${role === 'admin' ? 'admin' : 'cashier'}`}
        </button>
      </form>

      {role === 'cashier' && (
        <button
          onClick={onSwitchToRegister}
          className="mt-4 text-center text-sm font-medium text-teal-600"
        >
          New cashier? Create an account
        </button>
      )}
    </div>
  )
}
