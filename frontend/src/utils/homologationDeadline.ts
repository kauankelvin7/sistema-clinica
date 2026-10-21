/** Prazo de 48h, excluindo integralmente sábados e domingos.
 * Como o atestado tem somente DATA, a contagem parte de 00h00 dessa data.
 * O backend é a fonte de verdade (America/Sao_Paulo).
 */

function certificateDeadlineAsCalendarUtc(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const issue = new Date(Date.UTC(year, month - 1, day))
  if (
    issue.getUTCFullYear() !== year ||
    issue.getUTCMonth() !== month - 1 ||
    issue.getUTCDate() !== day
  ) return null

  let countedHours = 0
  while (countedHours < 48) {
    if (issue.getUTCDay() !== 0 && issue.getUTCDay() !== 6) {
      countedHours += 24
    }
    issue.setUTCDate(issue.getUTCDate() + 1)
  }
  return issue
}

/** Visualização antecipada no cliente; a API recalcula ao emitir. */
export function requiresLateAuthorization(certificateDate: string, now = new Date()): boolean {
  const deadline = certificateDeadlineAsCalendarUtc(certificateDate)
  if (!deadline) return false

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Sao_Paulo', year: 'numeric',
    month: '2-digit', day: '2-digit', hour: '2-digit',
    minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(now)
  const component = (name: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((item) => item.type === name)?.value ?? 0)
  const localClock = Date.UTC(
    component('year'), component('month') - 1, component('day'),
    component('hour'), component('minute'), component('second'),
    now.getUTCMilliseconds(),
  )
  return localClock > deadline.getTime()
}
