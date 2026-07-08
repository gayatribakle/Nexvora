export function formatIST(isoString: string | null | undefined): string {
  if (!isoString) return '-'
  try {
    let normalized = isoString
    if (!normalized.endsWith('Z') && !normalized.includes('+') && !normalized.includes('T00:')) {
      normalized += 'Z'
    }
    const date = new Date(normalized)
    if (isNaN(date.getTime())) return isoString
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }
    const formatter = new Intl.DateTimeFormat('en-GB', options)
    const parts = formatter.formatToParts(date)
    const get = (type: string) => parts.find(p => p.type === type)?.value || ''
    const dd = get('day')
    const mm = get('month')
    const yyyy = get('year')
    const hh = get('hour')
    const min = get('minute')
    const ss = get('second')
    return `${dd}-${mm}-${yyyy} ${hh}:${min}:${ss} IST`
  } catch {
    return isoString
  }
}
