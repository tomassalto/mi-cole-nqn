import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

declare global {
  namespace Express {
    interface Request {
      userId?: string
      username?: string
    }
  }
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET env var is required')
  return secret
}

interface JwtPayload {
  userId: string
  username: string
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token requerido' })
    return
  }

  try {
    const decoded = jwt.verify(header.slice(7), getJwtSecret()) as JwtPayload
    req.userId = decoded.userId
    req.username = decoded.username
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido' })
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(header.slice(7), getJwtSecret()) as JwtPayload
      req.userId = decoded.userId
      req.username = decoded.username
    } catch {
      // Token invalid — just proceed without auth
    }
  }
  next()
}
