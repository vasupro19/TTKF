/**
 * ============================================================================
 *  PHONE NUMBERS — one rule for leads and users
 * ============================================================================
 *
 *  Indian numbers are 10 digits starting 6–9; foreign ones keep their country
 *  code. What people type ("98765 43210", "+91-98765-43210", "098765 43210",
 *  "919876543210") is read the same way.
 *
 *   - a lead's phone is saved as "+919876543210" (what Facebook leads already
 *     carry): one format for search, duplicates and WhatsApp links — a bare
 *     "9876543210" or "09876543210" made a WhatsApp link WhatsApp refused
 *   - a user's phone is saved as 10 digits for India (as before), or
 *     "+<country code><number>" for another country (it used to be cut to its
 *     last 10 digits)
 *   - the phone field (react-phone-input-2) works in digits with the country
 *     code ("919876543210"); a saved "+91…" or "91…" used to load as "9191…",
 *     which the form then refused as not 10 digits, so the user couldn't be saved
 * ============================================================================
 */

const INDIAN_MOBILE = /^[6-9]\d{9}$/

const digitsOf = value => String(value ?? '').replace(/\D/g, '')

/**
 * @description a phone as typed or stored, read as { country, national } — country '91' for India; null when it
 *              can't be read as a phone number
 */
export const readPhone = value => {
    const text = String(value ?? '').trim()
    if (!text) return null
    let digits = digitsOf(text)
    const international = text.startsWith('+') || digits.startsWith('00')
    if (digits.startsWith('00')) digits = digits.slice(2)
    if (!international) {
        if (digits.length === 10) return { country: '91', national: digits }
        if (digits.length === 11 && digits.startsWith('0')) return { country: '91', national: digits.slice(1) }
        if (digits.length === 12 && digits.startsWith('91')) return { country: '91', national: digits.slice(2) }
        return null
    }
    if (digits.startsWith('91')) return { country: '91', national: digits.slice(2) }
    // ? another country: its code and number together, as typed
    return digits.length >= 8 && digits.length <= 15 ? { country: '', national: digits } : null
}

/** @description what is wrong with a phone number, or '' when it is fine */
export const phoneProblem = (value, { required = true } = {}) => {
    // ? nothing typed (the phone field holds just its country code then)
    const typed = String(value ?? '').trim()
    if (!typed || /^\+?91$/.test(typed)) return required ? 'Phone number is required' : ''
    const phone = readPhone(value)
    if (!phone) return 'Enter a 10-digit mobile number, or the full number with its country code'
    if (phone.country === '91' && !INDIAN_MOBILE.test(phone.national)) return 'Enter a 10-digit mobile number'
    return ''
}

/** @description a lead's phone as it is saved: "+919876543210"; as typed when it can't be read */
export const leadPhoneToSave = value => {
    const phone = readPhone(value)
    if (!phone) return String(value ?? '').trim()
    return phone.country ? `+${phone.country}${phone.national}` : `+${phone.national}`
}

/** @description a stored phone for the phone field: digits with the country code ("919876543210") */
export const phoneForField = stored => {
    const phone = readPhone(stored)
    if (!phone) return digitsOf(stored)
    return `${phone.country}${phone.national}`
}

/** @description a user's phone as it is saved: 10 digits for India, "+<code><number>" for another country */
export const userPhoneToSave = fieldValue => {
    const phone = readPhone(`+${digitsOf(fieldValue)}`)
    if (!phone) return ''
    return phone.country === '91' ? phone.national : `+${phone.national}`
}

/** @description what is wrong with the phone field's value (digits with the country code, no '+'), or '' */
export const fieldPhoneProblem = fieldValue => {
    const digits = digitsOf(fieldValue)
    return phoneProblem(digits && digits !== '91' ? `+${digits}` : '')
}
