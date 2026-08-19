/** Resolve uploaded asset path for display */
export function mediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined
  if (path.startsWith('http')) return path
  return path.startsWith('/') ? path : `/${path}`
}
