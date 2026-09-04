import { useState } from 'react'
import { useApp } from '../context/AppContext'

const field =
  'w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200'

/**
 * `role` is the account type being created ('cashier' | 'admin'), picked on
 * the login screen's tab before switching here. `firstRun` is only true on
 * the very first launch (no admin account exists yet) — that run has no
 * "sign in" link, since there's nothing to sign into yet.
 */
export default function RegisterForm({ role, firstRun, onSwitchToLogin }) {
  const { register } = useApp()
  const isAdmin = role === 'admin'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) return setError('Passwords do not match.')
    setBusy(true)
    try {
      await register({ username, password, role })
    } catch (err) {
      setError(err.message || 'Could not create that account.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-xs flex-col justify-center p-6">
      <div className="mb-6 text-center">
        <div className="mb-2 text-4xl">{isAdmin ? '👑' : '🍸'}</div>
        <h1 className="text-lg font-semibold text-slate-800">
          {firstRun
            ? 'Set up the admin account'
            : isAdmin
              ? 'Create an admin account'
              : 'Create your cashier account'}
        </h1>
        <p className="text-sm text-slate-400">
          {isAdmin
            ? 'Full access to the menu, dashboard and settings.'
            : 'Pick your own username and password.'}
        </p>
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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          className={field}
          type="password"
          placeholder="Confirm password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error && <p className="text-sm font-medium text-rose-500">{error}</p>}
        <button
          disabled={busy || !username || !password || !confirm}
          className="w-full rounded-xl bg-teal-600 py-3 font-bold text-white active:bg-teal-700 disabled:opacity-40"
        >
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>

      {!firstRun && (
        <button
          onClick={onSwitchToLogin}
          className="mt-4 text-center text-sm font-medium text-teal-600"
        >
          Already have an account? Sign in
        </button>
      )}
    </div>
  )
}
