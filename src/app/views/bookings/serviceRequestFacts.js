/**
 * SERVICE REQUESTS — sales asks operations for a hotel or transport; operations books it. What a request says, how
 * it stands, and what each person may do about hotels and transport on a booking. Pure functions.
 */
import { amount, dateRange } from './bookingFacts'

export const REQUEST_TYPES = [
    { value: 'Hotel', label: 'Hotel', noun: 'hotel' },
    { value: 'Taxi', label: 'Transport', noun: 'transport' }
]

export const nounOf = type => (type === 'Hotel' ? 'hotel' : 'transport')

/**
 * @description what the signed-in person may do about a booking's hotels and transport, as the server says
 *              (`booking.access`): manage (operations), view (accounts) or none (sales). A server that does not say yet
 *              is an older one, which let everyone — so the screen keeps working until it is updated.
 */
export const rightsOf = booking => {
    const suppliers = booking?.access?.suppliers || 'manage'
    return {
        suppliers,
        manage: suppliers === 'manage',
        view: suppliers !== 'none',
        pay: booking?.access ? Boolean(booking.access.pay) : true
    }
}

const rooms = (type, quantity) => {
    const count = amount(quantity)
    if (!count) return ''
    if (type === 'Hotel') return `${count} room${count === 1 ? '' : 's'}`
    return `${count} vehicle${count === 1 ? '' : 's'}`
}

/** @description "Hotel in Manali · 12 Dec 2026 – 15 Dec 2026 · 2 rooms" */
export const requestSummary = request =>
    [
        `${request.type === 'Hotel' ? 'Hotel in' : 'Transport:'} ${request.place || '—'}`,
        dateRange(request.startDate, request.endDate),
        rooms(request.type, request.quantity)
    ]
        .filter(Boolean)
        .join(' · ')

/**
 * @description how a request stands, in words and a colour: waiting, booked (by whom), declined (and why) or withdrawn
 * @returns {{ label: string, color: string, detail: string }}
 */
export const requestState = request => {
    const by = request.repliedByName ? ` by ${request.repliedByName}` : ''
    switch (request.status) {
        case 'Done':
            return { label: `Booked${by}`, color: 'success.main', detail: '' }
        case 'Declined':
            return { label: `Declined${by}`, color: 'error.main', detail: request.reply || '' }
        case 'Cancelled':
            return { label: 'Withdrawn', color: 'text.secondary', detail: '' }
        default:
            return { label: 'Waiting for operations', color: 'warning.dark', detail: '' }
    }
}

export const isOpen = request => request?.status === 'Open'

/** @description requests still waiting */
export const openOf = (requests = []) => requests.filter(isOpen)

const dayOf = value => (value ? new Date(value).toISOString().split('T')[0] : '')

/**
 * @description a new request starts from the guest's trip: where, when and how many
 * @param {'Hotel' | 'Taxi'} type
 * @param {object} guest the guest's trip details
 * @param {string} place where the trip starts or stays: the booked quote's first destination
 */
export const requestDraft = (type, guest = {}, place = '') => {
    const hotel = type === 'Hotel'
    const route = guest.pickupLocation && guest.dropLocation ? `${guest.pickupLocation} to ${guest.dropLocation}` : ''
    let quantity = '1'
    if (hotel) quantity = guest.rooms ? String(guest.rooms) : ''
    return {
        type,
        place: hotel ? place : route || place,
        startDate: dayOf(guest.pickupDate),
        endDate: dayOf(guest.dropDate),
        quantity,
        note: ''
    }
}

/** @description what is wrong with a request form, or '' when it can be sent */
export const draftProblem = draft => {
    if (!String(draft.place || '').trim()) {
        return draft.type === 'Hotel' ? 'Say where the guest needs the hotel' : 'Say the route the guest needs'
    }
    if (draft.startDate && draft.endDate && draft.endDate < draft.startDate) return 'The last date is before the first'
    const count = draft.quantity === '' ? null : Number(draft.quantity)
    if (count !== null && (!Number.isInteger(count) || count < 1 || count > 99)) {
        return draft.type === 'Hotel'
            ? 'Rooms must be a whole number from 1 to 99'
            : 'Vehicles must be a whole number from 1 to 99'
    }
    if (String(draft.note || '').length > 1000) return 'Keep the note under 1000 characters'
    return ''
}

/** @description the request as the server takes it */
export const draftPayload = (packageId, draft) => ({
    packageId,
    type: draft.type,
    place: String(draft.place).trim(),
    startDate: draft.startDate || undefined,
    endDate: draft.endDate || undefined,
    quantity: draft.quantity === '' ? undefined : Number(draft.quantity),
    note: String(draft.note || '').trim() || undefined
})

/**
 * @description what operations starts from when it adds the line a request asked for: the dates and the count. Where
 *              (the place) is for them to see, above the form — it is not a supplier's detail.
 */
export const lineDefaults = request => ({
    ...(request.startDate ? { startDate: request.startDate } : {}),
    ...(request.endDate ? { endDate: request.endDate } : {}),
    ...(request.quantity ? { quantity: String(request.quantity) } : {})
})
