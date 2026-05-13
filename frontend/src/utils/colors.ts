// ── Colores de líneas ─────────────────────────────────────────────────────

const COLORS = [
  '#E53935',
  '#1E88E5',
  '#43A047',
  '#FB8C00',
  '#8E24AA',
  '#00ACC1',
  '#F4511E',
  '#039BE5',
  '#7CB342',
  '#FFB300',
]

export function routeColor(name: string): string {
  let h = 0
  for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) | 0
  return COLORS[Math.abs(h) % COLORS.length]
}
