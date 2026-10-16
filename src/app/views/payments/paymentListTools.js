import { cleanDay, cleanId, oneOf } from '@/core/listing/screenFacts'
import { searchWithValues } from '@/core/listing/listingFacts'
import { PAYMENT_STATUSES } from './paymentFacts'

export const EMPTY_FILTERS = Object.freeze({ from: '', to: '', method: '', type: '', recordedBy: '', q: '' })

const STATUS_KEYS = [...PAYMENT_STATUSES.map(status => status.key), 'ALL']
export const DEFAULT_STATUS = 'PENDING'

/**
 * @description the filters in the address bar, each checked: a real day, a method / service on the list, a user id,
 *              a search text of at most 100 characters. Whatever is not valid is read as not set.
 */
export const filtersFromSearch = (search, { methods = [], types = [] } = {}) => {
    const params = new URLSearchParams(search || '')
    return {
        from: cleanDay(params.get('from')),
        to: cleanDay(params.get('to')),
        method: oneOf(params.get('method'), methods),
        type: oneOf(params.get('type'), types),
        recordedBy: cleanId(params.get('recordedBy')),
        q: String(params.get('q') || '')
            .trim()
            .slice(0, 100)
    }
}

/** @description the guest payments' status tab in the address bar (awaiting verification when none is chosen) */
export const statusFromSearch = search => {
    const status = new URLSearchParams(search || '').get('status')
    return STATUS_KEYS.includes(status) ? status : DEFAULT_STATUS
}

/** @description the address bar's query after changing some filters (and/or the status); empty and default values are left out */
export const searchAfter = (search, patch = {}) =>
    searchWithValues(search, {
        ...patch,
        ...(patch.status === DEFAULT_STATUS ? { status: '' } : {})
    })

/** @description any filter set (the status tab is not a filter) */
export const hasListFilters = filters => Object.values(filters || {}).some(Boolean)

/**
 * @description what an empty payments list says. Filters match nothing → "filtered"; else for a guest status tab, that
 *              nothing is in that status; else that there are no payments at all yet.
 * @returns {{ kind: 'first' | 'filtered', title?: string, text?: string } | null}
 */
export const emptyPayments = ({ loaded, count, hasFilters, status, statusLabel, anyPayments, supplier = false }) => {
    if (!loaded || count > 0) return null
    if (hasFilters) return { kind: 'filtered' }
    if (!supplier && anyPayments && status === DEFAULT_STATUS)
        return {
            kind: 'first',
            title: 'Nothing is waiting for verification',
            text: 'New guest payments show up here as soon as a salesperson records them.'
        }
    if (!supplier && anyPayments && status !== 'ALL')
        return { kind: 'first', title: `No ${statusLabel.toLowerCase()} payments`, text: 'Pick another status above.' }
    return supplier
        ? {
              kind: 'first',
              title: 'No supplier payments yet',
              text: 'Payments made to hotels and transporters appear here once they are recorded on a booking.'
          }
        : {
              kind: 'first',
              title: 'No guest payments yet',
              text: 'Payments appear here, to be verified, once a salesperson records one on a booking.'
          }
}
