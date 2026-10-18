/**
 * AGENT FORM RULES — what the form asks for, what it checks, and what it sends. Pure functions, no React.
 *
 * Only the name is required (the server refuses an agent without one). The phone and email are optional, but
 * checked when given. The State is saved as its short code ("HP"), as it always was.
 */

export const INDIAN_STATES = [
    { value: 'AP', label: 'Andhra Pradesh' },
    { value: 'AR', label: 'Arunachal Pradesh' },
    { value: 'AS', label: 'Assam' },
    { value: 'BR', label: 'Bihar' },
    { value: 'CG', label: 'Chhattisgarh' },
    { value: 'GA', label: 'Goa' },
    { value: 'GJ', label: 'Gujarat' },
    { value: 'HR', label: 'Haryana' },
    { value: 'HP', label: 'Himachal Pradesh' },
    { value: 'JH', label: 'Jharkhand' },
    { value: 'KA', label: 'Karnataka' },
    { value: 'KL', label: 'Kerala' },
    { value: 'MP', label: 'Madhya Pradesh' },
    { value: 'MH', label: 'Maharashtra' },
    { value: 'MN', label: 'Manipur' },
    { value: 'ML', label: 'Meghalaya' },
    { value: 'MZ', label: 'Mizoram' },
    { value: 'NL', label: 'Nagaland' },
    { value: 'OR', label: 'Odisha' },
    { value: 'PB', label: 'Punjab' },
    { value: 'RJ', label: 'Rajasthan' },
    { value: 'SK', label: 'Sikkim' },
    { value: 'TN', label: 'Tamil Nadu' },
    { value: 'TS', label: 'Telangana' },
    { value: 'TR', label: 'Tripura' },
    { value: 'UP', label: 'Uttar Pradesh' },
    { value: 'UK', label: 'Uttarakhand' },
    { value: 'WB', label: 'West Bengal' },
    { value: 'AN', label: 'Andaman and Nicobar Islands' },
    { value: 'CH', label: 'Chandigarh' },
    { value: 'DNHDD', label: 'Dadra and Nagar Haveli and Daman and Diu' },
    { value: 'DL', label: 'Delhi' },
    { value: 'JK', label: 'Jammu and Kashmir' },
    { value: 'LA', label: 'Ladakh' },
    { value: 'LD', label: 'Lakshadweep' },
    { value: 'PY', label: 'Puducherry' }
]

export const EMPTY_AGENT = { name: '', phone: '', email: '', state: '', city: '', address: '', remarks: '' }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const FIELDS = Object.keys(EMPTY_AGENT)

/**
 * @description the form's problems, by field ({} when it is fine)
 * @param {{ name: string, phone: string, email: string }} values
 */
export const agentFormProblems = values => {
    const problems = {}
    if (!values.name.trim()) problems.name = 'Agent name is required'

    // ? agents are saved as typed, so an older number in any common style still passes: 7 to 15 digits
    const phone = values.phone.trim()
    if (phone) {
        const digits = phone.replace(/\D/g, '').length
        if (digits < 7 || digits > 15 || /[^\d\s+()-]/.test(phone)) problems.phone = 'Enter a valid phone number'
    }

    const email = values.email.trim()
    if (email && !EMAIL.test(email)) problems.email = 'Enter a valid email, like name@company.com'
    return problems
}

/** @description what is sent to the server: the form's fields, trimmed (an empty one is sent as '') */
export const agentPayload = values =>
    FIELDS.reduce((payload, field) => ({ ...payload, [field]: String(values[field] ?? '').trim() }), {})

/** @description a saved agent as the form's text values (the form works in strings) */
export const agentToForm = row =>
    FIELDS.reduce((values, field) => ({ ...values, [field]: row?.[field] == null ? '' : String(row[field]) }), {
        ...EMPTY_AGENT
    })

/**
 * @description the State dropdown's options; a state saved some other way (older data) is added so the dropdown still shows it
 * @param {string} saved the form's current state value
 */
export const stateOptions = saved =>
    saved && !INDIAN_STATES.some(state => state.value === saved)
        ? [...INDIAN_STATES, { value: saved, label: saved }]
        : INDIAN_STATES
