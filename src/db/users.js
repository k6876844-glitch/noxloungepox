import { getDB, STORES, newId } from './db'
import { hashPassword, verifyPassword } from '../lib/auth'

export async function getAllUsers() {
  const db = await getDB()
  return db.getAll(STORES.USERS)
}

export async function hasAdminUser() {
  const users = await getAllUsers()
  return users.some((u) => u.role === 'admin')
}

export async function getUserByUsername(username) {
  const db = await getDB()
  return db.getFromIndex(STORES.USERS, 'usernameLower', username.trim().toLowerCase())
}

export async function registerUser({ username, password, role }) {
  const name = username.trim()
  if (!name) throw new Error('Username is required.')
  if (!password || password.length < 4) {
    throw new Error('Password must be at least 4 characters.')
  }
  if (await getUserByUsername(name)) {
    throw new Error('That username is already taken.')
  }

  const { hash, salt } = await hashPassword(password)
  const user = {
    id: newId(),
    username: name,
    usernameLower: name.toLowerCase(),
    passwordHash: hash,
    salt,
    role,
    createdAt: new Date().toISOString(),
  }

  const db = await getDB()
  try {
    await db.add(STORES.USERS, user)
  } catch (err) {
    if (err?.name === 'ConstraintError') {
      throw new Error('That username is already taken.')
    }
    throw err
  }
  return user
}

export async function verifyLogin(username, password) {
  const user = await getUserByUsername(username)
  if (!user) return null
  const ok = await verifyPassword(password, user.salt, user.passwordHash)
  return ok ? user : null
}
