/**
 * QUOTE STATUS — where a quotation stands: its step in the lead journey (the same five steps the Leads screen
 * shows) and what is still missing before it can go to the guest. Pure functions, no React.
 */
import { HOTEL_TIERS } from './quoteDays'

/** @returns {boolean} true when at least one hotel category has a price */
export const hasPrice = priceData => HOTEL_TIERS.some(tier => Number(priceData?.[tier.priceKey]) > 0)

/**
 * @description the lead's step while its quotation is being worked on — a failed email does not count as sent
 * @returns {'verified'|'quoting'|'sent'|'booked'}
 */
export const quoteStageKey = ({
    confirmedPackage = null,
    lastSharedQuoteNo = null,
    lastShareStatus = null,
    days = [],
    priceData = null
}) => {
    if (confirmedPackage?.selectedPackage) return 'booked'
    if (lastSharedQuoteNo && lastShareStatus !== 'Failed') return 'sent'
    return days.length || hasPrice(priceData) ? 'quoting' : 'verified'
}

/**
 * @description the checklist next to the Send button — each item says whether it is done and, if not, what to do
 * @returns {{ key: string, label: string, done: boolean, fix: string }[]}
 */
export const sendChecklist = ({ tripLine = '', days = [], priceData = null, guestEmail = '' }) => [
    { key: 'trip', label: 'Trip details', done: Boolean(tripLine), fix: 'Add the trip details' },
    {
        key: 'days',
        label: days.length ? `${days.length} day${days.length === 1 ? '' : 's'} planned` : 'Days planned',
        done: days.length > 0,
        fix: 'Add at least one day'
    },
    { key: 'price', label: 'Price set', done: hasPrice(priceData), fix: 'Enter a price for a hotel category' },
    { key: 'email', label: 'Guest email', done: Boolean(guestEmail), fix: 'Add an email to the lead to send by email' }
]

/** @returns {string} a plain sentence on whether and when the guest got this quote */
export const sentLine = ({
    lastSharedQuoteNo = null,
    lastSharedAt = null,
    currentQuoteNo,
    status = null,
    error = null
}) => {
    if (!lastSharedQuoteNo) return 'Not sent to the guest yet.'
    if (status === 'Failed') {
        return `The last email of Quote ${lastSharedQuoteNo} did not go${error ? ` (${error})` : ''}. Check the guest’s email and send again.`
    }
    if (lastSharedQuoteNo !== currentQuoteNo) {
        return `The guest last got Quote ${lastSharedQuoteNo}. Sending this one sends a different version.`
    }
    const when = lastSharedAt
        ? ` on ${new Date(lastSharedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
        : ''
    return `Emailed to the guest${when}.`
}

const ago = (value, now) => {
    const seconds = Math.round((now.getTime() - new Date(value).getTime()) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
    const days = Math.floor(hours / 24)
    return days === 1 ? 'yesterday' : `${days} days ago`
}

/**
 * @description whether the guest has opened the private link in this quote's email, as a short line for the Send card
 * @returns {{ show: boolean, viewed: boolean, text: string }} nothing to show until the quote has gone out
 */
export const viewLine = ({
    quoteViews = [],
    currentQuoteNo,
    lastSharedQuoteNo = null,
    status = null,
    now = new Date()
}) => {
    if (!lastSharedQuoteNo || status === 'Failed' || lastSharedQuoteNo !== currentQuoteNo) {
        return { show: false, viewed: false, text: '' }
    }
    const mine = quoteViews.find(view => view.quoteNo === currentQuoteNo)
    if (!mine?.viewCount) {
        return { show: true, viewed: false, text: 'Not opened yet. We will show it here when the guest opens it.' }
    }
    const times = mine.viewCount === 1 ? 'once' : `${mine.viewCount} times`
    return {
        show: true,
        viewed: true,
        text: `Opened ${times} · last ${ago(mine.lastViewedAt, now)}. A good time to call.`
    }
}
