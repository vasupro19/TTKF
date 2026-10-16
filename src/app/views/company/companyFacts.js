// ? the rules the API applies to the company's details (Helpers/company.helper.js), so a form says what is wrong before saving

export const MAX_LOGO_BYTES = 2 * 1024 * 1024
export const LOGO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/** @description up to two capital letters for a name with no logo: "Himalayan Trails" → "HT" */
export const initialsOf = name => {
    const words = String(name || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
    if (!words.length) return 'T'
    const letters = words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[1][0]
    return letters.toUpperCase()
}

const FIELDS = ['name', 'phoneNumber', 'address', 'website', 'insta']

/** @description what the form starts with, from what the API sent */
export const draftOf = company => Object.fromEntries(FIELDS.map(key => [key, String(company?.[key] ?? '')]))

/** @description whether the form differs from what is saved (a new or removed logo counts) */
export const isChanged = (draft, company, { logo, removeLogo } = {}) =>
    Boolean(logo) ||
    Boolean(removeLogo) ||
    FIELDS.some(key => draft[key].trim() !== String(company?.[key] ?? '').trim())

const linkProblem = (value, label) => {
    const raw = value.trim()
    if (!raw) return ''
    if (raw.length > 200) return `${label} is too long`
    if (/\s/.test(raw)) return `${label} can’t have spaces`
    try {
        const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
        if (!url.hostname.includes('.')) throw new Error('no dot')
    } catch (error) {
        return `${label} doesn’t look like a link, like example.com`
    }
    return ''
}

/** @description what is wrong with the form, field by field; empty when it can be saved */
export const problemsOf = draft => {
    const problems = {}
    if (draft.name.trim().length < 2) problems.name = 'Enter the company name'
    else if (draft.name.trim().length > 120) problems.name = 'The name is too long'
    if (!/^[+\d][\d\s()-]{6,19}$/.test(draft.phoneNumber.trim()))
        problems.phoneNumber = 'Enter a phone number, like +91 98765 43210'
    if (!draft.address.trim()) problems.address = 'Enter the address'
    else if (draft.address.trim().length > 300) problems.address = 'The address is too long'
    const website = linkProblem(draft.website, 'The website')
    if (website) problems.website = website
    const insta = /^@?[A-Za-z0-9._]{1,30}$/.test(draft.insta.trim()) ? '' : linkProblem(draft.insta, 'Instagram')
    if (insta) problems.insta = insta
    return problems
}

/** @description why a chosen logo file can't be used, or '' */
export const logoProblem = file => {
    if (!file) return ''
    if (!LOGO_TYPES.includes(file.type)) return 'Choose a PNG, JPG, WebP or GIF image'
    if (file.size > MAX_LOGO_BYTES) return 'That image is over 2 MB'
    return ''
}

/** @description the request body: every field (an empty website or Instagram clears it), the logo, or its removal */
export const formDataOf = (draft, { logo, removeLogo } = {}) => {
    const data = new FormData()
    FIELDS.forEach(key => data.append(key, draft[key].trim()))
    if (logo) data.append('logo', logo, logo.name || 'logo')
    else if (removeLogo) data.append('removeLogo', 'true')
    return data
}
