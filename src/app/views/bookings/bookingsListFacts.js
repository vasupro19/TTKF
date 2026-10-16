// ? the pure parts of the bookings list: what the address bar holds, the query the server is asked, and the CSV
import { csvOf } from '@/core/listing/listingFacts'
import { STAGES, dateRange } from './bookingFacts'

export const PAGE_SIZES = [10, 25, 50, 100]
export const DEFAULT_PAGE_SIZE = 25
// ? "export all" fetches 100 at a time, up to this many bookings
export const EXPORT_CAP = 2000

export const PAYMENT_OPTIONS = [
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'partial', label: 'Partly paid' },
    { value: 'paid', label: 'Fully paid' }
]
export const INVOICE_OPTIONS = [
    { value: 'with', label: 'Has GST invoice' },
    { value: 'none', label: 'No invoice' },
    { value: 'cancelled', label: 'Invoice cancelled' }
]

const DAY = /^\d{4}-\d{2}-\d{2}$/
const STAGE_KEYS = STAGES.map(item => item.key)
const FILTER_KEYS = [
    'convertedBy',
    'createdFrom',
    'createdTo',
    'travelFrom',
    'travelTo',
    'guestPayment',
    'supplierPayment',
    'invoice'
]

export const EMPTY_FILTERS = Object.fromEntries(FILTER_KEYS.map(key => [key, '']))

const oneOf = (options, value) => (options.some(option => option.value === value) ? value : '')

/** @description the stage, the person and the filters chosen in the address bar ('' for anything not valid) */
export const filtersFromSearch = search => {
    const params = new URLSearchParams(search || '')
    const day = key => (DAY.test(params.get(key) || '') ? params.get(key) : '')
    const person = params.get('convertedBy') || ''
    return {
        stage: STAGE_KEYS.includes(params.get('stage')) ? params.get('stage') : 'all',
        convertedBy: /^\d+$/.test(person) ? person : '',
        createdFrom: day('createdFrom'),
        createdTo: day('createdTo'),
        travelFrom: day('travelFrom'),
        travelTo: day('travelTo'),
        guestPayment: oneOf(PAYMENT_OPTIONS, params.get('guestPayment')),
        supplierPayment: oneOf(PAYMENT_OPTIONS, params.get('supplierPayment')),
        invoice: oneOf(INVOICE_OPTIONS, params.get('invoice'))
    }
}

/** @description the address bar after a change: only what is set is written; other parameters are kept */
export const searchWithFilters = (search, values) => {
    const params = new URLSearchParams(search || '')
    const merged = { ...filtersFromSearch(search), ...values }
    ;['stage', ...FILTER_KEYS].forEach(key => {
        const value = merged[key]
        if (!value || (key === 'stage' && value === 'all')) params.delete(key)
        else params.set(key, String(value))
    })
    const text = params.toString()
    return text ? `?${text}` : ''
}

/** @description whether anything narrows the list (the stage chip is a view of it, not a filter) */
export const hasAnyFilter = (values, search = '') => Boolean(search) || FILTER_KEYS.some(key => values[key])

const money = value => (value === null || value === undefined || value === '' ? '' : Number(value))

export const BOOKING_CSV_COLUMNS = [
    { key: 'bookingNo', label: 'Booking no.' },
    { key: 'guestName', label: 'Guest' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'selectedPackage', label: 'Package' },
    { key: 'quotationNo', label: 'Quotation' },
    { key: 'travel', label: 'Travel dates', csv: row => dateRange(row.travelDate, row.travelEnd) },
    { key: 'stage', label: 'Stage', csv: row => STAGES.find(item => item.key === row.stage)?.label || row.stage },
    { key: 'sellingPrice', label: 'Price', csv: row => money(row.sellingPrice) },
    { key: 'guestPaidAmount', label: 'Received', csv: row => money(row.guestPaidAmount) },
    { key: 'guestPaymentStatus', label: 'Guest payment' },
    { key: 'supplierPaymentStatus', label: 'Supplier payment' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created', csv: row => (row.createdAt ? String(row.createdAt).slice(0, 10) : '') }
]

export const bookingsCsv = rows => csvOf(rows, BOOKING_CSV_COLUMNS)

/** @description the page's arguments for the server, from the chosen filters */
export const queryArgs = ({ page, pageSize, q, values }) => ({
    page,
    pageSize,
    q,
    ...values
})
