/**
 * TRIP DETAILS — what the agent records about the guest's trip once a lead is verified.
 *
 * Only two things are needed to build a quote: how many adults, and when the trip starts. Everything else
 * sharpens it and can be added whenever the guest says it, so none of it blocks the agent.
 */

export const HOTEL_CATEGORIES = [
    { value: 'Deluxe', label: 'Deluxe' },
    { value: 'Super Deluxe', label: 'Super Deluxe' },
    { value: 'Luxury', label: 'Luxury' },
    { value: 'Premium', label: 'Premium' }
]

export const MEAL_PLANS = [
    { value: 'EP', label: 'Room only' },
    { value: 'CP', label: 'Breakfast' },
    { value: 'MAP', label: 'Breakfast & dinner' },
    { value: 'AP', label: 'All meals' }
]

export const TRIP_TYPES = [
    { value: 'Honeymoon', label: 'Honeymoon' },
    { value: 'Family', label: 'Family' },
    { value: 'Friends', label: 'Friends' },
    { value: 'Corporate', label: 'Corporate' },
    { value: 'Solo', label: 'Solo' }
]

export const VEHICLES = [
    { value: 'Hatchback', label: 'Hatchback' },
    { value: 'Sedan', label: 'Sedan' },
    { value: 'SUV', label: 'SUV' },
    { value: 'Tempo Traveller', label: 'Tempo Traveller' },
    { value: 'None', label: 'No vehicle' }
]

export const LEAD_QUALITY = [
    { value: 'Hot', label: 'Hot' },
    { value: 'Warm', label: 'Warm' },
    { value: 'Cold', label: 'Cold' }
]

export const CONTACT_STATUS = [
    { value: 'New', label: 'New' },
    { value: 'InProgress', label: 'In progress' },
    { value: 'Closed', label: 'Closed' }
]

const COUNT_FIELDS = ['adults', 'children', 'rooms', 'extraBedding']
const DATE_FIELDS = ['pickupDate', 'dropDate']
const TEXT_FIELDS = [
    'packageType',
    'foodPlan',
    'pickupLocation',
    'dropLocation',
    'tourType',
    'taxiType',
    'originState',
    'contactQuality',
    'contactStatus',
    'leadRemarks'
]

// ? behind "More details": useful for operations, rarely known on the first call
export const MORE_DETAIL_FIELDS = [
    'dropLocation',
    'tourType',
    'taxiType',
    'extraBedding',
    'originState',
    'contactQuality',
    'contactStatus',
    'leadRemarks'
]

export const emptyTripDetails = () =>
    Object.fromEntries([...COUNT_FIELDS, ...DATE_FIELDS, ...TEXT_FIELDS].map(field => [field, '']))

const filled = value => value !== null && value !== undefined && String(value).trim() !== ''

export const hasMoreDetails = values => MORE_DETAIL_FIELDS.some(field => filled(values[field]))

/**
 * @description the usual room count for a party: two adults to a room
 */
export const suggestedRooms = adults => {
    const count = Number(adults)
    return Number.isInteger(count) && count >= 1 ? String(Math.ceil(count / 2)) : ''
}

const toDateInput = value => {
    if (!filled(value)) return ''
    const text = String(value).trim()
    if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10)
    const parsed = new Date(text)
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10)
}

/**
 * @description a saved guest-detail record as form values (every value a string, dates as YYYY-MM-DD)
 */
export const fromGuestDetail = (row = {}) => {
    const values = emptyTripDetails()
    COUNT_FIELDS.forEach(field => {
        values[field] = filled(row[field]) ? String(row[field]) : ''
    })
    DATE_FIELDS.forEach(field => {
        values[field] = toDateInput(row[field])
    })
    TEXT_FIELDS.forEach(field => {
        values[field] = filled(row[field]) ? String(row[field]) : ''
    })
    return values
}

const countError = (value, { min = 0, label, one = '' }) => {
    if (!filled(value)) return ''
    const count = Number(value)
    if (!Number.isInteger(count)) return `${label} must be a whole number`
    if (count < min) return min === 1 ? `At least 1 ${one}` : `${label} can’t be negative`
    if (count > 99) return `${label} looks too high`
    return ''
}

/**
 * @description formik errors: adults and the start date are required; everything else only has to make sense
 */
export const validateTripDetails = values => {
    const errors = {}
    if (!filled(values.adults)) errors.adults = 'How many adults?'
    const checks = [
        ['adults', { min: 1, label: 'Adults', one: 'adult' }],
        ['children', { label: 'Children' }],
        ['rooms', { min: 1, label: 'Rooms', one: 'room' }],
        ['extraBedding', { label: 'Extra beds' }]
    ]
    checks.forEach(([field, rule]) => {
        const message = errors[field] || countError(values[field], rule)
        if (message) errors[field] = message
    })
    if (!filled(values.pickupDate)) errors.pickupDate = 'When does the trip start?'
    if (filled(values.pickupDate) && filled(values.dropDate) && values.dropDate < values.pickupDate) {
        errors.dropDate = 'The trip can’t end before it starts'
    }
    return errors
}

/**
 * @description form values as the guest-detail API takes them: numbers, midnight-UTC dates, and null for
 *              anything left empty
 */
export const toGuestPayload = (values, leadId) => {
    const payload = { leadId }
    COUNT_FIELDS.forEach(field => {
        payload[field] = filled(values[field]) ? Number(values[field]) : null
    })
    DATE_FIELDS.forEach(field => {
        payload[field] = filled(values[field]) ? `${String(values[field]).slice(0, 10)}T00:00:00.000Z` : null
    })
    TEXT_FIELDS.forEach(field => {
        payload[field] = filled(values[field]) ? String(values[field]).trim() : null
    })
    return payload
}

const shortDate = value =>
    new Date(`${value}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' })

/**
 * @description one line for the top of the itinerary step, e.g. "2 adults, 1 child · 5 Oct – 10 Oct · Breakfast"
 */
export const tripSummary = values => {
    const people = [
        filled(values.adults) ? `${values.adults} adult${Number(values.adults) === 1 ? '' : 's'}` : '',
        Number(values.children) > 0 ? `${values.children} child${Number(values.children) === 1 ? '' : 'ren'}` : ''
    ]
        .filter(Boolean)
        .join(', ')
    let dates = ''
    if (filled(values.pickupDate)) {
        dates = filled(values.dropDate)
            ? `${shortDate(values.pickupDate)} – ${shortDate(values.dropDate)}`
            : `from ${shortDate(values.pickupDate)}`
    }
    const meals = MEAL_PLANS.find(plan => plan.value === values.foodPlan)?.label || ''
    return [people, dates, values.packageType, meals].filter(Boolean).join(' · ')
}
