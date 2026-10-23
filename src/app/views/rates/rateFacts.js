/**
 * THE RATE CARD SCREEN — what its rows hold, what is wrong with them, which ones changed, and how an Excel sheet becomes rows.
 * Pure functions, no React. The server checks everything again (Helpers/rateCard.helper.js); this is so a mistake is shown
 * beside the row before anything is sent.
 */
import nameKey from '@views/forms/packages/nameKey'

export const CATEGORY_OPTIONS = [
    { value: 'delux', label: 'Deluxe' },
    { value: 'superDelux', label: 'Super Deluxe' },
    { value: 'luxury', label: 'Luxury' },
    { value: 'premium', label: 'Premium' }
]

export const categoryLabel = value => CATEGORY_OPTIONS.find(option => option.value === value)?.label || value

/** @description the money columns of a hotel row, with the words the screen uses */
export const AMOUNT_FIELDS = [
    ['epRate', 'Room only (EP)'],
    ['cpRate', 'Breakfast (CP)'],
    ['mapRate', 'Breakfast + dinner (MAP)'],
    ['extraBedRate', 'Extra bed'],
    ['childRate', 'Child']
]

const ROOM_FIELDS = ['epRate', 'cpRate', 'mapRate']
const TEXT_FIELDS = ['place', 'category', 'season', 'validFrom', 'validTo', ...AMOUNT_FIELDS.map(([field]) => field)]
const AMOUNT = /^\d{1,8}(\.\d{1,2})?$/
const tidyAmount = value => String(value ?? '').replace(/[\s,₹]/g, '')

let counter = 0
const nextKey = () => {
    counter += 1
    return `new-${counter}`
}

// ---------------------------------------------------------------- hotel rows

export const blankHotelRow = (place = '') => ({
    key: nextKey(),
    id: null,
    place,
    category: 'delux',
    season: '',
    validFrom: '',
    validTo: '',
    epRate: '',
    cpRate: '',
    mapRate: '',
    extraBedRate: '',
    childRate: ''
})

/** @description a new row that starts as a copy of another: same place, category, season, dates and amounts (to add a season or another category) */
export const copyHotelRow = row => ({
    ...blankHotelRow(),
    ...Object.fromEntries(TEXT_FIELDS.map(field => [field, row[field] ?? '']))
})

/** @description a row from the API, ready to edit */
export const draftHotelRow = row => ({ ...blankHotelRow(), ...row, key: `row-${row.id}` })

/** @description a new row nobody has typed in yet (it is not saved, and not an error) */
export const isUntouched = row =>
    !row.id &&
    !row.place.trim() &&
    !row.season &&
    !row.validFrom &&
    !row.validTo &&
    AMOUNT_FIELDS.every(([field]) => !tidyAmount(row[field]))

/** @description what is wrong with a hotel row, or '' */
export const hotelRowProblem = row => {
    if (!row.place.trim()) return 'Choose the place'
    if (!row.category) return 'Choose a hotel category'
    const badAmount = AMOUNT_FIELDS.find(([field]) => {
        const value = tidyAmount(row[field])
        return value && !AMOUNT.test(value)
    })
    if (badAmount) return `${badAmount[1]} must be an amount like 3500`
    if (!ROOM_FIELDS.some(field => tidyAmount(row[field]))) return 'Enter at least one room rate'
    if (Boolean(row.validFrom) !== Boolean(row.validTo)) return 'A season needs a start and an end date'
    if (row.validFrom && row.validFrom > row.validTo) return 'The season ends before it starts'
    return ''
}

// ? "3000.00" (as the server sends it) and "3000" (as typed) are the same amount
const sameAmount = (a, b) => Number(tidyAmount(a) || 0) === Number(tidyAmount(b) || 0)
const AMOUNT_NAMES = AMOUNT_FIELDS.map(([field]) => field)
const sameRow = (a, b) =>
    TEXT_FIELDS.every(field =>
        AMOUNT_NAMES.includes(field)
            ? sameAmount(a?.[field], b?.[field])
            : String(a?.[field] ?? '').trim() === String(b?.[field] ?? '').trim()
    )

/** @description the rows to send: new ones with something typed, and saved ones that differ from what was loaded */
export const changedHotelRows = (rows, original) =>
    rows
        .filter(row => !isUntouched(row))
        .filter(
            row =>
                !row.id ||
                !sameRow(
                    row,
                    original.find(item => item.id === row.id)
                )
        )

/** @description the same place, category and dates twice: { key → message } for each row after the first */
export const duplicateHotelRows = rows => {
    const seen = new Map()
    const problems = {}
    rows.forEach(row => {
        if (isUntouched(row) || !row.place.trim()) return
        const id = `${nameKey(row.place)}|${row.category}|${row.validFrom}|${row.validTo}`
        if (seen.has(id)) {
            const dates = row.validFrom ? `for ${row.validFrom} to ${row.validTo}` : '(standard rate)'
            problems[row.key] = `${row.place.trim()} ${categoryLabel(row.category)} is already listed ${dates}`
        } else seen.set(id, row.key)
    })
    return problems
}

/** @description the place's rows for the search box: matches the place, category or season */
export const hotelRowsMatching = (rows, text) => {
    const wanted = nameKey(text)
    if (!wanted) return rows
    return rows.filter(row => nameKey(`${row.place} ${categoryLabel(row.category)} ${row.season}`).includes(wanted))
}

/** @description what the server takes for a row */
export const hotelPayload = row => ({
    ...(row.id ? { id: row.id } : {}),
    place: row.place.trim(),
    category: row.category,
    season: row.season.trim(),
    validFrom: row.validFrom,
    validTo: row.validTo,
    ...Object.fromEntries(AMOUNT_FIELDS.map(([field]) => [field, tidyAmount(row[field])]))
})

// ---------------------------------------------------------------- cab rows

export const blankCabRow = () => ({ key: nextKey(), id: null, vehicle: '', perDayRate: '' })
export const draftCabRow = row => ({ ...blankCabRow(), ...row, key: `cab-${row.id}` })
export const cabUntouched = row => !row.id && !row.vehicle.trim() && !tidyAmount(row.perDayRate)

export const cabRowProblem = row => {
    if (!row.vehicle.trim()) return 'Enter the cab type, such as Sedan'
    const value = tidyAmount(row.perDayRate)
    if (!AMOUNT.test(value) || Number(value) <= 0) return 'Enter the rate per day, such as 3500'
    return ''
}

export const changedCabRows = (rows, original) =>
    rows
        .filter(row => !cabUntouched(row))
        .filter(row => {
            if (!row.id) return true
            const before = original.find(item => item.id === row.id)
            return row.vehicle.trim() !== (before?.vehicle || '') || !sameAmount(row.perDayRate, before?.perDayRate)
        })

export const duplicateCabRows = rows => {
    const seen = new Set()
    const problems = {}
    rows.forEach(row => {
        const key = nameKey(row.vehicle)
        if (!key) return
        if (seen.has(key)) problems[row.key] = `${row.vehicle.trim()} is already listed`
        else seen.add(key)
    })
    return problems
}

export const cabPayload = row => ({
    ...(row.id ? { id: row.id } : {}),
    vehicle: row.vehicle.trim(),
    perDayRate: tidyAmount(row.perDayRate)
})

// ---------------------------------------------------------------- the margin

/** @description what is wrong with the margin and rounding boxes, or '' */
export const settingsProblem = ({ defaultMarginPct, roundTo }) => {
    const margin = Number(defaultMarginPct)
    if (String(defaultMarginPct).trim() === '' || !Number.isFinite(margin) || margin < 0 || margin > 500)
        return 'The margin is a percentage between 0 and 500'
    const step = Number(roundTo)
    if (!Number.isInteger(step) || step < 1 || step > 10000)
        return 'Round prices to a whole number of rupees, such as 100'
    return ''
}

// ---------------------------------------------------------------- Excel

const HEADERS = {
    place: ['place', 'destination', 'location', 'city', 'town'],
    category: ['category', 'hotelcategory', 'hotel', 'type', 'class'],
    season: ['season', 'seasonname', 'seasontype'],
    validFrom: ['from', 'validfrom', 'start', 'seasonstart', 'startdate', 'datefrom'],
    validTo: ['to', 'validto', 'end', 'seasonend', 'enddate', 'dateto', 'till'],
    epRate: ['ep', 'eprate', 'roomonly', 'roomonlyep'],
    cpRate: ['cp', 'cprate', 'breakfast', 'breakfastcp'],
    mapRate: ['map', 'maprate', 'breakfastdinner', 'breakfastanddinner', 'breakfastdinnermap'],
    extraBedRate: ['extrabed', 'extrabedrate', 'extramattress'],
    childRate: ['child', 'childrate', 'childwithoutbed', 'childnobed'],
    vehicle: ['vehicle', 'cab', 'cabtype', 'car', 'vehicletype'],
    perDayRate: ['perday', 'perdayrate', 'rateperday', 'dayrate', 'rate', 'price']
}

const headerKey = text => nameKey(text).replace(/[^a-z0-9]/g, '')

/** @description a date as an Excel file gives it (a serial number, a Date, "2026-12-25" or "25/12/2026") as 'YYYY-MM-DD'; '' when it is none */
export const excelDay = value => {
    if (value === null || value === undefined || value === '') return ''
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : value.toISOString().slice(0, 10)
    if (typeof value === 'number') {
        if (value < 20000 || value > 80000) return ''
        return new Date(Math.round((value - 25569) * 86400 * 1000)).toISOString().slice(0, 10)
    }
    const text = String(value).trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text
    const dmy = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(text)
    if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
    return ''
}

/** @description the sheet's rows as { field → cell }, whichever way its headers are worded; empty rows are dropped */
const readSheet = (rows, wanted) =>
    (rows || [])
        .map(row => {
            const found = {}
            Object.entries(row).forEach(([header, cell]) => {
                const key = headerKey(header)
                const field = wanted.find(name => HEADERS[name].includes(key))
                if (field && found[field] === undefined) found[field] = cell
            })
            return found
        })
        .filter(row => Object.values(row).some(cell => String(cell ?? '').trim() !== ''))

const asText = value => (value === null || value === undefined ? '' : String(value).trim())

/** @description the hotel rows of a sheet, ready for the import */
export const hotelsFromSheet = rows =>
    readSheet(rows, [
        'place',
        'category',
        'season',
        'validFrom',
        'validTo',
        'epRate',
        'cpRate',
        'mapRate',
        'extraBedRate',
        'childRate'
    ]).map(row => ({
        place: asText(row.place),
        category: asText(row.category),
        season: asText(row.season),
        validFrom: excelDay(row.validFrom),
        validTo: excelDay(row.validTo),
        epRate: asText(row.epRate),
        cpRate: asText(row.cpRate),
        mapRate: asText(row.mapRate),
        extraBedRate: asText(row.extraBedRate),
        childRate: asText(row.childRate)
    }))

/** @description the cab rows of a sheet, ready for the import */
export const cabsFromSheet = rows =>
    readSheet(rows, ['vehicle', 'perDayRate']).map(row => ({
        vehicle: asText(row.vehicle),
        perDayRate: asText(row.perDayRate)
    }))

/** @description the sheets of a workbook: the one named for hotels (else the first), and the one named for cabs */
export const pickSheets = names => {
    // ? the cab sheet is named first: "Vehicle rates" must not be taken for the hotel sheet because it says "rates"
    const cabs = names.find(name => /cab|vehicle|car|taxi/i.test(name))
    const hotels =
        names.find(name => name !== cabs && /hotel|room|stay|rate/i.test(name)) ||
        names.find(name => name !== cabs) ||
        names[0]
    return { hotels, cabs }
}

/** @description the template: header rows and a couple of examples, as arrays of rows per sheet */
export const templateSheets = () => ({
    Hotels: [
        ['Place', 'Category', 'Season', 'From', 'To', 'EP', 'CP', 'MAP', 'Extra bed', 'Child'],
        ['Manali', 'Deluxe', '', '', '', 2500, 3000, 3800, 800, 600],
        ['Manali', 'Deluxe', 'New Year', '2026-12-25', '2027-01-05', 4000, 5000, 6200, 1200, 900],
        ['Shimla', 'Luxury', '', '', '', 5500, 6500, 8000, 1500, 1000]
    ],
    Cabs: [
        ['Vehicle', 'Per day'],
        ['Sedan', 3500],
        ['Innova', 4500]
    ]
})

/**
 * @description the margin tab's worked example: what a trip that costs the agency ₹23,000 for 2 guests is priced at
 * @returns {{ cost: number, margin: number, total: number, perPerson: number }}
 */
export const marginExample = (defaultMarginPct, roundTo, cost = 23000, guests = 2) => {
    const percent = Number(defaultMarginPct)
    const step = Math.max(Math.trunc(Number(roundTo)) || 1, 1)
    const safe = Number.isFinite(percent) && percent >= 0 ? percent : 0
    const margin = Math.round(cost * safe) / 100
    const total = cost + margin
    return { cost, margin, total, perPerson: Math.round(total / guests / step) * step }
}
