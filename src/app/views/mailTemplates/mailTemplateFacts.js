/**
 * MAIL TEMPLATES — what the screen works out from the server's list of email kinds. Pure functions, no React. The server checks
 * everything again (backend /v1/mail-templates); these only let the screen say what is wrong before a round trip, and send as
 * little as possible.
 *
 * A kind is one sort of email (a receipt to the guest, a booking request to a hotel…). Each has slots of editable text (subject,
 * greeting, closing…). A slot holds `value` (what is used now: the agency's own words or the default) and `default`.
 */

export const AUDIENCES = [
    { key: 'guest', label: 'Guests' },
    { key: 'supplier', label: 'Hotels & transporters' },
    { key: 'staff', label: 'Our team' }
]

export const FORBIDDEN_MESSAGE = "Only the agency's admins and managers can change mail templates."
export const NOT_READY_MESSAGE =
    'Mail templates need a one-time update on the server. Run the upgrade, then restart the API.'

// ? how long to wait after the last keystroke before asking the server for a new preview
export const PREVIEW_DELAY_MS = 500

const slotsOf = kind => (Array.isArray(kind?.slots) ? kind.slots : [])
const textOf = value => (value === undefined || value === null ? '' : String(value))

/**
 * @description the kinds grouped by who receives the email, in a fixed order; empty groups are left out. A kind with an audience
 *              this screen does not know goes under "Other" rather than vanishing. The server's order is kept inside a group.
 * @param {{ key: string, audience: string }[]} kinds
 * @returns {{ audience: string, label: string, kinds: object[] }[]}
 */
export const groupKinds = kinds => {
    const list = Array.isArray(kinds) ? kinds.filter(Boolean) : []
    const groups = AUDIENCES.map(({ key, label }) => ({
        audience: key,
        label,
        kinds: list.filter(kind => kind.audience === key)
    }))
    const rest = list.filter(kind => !AUDIENCES.some(({ key }) => key === kind.audience))
    if (rest.length) groups.push({ audience: 'other', label: 'Other', kinds: rest })
    return groups.filter(group => group.kinds.length > 0)
}

/** @description the text of each slot as saved: what the fields start with */
export const draftOf = kind => Object.fromEntries(slotsOf(kind).map(slot => [slot.key, textOf(slot.value)]))

/** @description the keys of the slots whose text on screen differs from what is saved, in slot order */
export const changedKeys = (kind, draft) =>
    slotsOf(kind)
        .filter(slot => textOf(draft?.[slot.key] ?? slot.value) !== textOf(slot.value))
        .map(slot => slot.key)

/** @description whether anything on screen differs from what is saved */
export const isUnsaved = (kind, draft) => changedKeys(kind, draft).length > 0

/**
 * @description the `slots` to send: only the slots that differ from what is saved. Text equal to the default is sent as null (the
 *              slot goes back to following the default) — also when the default is blank, so an optional slot cleared to blank
 *              where the default is blank is un-customised rather than saved as an empty text.
 * @returns {Record<string, string|null>}
 */
export const changedSlots = (kind, draft) => {
    const changed = new Set(changedKeys(kind, draft))
    const slots = {}
    slotsOf(kind).forEach(slot => {
        if (!changed.has(slot.key)) return
        const text = textOf(draft[slot.key])
        slots[slot.key] = text === textOf(slot.default) ? null : text
    })
    return slots
}

/** @description the body of the PUT, and of the preview (which replaces those slots for the preview only) */
export const slotsBody = (kind, draft) => ({ slots: changedSlots(kind, draft) })

export const placeholderToken = name => `{${name}}`

const within = (number, low, high) => Math.min(Math.max(number, low), high)

/**
 * @description `token` put into `text` where the cursor is (replacing what is selected). With no cursor known it goes to the end.
 * @param {string} text
 * @param {number|null} start selectionStart of the field
 * @param {number|null} end selectionEnd of the field
 * @returns {{ value: string, cursor: number }} the new text, and where the cursor belongs: just after the token
 */
export const insertAtCursor = (text, start, end, token) => {
    const value = textOf(text)
    const from = Number.isInteger(start) ? within(start, 0, value.length) : value.length
    const to = Number.isInteger(end) ? within(end, from, value.length) : from
    return { value: value.slice(0, from) + token + value.slice(to), cursor: from + token.length }
}

/** @description "12 / 200" */
export const lengthLabel = (text, maxLength) =>
    maxLength ? `${textOf(text).length} / ${maxLength}` : String(textOf(text).length)

/** @description what is wrong with one slot's text, or '' */
export const slotProblem = (slot, text) => {
    const value = textOf(text)
    if (!slot.optional && !value.trim()) return 'This can’t be blank.'
    if (slot.maxLength && value.length > slot.maxLength) {
        return `Too long: ${value.length} characters, and ${slot.maxLength} is the most.`
    }
    return ''
}

/** @description what is wrong with the slots that were changed, by slot key; empty when it can be saved */
export const slotProblems = (kind, draft) => {
    const problems = {}
    const changed = new Set(changedKeys(kind, draft))
    slotsOf(kind).forEach(slot => {
        if (!changed.has(slot.key)) return
        const problem = slotProblem(slot, draft[slot.key])
        if (problem) problems[slot.key] = problem
    })
    return problems
}

/** @description the per-slot messages of a 400 (`data.errors` of the reply's body), by slot key; empty when there are none */
export const fieldErrors = error => {
    const found = error?.data?.data?.errors ?? error?.data?.errors
    if (!found || typeof found !== 'object' || Array.isArray(found)) return {}
    return Object.fromEntries(
        Object.entries(found)
            .filter(([, message]) => message)
            .map(([key, message]) => [key, String(message)])
    )
}

/**
 * @description what a failed call means for the screen
 * @param {{ status?: number, data?: object }} error what RTK Query rejected with
 * @param {string} fallback said when the server gave no message
 * @returns {{ type: 'forbidden'|'notReady'|'fields'|'other', message: string, errors: Record<string, string> }}
 *          `forbidden` (403): not this person's screen; `notReady` (409): the agency's database is not upgraded, editing stops;
 *          `fields` (400): slot messages in `errors`; `other`: anything else
 */
export const describeFailure = (error, fallback) => {
    const message = error?.data?.message
    if (error?.status === 403) return { type: 'forbidden', message: FORBIDDEN_MESSAGE, errors: {} }
    if (error?.status === 409) return { type: 'notReady', message: message || NOT_READY_MESSAGE, errors: {} }
    const errors = fieldErrors(error)
    if (error?.status === 400 && Object.keys(errors).length) {
        return { type: 'fields', message: message || 'Some of the text can’t be used. See below.', errors }
    }
    return { type: 'other', message: message || fallback, errors: {} }
}

/** @description "Last changed by Asha Verma on 27 Oct 2026", or '' for a kind that was never changed */
export const updatedLine = kind => {
    if (!kind?.customised && !kind?.updatedAt) return ''
    const date = kind.updatedAt ? new Date(kind.updatedAt) : null
    const when =
        date && !Number.isNaN(date.getTime())
            ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : ''
    const who = kind.updatedByName ? `by ${kind.updatedByName}` : ''
    const parts = [who, when ? `on ${when}` : ''].filter(Boolean)
    return parts.length ? `Last changed ${parts.join(' ')}` : ''
}

/** @description how many of the kind's slots are the agency's own words: "2 of 5 texts changed" */
export const customisedSummary = kind => {
    const slots = slotsOf(kind)
    const count = slots.filter(slot => slot.customised).length
    return count ? `${count} of ${slots.length} texts changed` : 'Using the default text'
}
