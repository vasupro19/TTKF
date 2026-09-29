/**
 * BOOKING FACTS — what the bookings screens say about a confirmed booking: how far it has got, what to do
 * next, and where the money stands. Pure functions, so the list and the booking page agree.
 *
 * Money arrives as numbers from some servers and as decimal strings ("12500.00") from others; everything
 * here goes through `amount`.
 */

export const amount = value => {
    const number = Number(value)
    return Number.isFinite(number) ? number : 0
}

export const rupees = value =>
    `₹${amount(value).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 })}`

// ? the order an agent works a booking in
export const STEPS = [
    { key: 'hotel', label: 'Hotel booked', next: 'Add a hotel booking', section: 'hotels' },
    { key: 'taxi', label: 'Transport booked', next: 'Add transport', section: 'transport' },
    { key: 'guestPaid', label: 'Guest paid in full', next: 'Record the guest’s payment', section: 'payments' },
    { key: 'suppliersPaid', label: 'Suppliers paid', next: 'Pay the suppliers', section: 'hotels' },
    { key: 'voucher', label: 'Voucher sent', next: 'Send the voucher to the guest', section: 'documents' }
]

const FULLY_PAID = 'Fully Paid'

/**
 * @description which steps are done — from a list row (flags) or from a booking and its services
 * @returns {Record<string, boolean>}
 */
export const progressOf = ({ booking, services = null }) => {
    if (services) {
        const hotels = services.filter(service => service.type === 'Hotel')
        const taxis = services.filter(service => service.type === 'Taxi')
        return {
            hotel: hotels.length > 0,
            taxi: taxis.length > 0,
            guestPaid: booking?.guestPaymentStatus === FULLY_PAID,
            suppliersPaid: services.length > 0 && services.every(service => service.paymentStatus === FULLY_PAID),
            voucher: booking?.status === 'Voucher Sent'
        }
    }
    return {
        hotel: Boolean(booking?.hotelAssigned),
        taxi: Boolean(booking?.taxiAssigned),
        guestPaid: booking?.guestPaymentStatus === FULLY_PAID,
        suppliersPaid: booking?.supplierPaymentStatus === FULLY_PAID,
        voucher: booking?.status === 'Voucher Sent'
    }
}

export const doneCount = progress => STEPS.filter(step => progress[step.key]).length

/** @returns {object|null} the first step not done yet, or null when the booking is ready */
export const nextStep = progress => STEPS.find(step => !progress[step.key]) || null

export const STAGES = [
    { key: 'action', label: 'Not started' },
    { key: 'progress', label: 'In progress' },
    { key: 'ready', label: 'Ready to travel' }
]

// ? "not started" until a hotel or transport is booked; "ready" only when every step is done
export const stageOf = progress => {
    if (doneCount(progress) === STEPS.length) return 'ready'
    return progress.hotel || progress.taxi ? 'progress' : 'action'
}

/**
 * @description the guest's side of the money
 */
export const guestMoney = booking => {
    const price = amount(booking?.sellingPrice)
    const received = amount(booking?.guestPaidAmount)
    return {
        price,
        received,
        balance: Math.max(0, price - received),
        share: price > 0 ? Math.min(1, received / price) : 0
    }
}

/**
 * @description the suppliers' side: what the hotels and transport cost, and what is still owed
 */
export const supplierMoney = services => {
    const cost = services.reduce((sum, service) => sum + amount(service.cost), 0)
    const paid = services.reduce((sum, service) => sum + amount(service.paidAmount), 0)
    return { cost, paid, due: Math.max(0, cost - paid) }
}

const toDate = value => {
    if (!value) return null
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
}

export const shortDate = value => {
    const date = toDate(value)
    return date
        ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
        : ''
}

/**
 * @description "travels in 5 days" for a booking that is not ready and leaves within two weeks; '' otherwise
 */
export const urgency = (travelDate, ready, today = new Date()) => {
    const date = toDate(travelDate)
    if (!date || ready) return ''
    const start = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    const days = Math.round((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start) / 86400000)
    if (days < 0 || days > 14) return ''
    if (days === 0) return 'travels today'
    return days === 1 ? 'travels tomorrow' : `travels in ${days} days`
}

export const dateRange = (start, end) => {
    const from = shortDate(start)
    const to = shortDate(end)
    if (from && to && from !== to) return `${from} – ${to}`
    return from || to
}

/**
 * @description the list's rows: searched, filtered by stage, the soonest trip first (bookings without a date last)
 */
export const visibleBookings = (rows, { stage = 'all', search = '' } = {}) => {
    const words = search.trim().toLowerCase()
    return rows
        .map(row => {
            const progress = progressOf({ booking: row })
            return { row, progress, stage: stageOf(progress) }
        })
        .filter(item => stage === 'all' || item.stage === stage)
        .filter(
            item =>
                !words ||
                [item.row.guestName, item.row.phone, item.row.email, item.row.selectedPackage]
                    .filter(Boolean)
                    .some(value => String(value).toLowerCase().includes(words))
        )
        .sort((a, b) => {
            const left = toDate(a.row.travelDate)?.getTime() ?? Infinity
            const right = toDate(b.row.travelDate)?.getTime() ?? Infinity
            // ? two undated bookings keep the server's order (newest first)
            if (left === right) return 0
            return left < right ? -1 : 1
        })
}
