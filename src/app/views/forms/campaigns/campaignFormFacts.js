/**
 * CAMPAIGN FORM FACTS — how a campaign's lists and bank details are kept as text, and what must be filled in.
 *
 * The quotation email, PDF and preview read these texts (Helpers/quotationEmail.helper.js), so the formats are fixed:
 *   - a list is "1. first\n2. second"
 *   - bank details are one intro line, then "Account Name ---------- Central Bank" lines, in a fixed order
 * Pure functions, no React.
 */

const BANK_INTRO = "Please deposit 50% advance in our company's account to confirm your trip."
const BANK_SEPARATOR = ' ----------'

export const BANK_FIELDS = [
    { key: 'accountName', label: 'Account name' },
    { key: 'bankName', label: 'Bank name' },
    { key: 'branchName', label: 'Branch name' },
    { key: 'accountNo', label: 'Account number' },
    { key: 'accountType', label: 'Account type', placeholder: 'Current or Savings' },
    { key: 'ifscCode', label: 'IFSC code' }
]

// ? the labels the text uses (kept as the old form wrote them, so saved campaigns still read back)
const BANK_TEXT_LABELS = {
    accountName: 'Account Name',
    bankName: 'Bank Name',
    branchName: 'Branch Name',
    accountNo: 'Account No',
    accountType: 'Account Type',
    ifscCode: 'IFSC CODE'
}

export const emptyBank = () => Object.fromEntries(BANK_FIELDS.map(({ key }) => [key, '']))

/** @description a saved list text as its items — at least one (empty) item, so there is always a line to type in */
export const parseList = text => {
    const items = String(text || '')
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
    return items.length ? items : ['']
}

/** @description items as the saved text: blank items dropped, the rest numbered; '' when nothing is left */
export const serializeList = items =>
    (items || [])
        .map(item => String(item || '').trim())
        .filter(Boolean)
        .map((item, index) => `${index + 1}. ${item}`)
        .join('\n')

/** @description saved bank text as its six fields */
export const parseBank = text => {
    const lines = String(text || '').split('\n')
    const fields = emptyBank()
    BANK_FIELDS.forEach(({ key }) => {
        const label = BANK_TEXT_LABELS[key]
        const line = lines.find(item => item.toLowerCase().startsWith(label.toLowerCase()))
        if (!line) return
        const at = line.indexOf('----------')
        fields[key] = at === -1 ? '' : line.slice(at + 10).trim()
    })
    return fields
}

/** @description the six fields as the saved text; '' when none is filled in */
export const serializeBank = fields => {
    if (!BANK_FIELDS.some(({ key }) => String(fields?.[key] || '').trim())) return ''
    return [
        BANK_INTRO,
        ...BANK_FIELDS.map(
            ({ key }) => `${BANK_TEXT_LABELS[key]}${BANK_SEPARATOR}${String(fields?.[key] || '').trim()}`
        )
    ].join('\n')
}

/** @description whether bank text is there but in a layout the six fields can't read (written by hand or imported) */
export const bankIsLegacy = text =>
    Boolean(String(text || '').trim()) && !BANK_FIELDS.some(({ key }) => parseBank(text)[key])

/**
 * @description a campaign from the server as the form's pieces
 * @returns {{ values: { title: string, description: string }, inclusions: string[], exclusions: string[], notes: string[], bank: object, legacyBank: string }}
 */
export const formFromCampaign = row => ({
    values: { title: String(row?.title || ''), description: String(row?.description || '') },
    inclusions: parseList(row?.inclusions),
    exclusions: parseList(row?.exclusions),
    notes: parseList(row?.importantNote),
    bank: parseBank(row?.bankDetails),
    legacyBank: bankIsLegacy(row?.bankDetails) ? String(row.bankDetails) : ''
})

/**
 * @description what is sent to the server — the same six fields as always. Bank text the fields can't read is sent back
 *              unchanged unless the six fields are filled in to replace it.
 */
export const campaignPayload = ({ values, inclusions, exclusions, notes, bank, legacyBank = '' }) => ({
    title: values.title.trim(),
    description: values.description.trim(),
    inclusions: serializeList(inclusions),
    exclusions: serializeList(exclusions),
    importantNote: serializeList(notes),
    bankDetails: serializeBank(bank) || legacyBank
})

const MIN_LENGTH = 3

/** @description the form's problems by field ({} when it is fine) */
export const campaignProblems = values => {
    const problems = {}
    const title = values.title.trim()
    if (!title) problems.title = 'Title is required'
    else if (title.length < MIN_LENGTH) problems.title = `Use at least ${MIN_LENGTH} characters`
    const description = values.description.trim()
    if (!description) problems.description = 'Description is required'
    else if (description.length < MIN_LENGTH) problems.description = `Use at least ${MIN_LENGTH} characters`
    return problems
}
