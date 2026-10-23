/**
 * LEAD STAGES — the five steps a lead goes through, and everything the leads screen says about them: labels,
 * colours, the one-line "what to do", the button each row shows, the empty message, how the old dashboard links
 * (?status=, ?followUpState=) map onto a step, and the dates in the table. Pure functions, no React.
 *
 * The server works the stage out (Helpers/leadStage.helper.js) and counts every step in `summary.stages`.
 */

export const STAGES = [
    {
        key: 'new',
        step: 1,
        label: 'New',
        hint: 'Call and verify',
        explain: 'Just came in by email, Facebook or by hand. Call the guest and check the enquiry is real.',
        color: '#b45309',
        bg: '#fffbeb',
        action: { label: 'Verify', kind: 'verify' },
        detail: 'Not verified yet',
        empty: 'No new leads — new enquiries from email and Facebook land here.'
    },
    {
        key: 'verified',
        step: 2,
        label: 'Verified',
        hint: 'Build the quotation',
        explain: 'A genuine enquiry. Build the quotation: guest details, hotels and prices.',
        color: '#2563eb',
        bg: '#eff6ff',
        action: { label: 'Build quote', kind: 'quote' },
        detail: 'Ready for a quotation',
        empty: 'No verified leads waiting — verify a new lead and it moves here, ready for a quotation.'
    },
    {
        key: 'quoting',
        step: 3,
        label: 'Quote in progress',
        hint: 'Finish and send it',
        explain: 'Guest details or prices are saved, but the quotation has not been emailed yet.',
        color: '#7c3aed',
        bg: '#f5f3ff',
        action: { label: 'Continue quote', kind: 'quote' },
        detail: 'Quote not sent yet',
        empty: 'No quotations in progress — start one from a verified lead.'
    },
    {
        key: 'sent',
        step: 4,
        label: 'Quote sent',
        hint: 'Follow up, then convert',
        explain: 'The quotation went to the guest. Follow up and, once they agree, convert it to a booking.',
        color: '#0e7490',
        bg: '#ecfeff',
        action: { label: 'Open quote', kind: 'quote' },
        detail: 'Quote sent',
        empty: 'No quotations waiting on the guest — sent quotations show here until they are booked.'
    },
    {
        key: 'booked',
        step: 5,
        label: 'Booked',
        hint: 'Manage the booking',
        explain: 'Converted into a booking. Hotels, transport, payments and the voucher are on the booking.',
        color: '#15803d',
        bg: '#f0fdf4',
        action: { label: 'Open booking', kind: 'booking' },
        detail: 'Converted to a booking',
        empty: 'No bookings yet — convert a sent quotation once the guest agrees.'
    }
]

export const STAGE_KEYS = STAGES.map(stage => stage.key)
export const ALL = 'all'

export const isStage = value => STAGE_KEYS.includes(value)

/** @returns {object} the stage's meta; an unknown stage reads as New, which is what the server calls it */
export const stageMeta = key => STAGES.find(stage => stage.key === key) || STAGES[0]

/**
 * @description the one button a row shows: what to do next and where it goes
 * @returns {{ label: string, kind: 'verify'|'quote'|'booking', to: string|null }}
 */
export const nextAction = row => {
    const { action } = stageMeta(row?.stage)
    if (action.kind === 'verify') return { ...action, to: null }
    if (action.kind === 'booking') return { ...action, to: `/process/packages/${row.id}` }
    return { ...action, to: `/process/guest/add/${row.id}` }
}

export const FOLLOW_UPS = [
    {
        key: 'Overdue',
        label: 'Overdue',
        meaning: 'No update for 5 days or more — call them today.',
        color: '#dc2626',
        bg: '#fef2f2'
    },
    {
        key: 'Due Today',
        label: 'Due Today',
        meaning: 'Last update 2–4 days ago — follow up today.',
        color: '#b45309',
        bg: '#fffbeb'
    },
    {
        key: 'Upcoming',
        label: 'Upcoming',
        meaning: 'Updated in the last 2 days — nothing due yet.',
        color: '#2563eb',
        bg: '#eff6ff'
    },
    {
        key: 'On Track',
        label: 'On Track',
        meaning: 'Verified or booked — no chasing needed.',
        color: '#15803d',
        bg: '#f0fdf4'
    }
]

export const FOLLOW_UP_HELP = FOLLOW_UPS.map(item => `${item.label}: ${item.meaning}`).join('\n')

export const followUpMeta = key =>
    FOLLOW_UPS.find(item => item.key === key) || {
        key,
        label: key || '—',
        meaning: '',
        color: '#475569',
        bg: '#f1f5f9'
    }

export const isFollowUp = value => FOLLOW_UPS.some(item => item.key === value)

// ? the dashboard and older links filter by the stored status
const STATUS_TO_STAGE = { verified: 'verified', Verified: 'verified', Confirmed: 'booked', Pending: 'new' }

/** @description a user id from the address bar ("12"), or '' — anything else is ignored */
export const userIdOf = value => (/^[1-9]\d*$/.test(String(value ?? '')) ? String(value) : '')

/**
 * @description what the address bar asks for: ?stage= wins, else the old ?status=; ?followUpState= and
 * ?assignedTo= as is
 * @param {string} search location.search
 * @returns {{ stage: string, followUpState: string, assignedTo: string }} 'all' / '' when not asked for
 */
export const filtersFromSearch = search => {
    const params = new URLSearchParams(search || '')
    const stage = params.get('stage')
    const status = params.get('status')
    const followUp = params.get('followUpState')
    let chosen = ALL
    if (isStage(stage)) chosen = stage
    else if (status && STATUS_TO_STAGE[status]) chosen = STATUS_TO_STAGE[status]
    return {
        stage: chosen,
        followUpState: isFollowUp(followUp) ? followUp : '',
        assignedTo: userIdOf(params.get('assignedTo'))
    }
}

/**
 * @description the address bar after choosing a step, follow-up or person: ?stage= replaces the old ?status=
 * @returns {string} '' or '?…'
 */
export const searchWithFilters = (search, { stage, followUpState, assignedTo }) => {
    const params = new URLSearchParams(search || '')
    params.delete('status')
    if (isStage(stage)) params.set('stage', stage)
    else params.delete('stage')
    if (isFollowUp(followUpState)) params.set('followUpState', followUpState)
    else params.delete('followUpState')
    if (userIdOf(assignedTo)) params.set('assignedTo', userIdOf(assignedTo))
    else params.delete('assignedTo')
    const text = params.toString()
    return text ? `?${text}` : ''
}

/**
 * @description the table's query string plus the step, follow-up and person the server filters by
 */
export const withLeadFilters = (query, { stage, followUpState, assignedTo }) => {
    const extra = new URLSearchParams()
    if (isStage(stage)) extra.set('stage', stage)
    if (isFollowUp(followUpState)) extra.set('followUpState', followUpState)
    if (userIdOf(assignedTo)) extra.set('assignedTo', userIdOf(assignedTo))
    const text = extra.toString()
    if (!text) return query || ''
    if (!query) return `?${text}`
    return `${query}${query.includes('?') ? '&' : '?'}${text}`
}

/** @description the same query from the first row, `length` rows long (to export every matching lead) */
export const withPaging = (query, start, length) => {
    const body = (query || '').replace(/^\?/, '')
    const params = new URLSearchParams(body)
    params.set('start', String(start))
    params.set('length', String(length))
    params.delete('export')
    params.delete('ext')
    return `?${params.toString()}`
}

const toDate = value => {
    if (!value) return null
    const date = value instanceof Date ? value : new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** @description "2 Oct", or "2 Oct 2025" when not this year — in the viewer's own time */
export const shortDate = (value, now = new Date()) => {
    const date = toDate(value)
    if (!date) return ''
    const day = `${date.getDate()} ${MONTHS[date.getMonth()]}`
    return date.getFullYear() === now.getFullYear() ? day : `${day} ${date.getFullYear()}`
}

/** @description "3:00 pm" */
export const clockTime = value => {
    const date = toDate(value)
    if (!date) return ''
    const hours = date.getHours()
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours % 12 || 12}:${minutes} ${hours < 12 ? 'am' : 'pm'}`
}

/** @description "12 Oct 2026, 3:00 pm" — the full date for a tooltip */
export const fullDateTime = value => {
    const date = toDate(value)
    if (!date) return ''
    return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}, ${clockTime(date)}`
}

/** @description "just now", "5 minutes ago", "3 hours ago", "yesterday", "3 days ago", "2 months ago" */
export const relativeTime = (value, now = new Date()) => {
    const date = toDate(value)
    if (!date) return ''
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000)
    if (seconds < 60) return 'just now'
    const plural = (count, unit) => `${count} ${unit}${count === 1 ? '' : 's'} ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return plural(minutes, 'minute')
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return plural(hours, 'hour')
    const days = Math.floor(hours / 24)
    if (days === 1) return 'yesterday'
    if (days < 30) return plural(days, 'day')
    const months = Math.floor(days / 30)
    if (months < 12) return plural(months, 'month')
    return plural(Math.floor(days / 365), 'year')
}

/** @description whether the guest has opened the quote we emailed (the private link in the email) */
export const quoteOpened = row => Boolean(toDate(row?.quoteViewedAt)) && Number(row?.quoteViews) > 0

/** @description "Quote opened 2 hours ago · 3 times" — the cue to call */
export const openedLine = (row, now = new Date()) => {
    const times = Number(row?.quoteViews) || 1
    return `Quote opened ${relativeTime(row.quoteViewedAt, now)}${times > 1 ? ` · ${times} times` : ''}`
}

/**
 * @description the small line under a row's step chip: the next call booked, else when the quote went, else
 * what the step means
 */
export const stageDetail = (row, now = new Date()) => {
    const meta = stageMeta(row?.stage)
    const call = toDate(row?.nextCallAt)
    if (call && meta.key !== 'booked') return `Next call ${shortDate(call, now)} ${clockTime(call)}`
    const opened = toDate(row?.quoteViewedAt)
    if (opened && meta.key === 'sent') return openedLine(row, now)
    const sent = toDate(row?.quoteSentAt)
    if (sent && (meta.key === 'sent' || meta.key === 'booked')) return `Quote sent ${shortDate(sent, now)}`
    return meta.detail
}

const csvCell = value => {
    const text = value === null || value === undefined ? '' : String(value)
    // ? a cell starting = + - @ would run as a formula in Excel; a phone number ("+91 98765 43210") cannot
    const phone = /^\+[\d\s-]+$/.test(text)
    const safe = !phone && /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
    return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export const CSV_COLUMNS = [
    ['Lead no.', row => row.leadNo],
    ['Name', row => row.fullName],
    ['Phone', row => row.phone],
    ['Email', row => row.senderEmail],
    ['Source', row => row.leadSource],
    ['Trip', row => row.campaignName],
    ['Step', row => stageMeta(row.stage).label],
    ['Quote sent', row => shortDate(row.quoteSentAt)],
    ['Quote opened', row => (quoteOpened(row) ? shortDate(row.quoteViewedAt) : '')],
    ['Next call', row => fullDateTime(row.nextCallAt)],
    ['Follow-up', row => row.followUpState],
    ['Assigned to', row => row.assignedTo],
    ['Received', row => fullDateTime(row.createdAt)]
]

/** @description the leads as CSV text, a header row first */
export const leadsCsv = rows => {
    // ? the API leaves the source out for people who may not see it: no empty Source column then
    const sourceShown = (rows || []).some(row => row.leadSource !== undefined)
    const columns = CSV_COLUMNS.filter(([title]) => sourceShown || title !== 'Source')
    return [columns.map(([title]) => csvCell(title)).join(',')]
        .concat((rows || []).map(row => columns.map(([, read]) => csvCell(read(row))).join(',')))
        .join('\r\n')
}
