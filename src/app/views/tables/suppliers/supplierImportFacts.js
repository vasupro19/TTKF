/**
 * SUPPLIERS FROM EXCEL — the sheet an agency already has, read into the rows the server checks (backend
 * Helpers/supplierImport.helper.js). Pure functions, no React: the template to download, the headings people really write,
 * and what an import's answer says.
 */

export const TEMPLATE_HEADINGS = [
    'Business name',
    'Type',
    'Contact person',
    'Phone',
    'Email',
    'Address',
    'City',
    'Notes'
]

// ? the field each column of the sheet fills: what the template calls it, and what agencies call it in their own sheets
const ALIASES = {
    businessname: [
        'business name',
        'business',
        'name',
        'supplier',
        'supplier name',
        'hotel name',
        'hotel',
        'vendor',
        'vendor name',
        'company'
    ],
    type: ['type', 'supplier type', 'kind', 'category', 'service', 'services'],
    constactperson: ['contact person', 'contact', 'contact name', 'person', 'owner', 'manager'],
    phone: [
        'phone',
        'phone number',
        'mobile',
        'mobile number',
        'mobile no',
        'phone no',
        'contact number',
        'contact no',
        'whatsapp'
    ],
    email: ['email', 'email id', 'e-mail', 'mail', 'email address'],
    address: ['address', 'full address'],
    city: ['city', 'place', 'location', 'town', 'destination'],
    remarks: ['notes', 'note', 'remarks', 'remark', 'comments']
}
const FIELD_OF = Object.fromEntries(
    Object.entries(ALIASES).flatMap(([field, names]) => names.map(name => [name, field]))
)
export const REQUIRED = [
    ['businessname', 'Business name'],
    ['type', 'Type'],
    ['phone', 'Phone']
]

// ? "Business Name", "business_name", " BUSINESS  NAME " are one heading
const headingKey = text =>
    String(text ?? '')
        .toLowerCase()
        .replace(/[_.]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

/** @description the field a heading of the sheet fills, or '' */
export const fieldOf = heading => FIELD_OF[headingKey(heading)] || ''

const blank = row => Object.values(row).every(value => String(value ?? '').trim() === '')

/**
 * @description the sheet's rows as suppliers to send, each with its row number in the sheet (the first row is the headings)
 * @param {object[]} sheetRows what the sheet reader gave: one object per row, keyed by the heading
 * @param {string[]} [sheetHeadings] the headings of the first row, so a sheet with headings and no rows is told apart from a wrong one
 * @returns {{ rows: object[], missing: string[], ignored: string[] }} `missing` names the required columns the sheet lacks (then
 *          there is nothing to import); `ignored` the headings that fill nothing
 */
export const suppliersFromSheet = (sheetRows, sheetHeadings = []) => {
    // ? the headings of the first row, even when no row follows them (a template with its examples deleted)
    const headings = [...new Set([...sheetHeadings.map(String), ...sheetRows.flatMap(row => Object.keys(row))])].filter(
        Boolean
    )
    const found = new Set(headings.map(fieldOf).filter(Boolean))
    const missing = REQUIRED.filter(([field]) => !found.has(field)).map(([, label]) => label)
    const ignored = headings.filter(heading => !fieldOf(heading) && !String(heading).startsWith('__EMPTY'))
    const rows = sheetRows
        .map((row, index) => ({ row, number: index + 2 }))
        .filter(({ row }) => !blank(row))
        .map(({ row, number }) => {
            const supplier = { row: number }
            Object.entries(row).forEach(([heading, value]) => {
                const field = fieldOf(heading)
                // ? the first column that fills a field wins ("Name" and "Hotel name" in one sheet)
                if (field && supplier[field] === undefined) supplier[field] = value
            })
            return supplier
        })
    return { rows, missing, ignored }
}

/** @description the template: the headings, two example rows to replace, and a sheet that says how to fill it */
export const templateSheets = () => ({
    Suppliers: [
        TEMPLATE_HEADINGS,
        [
            'Hotel Snowline',
            'Hotel',
            'Mr Negi',
            '9876543210',
            'rooms@snowline.example.com',
            'Mall Road',
            'Manali',
            'Best rates in winter'
        ],
        ['Himalayan Cabs', 'Taxi', 'Rakesh', '9812345678', '', 'Bus stand', 'Shimla', '']
    ],
    'How to fill': [
        ['Column', 'What to write'],
        ['Business name', 'Required. The hotel or transporter’s name.'],
        ['Type', 'Required. Hotel, Taxi, Volvo or Other. (Cab or Transporter counts as Taxi, Bus as Volvo.)'],
        ['Contact person', 'Optional. Who you speak to when you book.'],
        ['Phone', 'Required. 7 to 15 digits, with the country code if outside India.'],
        ['Email', 'Optional. Booking requests go to it.'],
        ['Address', 'Optional.'],
        ['City', 'Optional, but a supplier with the same name in the same city is taken to be one already listed.'],
        ['Notes', 'Optional. Rates, best time to call, anything else.'],
        [],
        ['Replace the two example rows with your suppliers. Keep the headings in the first row.']
    ]
})

/** @description "5 suppliers" / "1 supplier" */
export const suppliersWord = count => `${count} supplier${count === 1 ? '' : 's'}`

/** @description what an import's answer comes to, for the preview and the result */
export const reportOf = data => {
    const added = Number(data?.added) || 0
    const skipped = Array.isArray(data?.skipped) ? data.skipped : []
    const problems = Array.isArray(data?.problems) ? data.problems : []
    return { added, skipped, problems, nothing: added === 0 && skipped.length === 0 && problems.length === 0 }
}
