import { Router } from 'express'
import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../db'
import { requireAuth, getJwtSecret } from '../middleware/auth'

const router = Router()

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/

function signToken(userId: string, username: string): string {
  return jwt.sign({ userId, username }, getJwtSecret())
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string }

  if (!username || !USERNAME_RE.test(username)) {
    return res.status(400).json({ error: 'Username debe tener 3-20 caracteres (letras, números, _)' })
  }
  if (!password || password.length < 4) {
    return res.status(400).json({ error: 'Password debe tener al menos 4 caracteres' })
  }

  // Check if username is taken
  const existing = await db.execute({
    sql: 'SELECT id FROM users WHERE username = ? COLLATE NOCASE',
    args: [username],
  })
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'Ese usuario ya existe' })
  }

  const id = randomUUID()
  const hashed = await bcrypt.hash(password, 10)

  await db.execute({
    sql: `INSERT INTO users (id, username, password) VALUES (?, ?, ?)`,
    args: [id, username, hashed],
  })

  const token = signToken(id, username)
  res.json({ token, user: { id, username } })
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string }

  if (!username || !password) {
    return res.status(400).json({ error: 'Username y password son requeridos' })
  }

  const result = await db.execute({
    sql: 'SELECT id, username, password FROM users WHERE username = ? COLLATE NOCASE',
    args: [username],
  })

  const user = result.rows[0]
  if (!user) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
  }

  const valid = await bcrypt.compare(password, user.password as string)
  if (!valid) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
  }

  const token = signToken(user.id as string, user.username as string)
  res.json({ token, user: { id: user.id, username: user.username } })
})

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ id: req.userId, username: req.username })
})

export default router
