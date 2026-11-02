/**
 * Prospects on screen: the statuses with their badge colours, the list's filters, and reading a spreadsheet's rows
 * for the import. Plain functions, so they can be tested.
 */

export const STATUS_OPTIONS = [
    { value: 'new', label: 'Not contacted', badge: 'info' },
    { value: 'contacted', label: 'Contacted', badge: 'purple' },
    { value: 'replied', label: 'Replied', badge: 'orange' },
    { value: 'demo', label: 'Demo booked', badge: 'cyan' },
    { value: 'trial', label: 'On trial', badge: 'indigo' },
    { value: 'won', label: 'Won', badge: 'success' },
    { value: 'lost', label: 'Not interested', badge: 'danger' }
]
export const statusOption = value => STATUS_OPTIONS.find(option => option.value === value) || STATUS_OPTIONS[0]

export const SEQUENCE_LABELS = { off: 'Not on emails', on: 'On automatic emails', done: 'Emails finished' }
const STOP_WORDS = {
    replied: 'they replied',
    bounced: 'the address bounced',
    unsubscribed: 'they asked not to be emailed',
    status: 'the status moved on',
    manual: 'stopped by hand'
}

export const dayOf = value => {
    if (!value) return ''
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export const timeOf = value => {
    if (!value) return ''
    const date = new Date(value)
    return Number.isNaN(date.getTime())
        ? ''
        : date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

/** @description one line on where the prospect stands with email, e.g. "Follow-up due 5 Nov" */
export const emailStateOf = prospect => {
    if (!prospect) return ''
    if (prospect.doNotEmail) return `No email: ${STOP_WORDS[prospect.stopReason] || 'stopped'}`
    if (!prospect.email) return 'No email address'
    if (prospect.sequence === 'on' && prospect.nextEmailAt) {
        const when = new Date(prospect.nextEmailAt)
        const word = Number(prospect.emailsSent) ? 'Follow-up' : 'First email'
        return when <= new Date() ? `${word} goes next` : `${word} due ${dayOf(when)}`
    }
    if (prospect.sequence === 'done') {
        return `Emails finished${prospect.stopReason ? `: ${STOP_WORDS[prospect.stopReason] || prospect.stopReason}` : ''}`
    }
    return Number(prospect.emailsSent) ? `${prospect.emailsSent} sent` : 'Not emailed'
}

export const ACTIVITY_WORDS = {
    email: 'Email sent',
    email_failed: 'Email failed',
    whatsapp: 'WhatsApp',
    call: 'Call',
    note: 'Note',
    reply: 'Reply received',
    bounce: 'Email bounced',
    opt_out: 'Opted out',
    status: 'Status',
    imported: 'Imported'
}

/** @description the list's filters: status, region (from the summary), priority and the email sequence */
export const filtersOf = (regions = []) => [
    { key: 'status', label: 'Status', options: STATUS_OPTIONS.map(({ value, label }) => ({ value, label })) },
    {
        key: 'region',
        label: 'Region',
        options: regions.map(({ region, count }) => ({ value: region, label: `${region} (${count})` }))
    },
    {
        key: 'priority',
        label: 'Priority',
        width: 130,
        help: 'A: phone plus email or website\nB: phone or email only\nC: no direct contact (Instagram, Google listing)',
        options: [
            { value: 'A', label: 'A' },
            { value: 'B', label: 'B' },
            { value: 'C', label: 'C' }
        ]
    },
    {
        key: 'sequence',
        label: 'Emails',
        options: Object.entries(SEQUENCE_LABELS).map(([value, label]) => ({ value, label }))
    }
]

/**
 * @description the rows of the first sheet worth importing: those with something in them. The server reads the
 * columns by their headings (Agency, City, Phone, Email, …), so the spreadsheet made for the outreach works as it is.
 */
export const importableRows = rows =>
    (rows || []).filter(row =>
        Object.values(row || {}).some(value => String(value ?? '').trim() !== '' && String(value).trim() !== '0')
    )

/** @description what the import did, in one sentence */
export const importReport = result => {
    if (!result) return ''
    const parts = [`Added ${result.added} ${result.added === 1 ? 'agency' : 'agencies'}`]
    if (result.duplicates) parts.push(`${result.duplicates} already on the list`)
    if (result.problems?.length) parts.push(`${result.problems.length} rows without an agency name skipped`)
    return `${parts.join(', ')}.`
}
