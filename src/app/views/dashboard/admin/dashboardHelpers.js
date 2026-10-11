/**
 * DASHBOARD HELPERS — pure functions for the dashboard: the period presets and the dates they send, rupee
 * formatting, which KPI cards a user sees, and small labels. No React. The numbers themselves come from the server
 * (GET /dashboard/summary — Controllers/dashboard.controller.js).
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const pad = value => String(value).padStart(2, '0')

/** @description "2026-10-01", in the viewer's own time (what the server reads ?from / ?to as) */
export const toYmd = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const isYmd = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))

const fromYmd = value => {
    if (!isYmd(value)) return null
    const [year, month, day] = value.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return Number.isNaN(date.getTime()) ? null : date
}

export const PERIODS = [
    { key: 'thisMonth', label: 'This month', noun: 'this month' },
    { key: 'lastMonth', label: 'Last month', noun: 'last month' },
    { key: 'last3', label: 'Last 3 months', noun: 'in the last 3 months' },
    { key: 'thisYear', label: 'This year', noun: 'this year' },
    { key: 'custom', label: 'Custom', noun: 'in these dates' }
]

export const periodMeta = key => PERIODS.find(period => period.key === key) || PERIODS[0]

/**
 * @description the days a preset covers. "Last 3 months" is this month and the two before it; a custom range
 * uses its own days (the wrong way round still means the days between them), falling back to this month.
 * @returns {{ from: string, to: string }} YYYY-MM-DD
 */
export const periodRange = (key, now = new Date(), custom = {}) => {
    const year = now.getFullYear()
    const month = now.getMonth()
    const monthEnd = (y, m) => new Date(y, m + 1, 0)
    switch (key) {
        case 'lastMonth':
            return { from: toYmd(new Date(year, month - 1, 1)), to: toYmd(monthEnd(year, month - 1)) }
        case 'last3':
            return { from: toYmd(new Date(year, month - 2, 1)), to: toYmd(monthEnd(year, month)) }
        case 'thisYear':
            return { from: toYmd(new Date(year, 0, 1)), to: toYmd(new Date(year, 11, 31)) }
        case 'custom': {
            let first = fromYmd(custom.from)
            let last = fromYmd(custom.to)
            if (first || last) {
                first = first || last
                last = last || first
                if (first > last) [first, last] = [last, first]
                return { from: toYmd(first), to: toYmd(last) }
            }
            return periodRange('thisMonth', now)
        }
        default:
            return { from: toYmd(new Date(year, month, 1)), to: toYmd(monthEnd(year, month)) }
    }
}

/** @description "1 Oct – 31 Oct 2026", "1 Dec 2025 – 31 Jan 2026" */
export const periodLabel = (from, to) => {
    const first = fromYmd(from)
    const last = fromYmd(to)
    if (!first || !last) return ''
    const day = date => `${date.getDate()} ${MONTHS[date.getMonth()]}`
    if (first.getFullYear() === last.getFullYear()) return `${day(first)} – ${day(last)} ${last.getFullYear()}`
    return `${day(first)} ${first.getFullYear()} – ${day(last)} ${last.getFullYear()}`
}

const amount = value => {
    const number = Number(value)
    return Number.isFinite(number) ? number : 0
}

/** @description Indian rupees, whole: ₹1,23,456 (negative: -₹1,234) */
export const rupees = value => {
    const rounded = Math.round(amount(value))
    const text = `₹${Math.abs(rounded).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
    return rounded < 0 ? `-${text}` : text
}

export const percentText = value => `${Math.round(amount(value) * 10) / 10}%`

export const plural = (count, word, many = `${word}s`) => `${count} ${count === 1 ? word : many}`

/**
 * @description the KPI cards this user sees, in order. Profit and supplier dues only for those who see every
 * booking (the server sends them as null otherwise); "Awaiting verification" only while payments wait.
 * @returns {Array<{ key, label, value, caption, to, money }>} value already formatted
 */
export const kpiCards = (kpis = {}) => {
    const cards = [
        {
            key: 'newLeads',
            label: 'New leads',
            value: String(amount(kpis.newLeads)),
            caption: 'Enquiries received in this period',
            to: '/process/leads'
        },
        {
            key: 'bookings',
            label: 'Bookings',
            value: String(amount(kpis.bookings)),
            caption: 'Quotations converted in this period',
            to: '/process/packages'
        },
        {
            key: 'conversion',
            label: 'Conversion',
            value: percentText(kpis.conversion),
            caption: 'Of this period’s new leads, how many are booked'
        },
        {
            key: 'revenue',
            label: 'Booked value',
            value: rupees(kpis.revenue),
            caption: 'Selling price of this period’s bookings',
            money: true
        },
        {
            key: 'collected',
            label: 'Collected',
            value: rupees(kpis.collected),
            caption: 'Guest payments received in this period',
            money: true
        },
        {
            key: 'toCollect',
            label: 'Still to collect',
            value: rupees(kpis.toCollect),
            caption: 'Balance guests still owe, all open bookings',
            to: '/process/packages',
            money: true
        }
    ]
    if (kpis.profit !== null && kpis.profit !== undefined) {
        cards.push(
            {
                key: 'profit',
                label: 'Profit',
                value: rupees(kpis.profit),
                caption: 'Booked value minus supplier costs',
                money: true
            },
            {
                key: 'supplierDue',
                label: 'Supplier dues',
                value: rupees(kpis.supplierDue),
                caption: 'Still to pay hotels and transport',
                money: true
            }
        )
    }
    const waiting = kpis.awaitingVerification
    if (amount(waiting?.count) > 0) {
        cards.push({
            key: 'awaitingVerification',
            label: 'Awaiting verification',
            value: rupees(waiting.amount),
            caption: `${plural(amount(waiting.count), 'payment')} for accounts to check`,
            to: '/process/transactions',
            money: true
        })
    }
    return cards
}

/** @description "Good morning" / "Good afternoon" / "Good evening" */
export const greetingFor = (hour = new Date().getHours()) => {
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
}

/** @description the guest's payment on a trip: label and colour */
export const paymentMeta = status => {
    if (status === 'Fully Paid') return { label: 'Fully paid', color: 'success' }
    if (status === 'Partially Paid') return { label: 'Part paid', color: 'warning' }
    return { label: 'Not paid', color: 'error' }
}

/** @description the dashboard's query: the period's days and, when chosen, one person */
export const summaryArgs = ({ period, custom, assignedTo }, now = new Date()) => {
    const range = periodRange(period, now, custom)
    return assignedTo ? { ...range, assignedTo: String(assignedTo) } : range
}
