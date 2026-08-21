export function mediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined
  if (path.startsWith('http')) return path
  // يمر عبر API عشان يشتغل في Codespaces
  return `/api/Public/image?path=${encodeURIComponent(path)}`
}
