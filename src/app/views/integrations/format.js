import PropTypes from 'prop-types'

export const FB_BLUE = '#1877F2'

const UNITS = [
    ['year', 365 * 24 * 3600],
    ['month', 30 * 24 * 3600],
    ['day', 24 * 3600],
    ['hour', 3600],
    ['min', 60]
]

/** "3 min ago", "2 days ago", "just now"; '—' for nothing */
export const ago = value => {
    if (!value) return '—'
    const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000)
    if (Number.isNaN(seconds)) return '—'
    const found = seconds >= 45 && UNITS.find(([, size]) => seconds >= size)
    if (!found) return 'just now'
    const [unit, size] = found
    const count = Math.floor(seconds / size)
    return `${count} ${unit}${count === 1 || unit === 'min' ? '' : 's'} ago`
}

export const errorMessage = (error, fallback) => error?.data?.message || error?.data?.data?.message || fallback

export const userShape = PropTypes.shape({ id: PropTypes.number, name: PropTypes.string, email: PropTypes.string })

export const mailboxShape = PropTypes.shape({
    id: PropTypes.number,
    email: PropTypes.string,
    provider: PropTypes.string,
    host: PropTypes.string,
    port: PropTypes.number,
    secure: PropTypes.bool,
    username: PropTypes.string,
    defaultAssignedTo: PropTypes.number,
    assignedToName: PropTypes.string,
    keywords: PropTypes.string,
    active: PropTypes.bool,
    status: PropTypes.string,
    lastCheckedAt: PropTypes.string,
    lastLeadAt: PropTypes.string,
    leadsCaptured: PropTypes.number,
    lastError: PropTypes.string
})

export const pageShape = PropTypes.shape({
    id: PropTypes.string,
    pageId: PropTypes.string,
    name: PropTypes.string,
    picture: PropTypes.string,
    tokenOk: PropTypes.bool,
    subscribed: PropTypes.bool,
    problem: PropTypes.string,
    isActive: PropTypes.bool,
    formIds: PropTypes.arrayOf(PropTypes.string),
    defaultAssignedTo: PropTypes.number,
    assignedToName: PropTypes.string,
    connectedAt: PropTypes.string
})

export const formShape = PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    status: PropTypes.string,
    leads: PropTypes.number
})

export const providerShape = PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    hint: PropTypes.string,
    color: PropTypes.string
})
