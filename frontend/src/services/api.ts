const BASE = '/api'

export function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('micole-auth-token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(BASE + path, { headers: authHeaders() })
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('micole-auth-token')
      window.dispatchEvent(new Event('micole-auth-expired'))
    }
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export { apiFetch }
