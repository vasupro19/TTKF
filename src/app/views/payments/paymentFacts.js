/**
 * Payments checked by accounts: what a payment's status means, who may do what with it, the proof a payment
 * needs, and the lists' filters and export. Pure — the screens (Transactions page, booking page) use these.
 *
 *   PENDING  --verify-->  VERIFIED  --reverse-->  REVERSED
 *      |  ^
 *   reject  resubmit (corrected by sales)
 *      v  |
 *    REJECTED
 *
 * Only VERIFIED and LEGACY (recorded before verification existed) count toward the booking's paid amount.
 */

export const PAYMENT_STATUSES = Object.freeze([
    { key: 'PENDING', label: 'Awaiting verification', color: 'warning' },
    { key: 'VERIFIED', label: 'Verified', color: 'success' },
    { key: 'REJECTED', label: 'Rejected', color: 'error' },
    { key: 'REVERSED', label: 'Reversed', color: 'default' },
    { key: 'LEGACY', label: 'Before verification', color: 'info' }
])

const BY_KEY = Object.fromEntries(PAYMENT_STATUSES.map(status => [status.key, status]))
const COUNTED = ['VERIFIED', 'LEGACY']

const keyOf = status => String(status || '').toUpperCase()

/** @returns {{ key: string, label: string, color: string }} how a status is shown; an unknown one in grey */
export const statusInfo = status =>
    BY_KEY[keyOf(status)] || { key: keyOf(status), label: status ? String(status) : 'Unknown', color: 'default' }

export const statusLabel = status => statusInfo(status).label
export const statusColor = status => statusInfo(status).color

/** @description it counts toward the booking's paid amount */
export const isCounted = payment => COUNTED.includes(keyOf(payment?.status))
/** @description the guest's receipt can go only for a payment that counts */
export const canSendReceipt = payment => isCounted(payment)
/** @description sales may correct it: while waiting, or after accounts rejected it */
export const canEdit = payment => ['PENDING', 'REJECTED'].includes(keyOf(payment?.status))
export const canVerify = (payment, canDecide) => Boolean(canDecide) && keyOf(payment?.status) === 'PENDING'
export const canReject = canVerify
export const canReverse = (payment, canDecide) => Boolean(canDecide) && isCounted(payment)

export const RECEIPT_WAITS = 'The receipt can be sent once accounts verifies this payment'

export const GUEST_METHODS = Object.freeze(['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Credit Card'])
export const SUPPLIER_METHODS = Object.freeze(['Bank Transfer', 'UPI', 'Cash', 'Cheque', 'Credit Card'])

export const isCash = method => /^\s*cash\s*$/i.test(String(method || ''))

// ? the proof: a screenshot or a PDF, as the server accepts it
export const PROOF_ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf'
export const PROOF_MAX_BYTES = 5 * 1024 * 1024
const PROOF_TYPES = PROOF_ACCEPT.split(',')
const PROOF_EXTENSIONS = /\.(jpe?g|png|webp|pdf)$/i

/** @returns {string} what is wrong with a chosen proof file, or '' */
export const proofProblem = file => {
    if (!file) return ''
    const typeOk = file.type ? PROOF_TYPES.includes(file.type) : PROOF_EXTENSIONS.test(file.name || '')
    if (!typeOk) return 'The proof must be a photo (JPG, PNG, WebP) or a PDF'
    if (file.size > PROOF_MAX_BYTES) return 'The proof is larger than 5 MB'
    return ''
}

/** @description a stored proof is a PDF (by its original name); otherwise it is a picture */
// ? the API says proofType ('pdf' | 'image'); older answers only had the file's name
export const isPdfProof = (proofName, proofType) =>
    proofType ? proofType === 'pdf' : /\.pdf$/i.test(String(proofName || ''))

/**
 * @description checks a payment form
 * @param {object} form          { amount, paymentMethod }
 * @param {File|null} file       the newly chosen proof
 * @param {object} options
 * @param {'unlessCash'|'always'} options.proof   guest payments: unless cash; supplier payments: always
 * @param {boolean} options.hasProof              a proof is already attached (editing): a new one is optional
 * @returns {Record<string, string>} field → message; empty when the form can be saved
 */
export const paymentFormErrors = (form, file, { proof = 'unlessCash', hasProof = false } = {}) => {
    const errors = {}
    const value = Number.parseFloat(form?.amount)
    if (!Number.isFinite(value) || value <= 0) errors.amount = 'Enter an amount above zero'
    if (!String(form?.paymentMethod || '').trim()) errors.paymentMethod = 'Choose how it was paid'
    const fileProblem = proofProblem(file)
    if (fileProblem) errors.proof = fileProblem
    else if (!file && !hasProof) {
        if (proof === 'always') errors.proof = 'Attach the payment screenshot or PDF'
        else if (!isCash(form?.paymentMethod))
            errors.proof = 'Attach the payment screenshot or PDF — needed for every payment except cash'
    }
    return errors
}

/**
 * @description a payload as multipart form data, for the payment routes that take a proof: empty values are left
 *              out, a File is sent as it is
 */
export const toFormData = payload => {
    const data = new FormData()
    Object.entries(payload || {}).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return
        if (typeof Blob !== 'undefined' && value instanceof Blob) data.append(key, value, value.name || key)
        else data.append(key, String(value))
    })
    return data
}

/** @description the list's query string: only the filters that are set */
export const paymentsQuery = ({ status, from, to, method, type, q, page = 1, pageSize = 25 } = {}) => {
    const params = new URLSearchParams()
    if (status && status !== 'ALL') params.set('status', status)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    if (method) params.set('method', method)
    if (type) params.set('type', type)
    if (q && String(q).trim()) params.set('q', String(q).trim())
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    return params.toString()
}

/** @description what the API base is, without a trailing slash */
export const apiBase = () => String(import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '')

/** @param {'guest'|'supplier'} kind */
export const proofUrl = (kind, paymentId) =>
    `${apiBase()}/package/${kind === 'supplier' ? 'supplier-payment' : 'guest-payment'}/${paymentId}/proof`

/** @description the server's message, or `fallback` (a 503 "needs a one-time update" is shown as the server says) */
export const errorText = (error, fallback) => error?.data?.message || error?.message || fallback

export const amountOf = value => {
    const number = Number(value)
    return Number.isFinite(number) ? number : 0
}

export const rupees = value => `₹${amountOf(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

/** @description a payment date as dd Mon yyyy (stored as a date at midnight UTC) */
export const payDate = value => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

/** @description for an <input type='date'> */
export const isoDay = value => {
    if (!value) return ''
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

/** @description the summary's totals across every status ("All") */
export const summaryTotal = summary =>
    PAYMENT_STATUSES.reduce(
        (total, { key }) => ({
            count: total.count + amountOf(summary?.[key]?.count),
            amount: total.amount + amountOf(summary?.[key]?.amount)
        }),
        { count: 0, amount: 0 }
    )

/** @description guest payments as spreadsheet rows (column → value), in the order shown */
export const guestExportRows = rows =>
    (rows || []).map(row => ({
        Date: payDate(row.paymentDate),
        'Booking no': row.bookingNo || '',
        Guest: row.guestName || row.package?.lead?.fullName || '',
        Amount: amountOf(row.amount),
        Method: row.paymentMethod || '',
        'Transaction ID': row.transactionId || '',
        'Recorded by': row.recordedByName || '',
        Status: statusLabel(row.status),
        'Checked by': row.reversedByName || row.reviewedByName || '',
        Reason: row.reversalReason || row.rejectionReason || '',
        Proof: row.hasProof ? row.proofName || 'Attached' : 'None',
        'Duplicate transaction ID': row.duplicateOf?.length ? `Also on payment ${row.duplicateOf.join(', ')}` : '',
        Remarks: row.remarks || ''
    }))

/** @description supplier payments as spreadsheet rows */
export const supplierExportRows = rows =>
    (rows || []).map(row => ({
        Date: payDate(row.paymentDate),
        'Booking no': row.bookingNo || '',
        Guest: row.guestName || '',
        Supplier: row.supplierName || '',
        Service: row.service?.type === 'Taxi' ? 'Transport' : row.service?.type || '',
        Amount: amountOf(row.amount),
        Method: row.paymentMethod || '',
        'Transaction ID': row.transactionId || '',
        'Recorded by': row.recordedByName || '',
        Proof: row.hasProof ? row.proofName || 'Attached' : 'None',
        Remarks: row.remarks || ''
    }))

/** @description rows as CSV text: a header line, then one line per row; quotes where a value needs them */
export const toCsv = rows => {
    if (!rows?.length) return ''
    const headers = Object.keys(rows[0])
    const cell = value => {
        let text = value === undefined || value === null ? '' : String(value)
        // ? a value starting like a formula is not run by the spreadsheet
        if (/^[=+\-@\t\r]/.test(text) && typeof value !== 'number') text = `'${text}`
        return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
    }
    return [headers.map(cell).join(','), ...rows.map(row => headers.map(key => cell(row[key])).join(','))].join('\r\n')
}

/** @description who checked it and why, for a status chip's tooltip */
export const decisionNote = payment => {
    const status = statusInfo(payment?.status).key
    if (status === 'REJECTED')
        return [`Rejected${payment.reviewedByName ? ` by ${payment.reviewedByName}` : ''}`, payment.rejectionReason]
            .filter(Boolean)
            .join(': ')
    if (status === 'REVERSED')
        return [`Reversed${payment.reversedByName ? ` by ${payment.reversedByName}` : ''}`, payment.reversalReason]
            .filter(Boolean)
            .join(': ')
    if (status === 'VERIFIED' && payment.reviewedByName)
        return `Verified by ${payment.reviewedByName}${payment.reviewedAt ? ` on ${payDate(payment.reviewedAt)}` : ''}`
    if (status === 'LEGACY') return 'Recorded before payments were verified — it counts'
    if (status === 'PENDING') return 'Waiting for accounts — it counts once verified'
    return ''
}
