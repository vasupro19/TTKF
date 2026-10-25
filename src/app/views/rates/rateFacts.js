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
const TEXT_FIELDS = [
    'place',
    'category',
    'season',
    'validFrom',
    'validTo',
    'repeatsYearly',
    ...AMOUNT_FIELDS.map(([field]) => field)
]
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
    repeatsYearly: false,
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
    if (row.repeatsYearly && !row.validFrom) return 'A season that comes back every year needs its dates'
    if (!row.repeatsYearly && row.validFrom && row.validFrom > row.validTo) return 'The season ends before it starts'
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

/** @description a row's season in words, for a message: "for 2026-12-15 to 2027-01-05 every year" or "(standard rate)" */
const seasonWords = row =>
    row.validFrom
        ? `for ${row.validFrom} to ${row.validTo}${row.repeatsYearly ? ' every year' : ''}`
        : '(standard rate)'

/** @description the same place, category and dates twice: { key → message } for each row after the first */
export const duplicateHotelRows = rows => {
    const seen = new Map()
    const problems = {}
    rows.forEach(row => {
        if (isUntouched(row) || !row.place.trim()) return
        const id = `${nameKey(row.place)}|${row.category}|${row.validFrom}|${row.validTo}|${Boolean(row.repeatsYearly)}`
        if (seen.has(id)) {
            const dates = seasonWords(row)
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
    repeatsYearly: Boolean(row.repeatsYearly),
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

// ---------------------------------------------------------------- cab routes and local days

const SEASON_FIELDS = ['season', 'validFrom', 'validTo']

/**
 * @description the helpers of a cab table, built from what the table holds. `texts` are the fields compared as text,
 *              `amount` the price field, `problemOf` the row's own check and `idOf` what makes two rows the same rate
 */
const cabKit = ({
    texts,
    amount,
    extras = [],
    amountMessage = 'Enter the price, such as 4500',
    allowZero = false,
    blank,
    problemOf,
    idOf,
    said
}) => {
    const empty = () => ({
        key: nextKey(),
        id: null,
        ...blank,
        season: '',
        validFrom: '',
        validTo: '',
        repeatsYearly: false
    })
    const compared = [...texts, ...SEASON_FIELDS, 'repeatsYearly']
    const untouched = row =>
        !row.id &&
        [...texts, ...SEASON_FIELDS].every(field => !String(row[field] ?? '').trim()) &&
        !tidyAmount(row[amount]) &&
        extras.every(field => !tidyAmount(row[field]))
    const sameAs = (a, b) =>
        compared.every(field => String(a?.[field] ?? '').trim() === String(b?.[field] ?? '').trim()) &&
        [amount, ...extras].every(field => sameAmount(a?.[field], b?.[field]))
    return {
        blank: (extra = {}) => ({ ...empty(), ...extra }),
        draft: (row, prefix) => ({ ...empty(), ...row, key: `${prefix}-${row.id}` }),
        copy: row => ({
            ...empty(),
            ...Object.fromEntries(
                [...texts, ...SEASON_FIELDS, 'repeatsYearly', amount, ...extras, ...Object.keys(blank)].map(field => [
                    field,
                    row[field] ?? ''
                ])
            )
        }),
        untouched,
        problem: row => {
            const own = problemOf(row)
            if (own) return own
            const value = tidyAmount(row[amount])
            if (!AMOUNT.test(value) || (!allowZero && Number(value) <= 0)) return amountMessage
            const badExtra = extras.find(field => tidyAmount(row[field]) && !AMOUNT.test(tidyAmount(row[field])))
            if (badExtra) return 'The child fare must be an amount, such as 600'
            if (Boolean(row.validFrom) !== Boolean(row.validTo)) return 'A season needs a start and an end date'
            if (row.repeatsYearly && !row.validFrom) return 'A season that comes back every year needs its dates'
            if (!row.repeatsYearly && row.validFrom && row.validFrom > row.validTo)
                return 'The season ends before it starts'
            return ''
        },
        changed: (rows, original) =>
            rows
                .filter(row => !untouched(row))
                .filter(
                    row =>
                        !row.id ||
                        !sameAs(
                            row,
                            original.find(item => item.id === row.id)
                        )
                ),
        duplicates: rows => {
            const seen = new Set()
            const problems = {}
            rows.forEach(row => {
                if (untouched(row)) return
                const id = idOf(row)
                if (!id) return
                if (seen.has(id)) problems[row.key] = `${said(row)} is already listed ${seasonWords(row)}`
                else seen.add(id)
            })
            return problems
        },
        payload: row => ({
            ...(row.id ? { id: row.id } : {}),
            ...Object.fromEntries(texts.map(field => [field, String(row[field] ?? '').trim()])),
            ...Object.fromEntries(
                Object.keys(blank)
                    .filter(field => !texts.includes(field))
                    .map(field => [field, row[field]])
            ),
            season: String(row.season ?? '').trim(),
            validFrom: row.validFrom,
            validTo: row.validTo,
            repeatsYearly: Boolean(row.repeatsYearly),
            [amount]: tidyAmount(row[amount]),
            ...Object.fromEntries(extras.map(field => [field, tidyAmount(row[field])]))
        })
    }
}

const dates = row => `${row.validFrom}|${row.validTo}|${Boolean(row.repeatsYearly)}`

/** @description a drive: this cab, from a place to another, one price (both ways unless it is ticked off) */
export const routeKit = cabKit({
    texts: ['vehicle', 'fromPlace', 'toPlace'],
    amount: 'rate',
    blank: { vehicle: '', fromPlace: '', toPlace: '', rate: '', bothWays: true },
    problemOf: row => {
        if (!row.vehicle.trim()) return 'Enter the cab type, such as Sedan'
        if (!row.fromPlace.trim() || !row.toPlace.trim()) return 'Enter where the drive starts and ends'
        if (nameKey(row.fromPlace) === nameKey(row.toPlace)) return 'A drive needs two different places'
        return ''
    },
    idOf: row => {
        const a = nameKey(row.fromPlace)
        const b = nameKey(row.toPlace)
        if (!a || !b || !nameKey(row.vehicle)) return ''
        // ? both ways: "Chandigarh to Manali" and "Manali to Chandigarh" are the same drive
        const places = row.bothWays === false ? `${a}>${b}` : [a, b].sort().join('<>')
        return `${nameKey(row.vehicle)}|${places}|${dates(row)}`
    },
    said: row => `${row.vehicle.trim()} ${row.fromPlace.trim()} to ${row.toPlace.trim()}`
})

/** @description a ticket: this mode (Volvo, Train, Flight) between two places, a fare for an adult and, when it differs, a child */
export const ticketKit = cabKit({
    texts: ['mode', 'fromPlace', 'toPlace'],
    amount: 'adultRate',
    extras: ['childRate'],
    blank: { mode: '', fromPlace: '', toPlace: '', adultRate: '', childRate: '', bothWays: true },
    problemOf: row => {
        if (!row.mode.trim()) return 'Enter how they travel, such as Volvo'
        if (!row.fromPlace.trim() || !row.toPlace.trim()) return 'Enter where the journey starts and ends'
        if (nameKey(row.fromPlace) === nameKey(row.toPlace)) return 'A journey needs two different places'
        return ''
    },
    idOf: row => {
        const a = nameKey(row.fromPlace)
        const b = nameKey(row.toPlace)
        if (!a || !b || !nameKey(row.mode)) return ''
        const places = row.bothWays === false ? `${a}>${b}` : [a, b].sort().join('<>')
        return `${nameKey(row.mode)}|${places}|${dates(row)}`
    },
    said: row => `${row.mode.trim()} ${row.fromPlace.trim()} to ${row.toPlace.trim()}`
})

/** @description the margin of a campaign (or every campaign) and, when it has dates, a season; 0% is a margin */
export const marginKit = cabKit({
    texts: ['campaignId'],
    amount: 'marginPct',
    amountMessage: 'Enter the margin as a percentage, such as 20',
    allowZero: true,
    blank: { campaignId: '', marginPct: '' },
    problemOf: row => (Number(tidyAmount(row.marginPct)) > 500 ? 'The margin is a percentage between 0 and 500' : ''),
    idOf: row => `${String(row.campaignId || 'all')}|${dates(row)}`,
    said: row => (row.campaignId ? 'This campaign' : 'All campaigns')
})

/** @description a day in one place (local sightseeing): this cab, one price */
export const localKit = cabKit({
    texts: ['vehicle', 'place'],
    amount: 'dayRate',
    blank: { vehicle: '', place: '', dayRate: '' },
    problemOf: row => {
        if (!row.vehicle.trim()) return 'Enter the cab type, such as Sedan'
        if (!row.place.trim()) return 'Choose the place'
        return ''
    },
    idOf: row =>
        nameKey(row.vehicle) && nameKey(row.place) ? `${nameKey(row.vehicle)}|${nameKey(row.place)}|${dates(row)}` : '',
    said: row => `${row.vehicle.trim()} in ${row.place.trim()}`
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
    repeatsYearly: ['everyyear', 'yearly', 'repeatsyearly', 'repeat', 'everyyearly'],
    vehicle: ['vehicle', 'cab', 'cabtype', 'car', 'vehicletype'],
    perDayRate: ['perday', 'perdayrate', 'rateperday', 'dayrate', 'rate', 'price']
}

// ? a cab route's sheet words "from" and "to" for the places; its dates say "valid from" and "valid to"
const ROUTE_HEADERS = {
    vehicle: HEADERS.vehicle,
    fromPlace: ['from', 'fromplace', 'origin', 'pickup', 'start'],
    toPlace: ['to', 'toplace', 'destination', 'drop', 'end'],
    rate: ['rate', 'price', 'fare', 'cost', 'amount'],
    bothWays: ['bothways', 'return', 'roundtrip', 'twoway'],
    season: HEADERS.season,
    validFrom: ['validfrom', 'seasonstart', 'datefrom', 'startdate', 'fromdate'],
    validTo: ['validto', 'seasonend', 'dateto', 'enddate', 'todate', 'till'],
    repeatsYearly: HEADERS.repeatsYearly
}

const LOCAL_HEADERS = {
    vehicle: HEADERS.vehicle,
    place: HEADERS.place,
    dayRate: ['dayrate', 'perday', 'rate', 'price', 'localrate', 'sightseeing'],
    season: HEADERS.season,
    validFrom: HEADERS.validFrom,
    validTo: HEADERS.validTo,
    repeatsYearly: HEADERS.repeatsYearly
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
const readSheet = (rows, wanted, map = HEADERS) =>
    (rows || [])
        .map(row => {
            const found = {}
            Object.entries(row).forEach(([header, cell]) => {
                const key = headerKey(header)
                const field = wanted.find(name => map[name].includes(key))
                if (field && found[field] === undefined) found[field] = cell
            })
            return found
        })
        .filter(row => Object.values(row).some(cell => String(cell ?? '').trim() !== ''))

const asText = value => (value === null || value === undefined ? '' : String(value).trim())

/** @description "Yes", "true", 1 → true; "No", "false", 0 → false; an empty cell is `fallback` */
const yesNo = (value, fallback) => {
    const text = asText(value).toLowerCase()
    if (!text) return fallback
    return ['yes', 'y', 'true', '1', 'both', 'both ways'].includes(text)
}

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
        'childRate',
        'repeatsYearly'
    ]).map(row => ({
        place: asText(row.place),
        category: asText(row.category),
        season: asText(row.season),
        validFrom: excelDay(row.validFrom),
        validTo: excelDay(row.validTo),
        repeatsYearly: yesNo(row.repeatsYearly, false),
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

/** @description the cab route rows of a sheet, ready for the import */
export const routesFromSheet = rows =>
    readSheet(rows, Object.keys(ROUTE_HEADERS), ROUTE_HEADERS).map(row => ({
        vehicle: asText(row.vehicle),
        fromPlace: asText(row.fromPlace),
        toPlace: asText(row.toPlace),
        rate: asText(row.rate),
        bothWays: yesNo(row.bothWays, true),
        season: asText(row.season),
        validFrom: excelDay(row.validFrom),
        validTo: excelDay(row.validTo),
        repeatsYearly: yesNo(row.repeatsYearly, false)
    }))

/** @description the local-day rows of a sheet, ready for the import */
export const localFromSheet = rows =>
    readSheet(rows, Object.keys(LOCAL_HEADERS), LOCAL_HEADERS).map(row => ({
        vehicle: asText(row.vehicle),
        place: asText(row.place),
        dayRate: asText(row.dayRate),
        season: asText(row.season),
        validFrom: excelDay(row.validFrom),
        validTo: excelDay(row.validTo),
        repeatsYearly: yesNo(row.repeatsYearly, false)
    }))

/** @description the sheets of a workbook: hotels, cab routes, cab days in a place, and a cab's plain day rate (each may be missing) */
export const pickSheets = names => {
    // ? the cab sheets are named first: "Cab routes" must not be taken for the hotel sheet because it says "rates"
    const routes = names.find(name => /route|transfer/i.test(name))
    const days = names.find(name => name !== routes && /local|sightseeing|cab days|days/i.test(name))
    const cabs = names.find(name => name !== routes && name !== days && /cab|vehicle|car|taxi/i.test(name))
    const taken = [routes, days, cabs]
    const hotels =
        names.find(name => !taken.includes(name) && /hotel|room|stay|rate/i.test(name)) ||
        names.find(name => !taken.includes(name)) ||
        names[0]
    return { hotels, cabs, routes, days }
}

/** @description the template: header rows and a couple of examples, as arrays of rows per sheet */
export const templateSheets = () => ({
    Hotels: [
        ['Place', 'Category', 'Season', 'From', 'To', 'Every year', 'EP', 'CP', 'MAP', 'Extra bed', 'Child'],
        ['Manali', 'Deluxe', '', '', '', '', 2500, 3000, 3800, 800, 600],
        ['Manali', 'Deluxe', 'New Year', '2026-12-25', '2027-01-05', 'Yes', 4000, 5000, 6200, 1200, 900],
        ['Shimla', 'Luxury', '', '', '', '', 5500, 6500, 8000, 1500, 1000]
    ],
    'Cab routes': [
        ['Vehicle', 'From', 'To', 'Price', 'Both ways', 'Season', 'Valid from', 'Valid to', 'Every year'],
        ['Sedan', 'Chandigarh', 'Manali', 5500, 'Yes', '', '', '', ''],
        ['Sedan', 'Chandigarh', 'Manali', 6500, 'Yes', 'New Year', '2026-12-20', '2027-01-05', 'Yes'],
        ['Innova', 'Chandigarh', 'Dharamshala', 6000, 'Yes', '', '', '', '']
    ],
    'Cab days': [
        ['Vehicle', 'Place', 'Day rate', 'Season', 'From', 'To', 'Every year'],
        ['Sedan', 'Manali', 2500, '', '', '', ''],
        ['Innova', 'Manali', 3500, '', '', '', '']
    ],
    Cabs: [
        ['Vehicle', 'Per day'],
        ['Sedan', 3000],
        ['Innova', 4000]
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
