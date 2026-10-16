/**
 * GST on a quote and on an invoice: the three ways a quote charges it, the usual rates, the tax on a price
 * (worked out the way the API does, so the quote form shows what the client will be quoted), and how amounts read.
 * Pure — the GST settings, the quote form, the invoices and the booking page use these.
 */

export const GST_MODES = Object.freeze([
    { key: 'none', label: 'No GST', hint: 'The price is what the guest pays' },
    { key: 'exclusive', label: 'GST extra', hint: 'GST is added on top of the price' },
    { key: 'inclusive', label: 'GST included', hint: 'The price already contains GST' }
])

// ? what a travel agency usually charges: 5% on a tour package, 12% on hotels, 18% on services and fees
export const COMMON_RATES = Object.freeze([5, 12, 18, 28])
export const MAX_RATE = 28

export const modeOf = value => (GST_MODES.some(mode => mode.key === value) ? value : 'none')
export const modeLabel = value => GST_MODES.find(mode => mode.key === modeOf(value))?.label || 'No GST'

/** @returns {{ ok: true, value: number } | { ok: false, message: string }} */
export const parseRate = value => {
    const text = String(value ?? '')
        .trim()
        .replace(/%$/, '')
    if (!text) return { ok: false, message: 'Enter the GST rate' }
    if (!/^\d+(\.\d{1,2})?$/.test(text)) return { ok: false, message: 'The GST rate must be a number, like 5 or 18' }
    const rate = Number(text)
    if (rate > MAX_RATE) return { ok: false, message: `The GST rate can’t be more than ${MAX_RATE}%` }
    return { ok: true, value: rate }
}

// ? whole paise, so halves and percentages never drift
const paise = amount => Math.round((Number(amount) || 0) * 100)
const rupeesOf = value => value / 100

/**
 * @description the tax on one amount, as the API works it out (Helpers/gst.helper.js computeTax)
 * @param {{ amount: number|string, mode: string, rate: number|string, interState?: boolean }} input
 * @returns {{ mode: string, rate: number, taxable: number, cgst: number, sgst: number, igst: number, gst: number, total: number }}
 */
export const computeTax = ({ amount, mode, rate, interState = false }) => {
    const base = paise(amount)
    const percent = Number(rate) || 0
    const chosen = modeOf(mode)
    const charged = chosen !== 'none' && percent > 0

    let taxable = base
    let total = base
    let gst = 0
    if (charged && chosen === 'exclusive') {
        gst = Math.round((base * percent) / 100)
        total = base + gst
    } else if (charged) {
        taxable = Math.round((base * 100) / (100 + percent))
        gst = base - taxable
    }
    const cgst = interState ? 0 : Math.round(gst / 2)
    const sgst = interState ? 0 : gst - cgst
    return {
        mode: charged ? chosen : 'none',
        rate: charged ? percent : 0,
        taxable: rupeesOf(taxable),
        cgst: rupeesOf(cgst),
        sgst: rupeesOf(sgst),
        igst: rupeesOf(interState ? gst : 0),
        gst: rupeesOf(gst),
        total: rupeesOf(total)
    }
}

/** @description "₹21,000" or "₹880.95" — paise only when there are some */
export const money = value => {
    const amount = Number(value) || 0
    return `₹${amount.toLocaleString('en-IN', {
        minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
        maximumFractionDigits: 2
    })}`
}

/** @description "₹21,000.00" — always two places, as an invoice prints it */
export const money2 = value =>
    `₹${(Number(value) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** @description "CGST 2.5% + SGST 2.5%" in the agency's state, "IGST 18%" for another state's supply */
export const splitText = ({ rate, interState }) =>
    interState ? `IGST ${Number(rate)}%` : `CGST ${Number(rate) / 2}% + SGST ${Number(rate) / 2}%`

// ? a GSTIN's shape; the API also checks its state and check character, so this only catches typing slips early
const GSTIN_SHAPE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
export const tidyGstin = value =>
    String(value || '')
        .replace(/\s+/g, '')
        .toUpperCase()
export const gstinShapeProblem = value => {
    const gstin = tidyGstin(value)
    if (!gstin) return ''
    return GSTIN_SHAPE.test(gstin) ? '' : 'A GSTIN is 15 characters, like 02AAPFU0939F1ZV'
}

export const KIND_LABELS = Object.freeze({ TAX_INVOICE: 'Tax invoice', BILL_OF_SUPPLY: 'Bill of supply' })
export const kindLabel = kind => KIND_LABELS[kind] || 'Invoice'

/** @description a one-line reading of an invoice: "Tax invoice TTK/2627/00001 · ₹21,000.00" */
export const invoiceLine = invoice => `${kindLabel(invoice.kind)} ${invoice.number} · ${money2(invoice.total)}`

export const INVOICE_STATUS = Object.freeze({
    ISSUED: { label: 'Issued', color: 'success' },
    CANCELLED: { label: 'Cancelled', color: 'default' }
})
export const invoiceStatus = status => INVOICE_STATUS[status] || { label: String(status || ''), color: 'default' }

/** @description 'YYYY-MM' of today, for a month picker */
export const thisMonth = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

/** @description "Oct 2026" for 'YYYY-MM' */
export const monthName = month => {
    const [year, number] = String(month || '')
        .split('-')
        .map(Number)
    if (!year || !number) return ''
    return new Date(year, number - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

/** @description "13 Oct 2026" for an invoice's date (a DATE value, read as the day it names) */
export const dayText = value => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

export const errorText = (error, fallback) => error?.data?.message || error?.message || fallback

/** @description saves a blob as a file */
export const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}

/** @description a file name that survives every system: slashes in an invoice number become underscores */
export const safeFileName = text => String(text || 'invoice').replace(/[^A-Za-z0-9._-]/g, '_')
