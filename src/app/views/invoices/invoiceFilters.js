import { cleanDay, cleanId, cleanMonth, oneOf } from '@/core/listing/screenFacts'
import { searchWithValues } from '@/core/listing/listingFacts'
import { thisMonth } from '../gst/gstFacts'

export const KIND_OPTIONS = [
    { value: 'TAX_INVOICE', label: 'Tax invoice' },
    { value: 'BILL_OF_SUPPLY', label: 'Bill of supply' }
]
export const GST_OPTIONS = [
    { value: 'with', label: 'With GST' },
    { value: 'without', label: 'Without GST' }
]
export const STATUS_OPTIONS = [
    { value: 'ISSUED', label: 'Issued' },
    { value: 'CANCELLED', label: 'Cancelled' }
]
const ALL_MONTHS = 'all'

/**
 * @description the invoice list's filters from the address bar, each checked. No month in the address is this month;
 *              `month=all` (the picker emptied) is every month, shown as ''.
 */
export const invoiceFiltersFromSearch = (search, now = new Date()) => {
    const params = new URLSearchParams(search || '')
    const month = params.get('month') === ALL_MONTHS ? '' : cleanMonth(params.get('month')) || thisMonth(now)
    return {
        month,
        from: cleanDay(params.get('from')),
        to: cleanDay(params.get('to')),
        status: oneOf(
            params.get('status'),
            STATUS_OPTIONS.map(o => o.value)
        ),
        kind: oneOf(
            params.get('kind'),
            KIND_OPTIONS.map(o => o.value)
        ),
        gst: oneOf(
            params.get('gst'),
            GST_OPTIONS.map(o => o.value)
        ),
        issuedBy: cleanId(params.get('issuedBy')),
        q: String(params.get('q') || '')
            .trim()
            .slice(0, 100)
    }
}

/** @description the address bar after a change; a month equal to this month is not written, an emptied one is `all` */
export const invoiceSearchAfter = (search, patch, now = new Date()) => {
    const next = { ...patch }
    if ('month' in next) {
        if (next.month === '') next.month = ALL_MONTHS
        else if (next.month === thisMonth(now)) next.month = ''
    }
    return searchWithValues(search, next)
}

/** @description the API's query: typed dates replace the month */
export const invoiceQuery = (filters, { page = 0, pageSize = 25 } = {}) => ({
    ...(filters.from || filters.to ? {} : { month: filters.month }),
    from: filters.from,
    to: filters.to,
    status: filters.status,
    kind: filters.kind,
    gst: filters.gst,
    issuedBy: filters.issuedBy,
    q: filters.q,
    page,
    pageSize
})

/** @description anything beyond this month's invoices is a filter */
export const hasInvoiceFilters = (filters, now = new Date()) =>
    [
        filters.from,
        filters.to,
        filters.status,
        filters.kind,
        filters.gst,
        filters.issuedBy,
        filters.q,
        filters.month !== thisMonth(now)
    ].some(Boolean)

/** @description what an empty invoice list says */
export const emptyInvoices = ({ loaded, count, hasFilters, filters }) => {
    if (!loaded || count > 0) return null
    if (hasFilters) return { kind: 'filtered' }
    return {
        kind: 'first',
        title: filters.month ? 'No invoices this month yet' : 'No invoices yet',
        text: 'Issue one from a booking’s page once the booking is confirmed.'
    }
}

export const CLEARED = Object.freeze({
    from: '',
    to: '',
    status: '',
    kind: '',
    gst: '',
    issuedBy: '',
    q: ''
})
