export function asUtc(value: string | Date): Date {
  if (value instanceof Date) return value
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}Z`
  return new Date(normalized)
}

export function localTime(value: string | Date): string {
  return asUtc(value).toLocaleTimeString('ar-EG')
}

export function localDateTime(value: string | Date): string {
  return asUtc(value).toLocaleString('ar-EG')
}

export function localDate(value: string | Date): string {
  return asUtc(value).toLocaleDateString('ar-EG')
}
