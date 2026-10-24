/**
 * THE ROUTE SHEET — the drives as one row per route with a price for each cab, instead of one row per cab. Pure functions, no
 * React. A sheet row stands for several saved drives (one per cab) that share the same places, ways and season; saving works
 * out which of those to add, change or remove. The server checks everything again (Helpers/rateCard.helper.js).
 */
import nameKey from '@views/forms/packages/nameKey'

const AMOUNT = /^\d{1,8}(\.\d{1,2})?$/
const tidy = value => String(value ?? '').replace(/[\s,₹]/g, '')
const text = value => String(value ?? '').trim()

let counter = 0
const nextKey = () => {
    counter += 1
    return `sheet-${counter}`
}

const datesOf = row => `${row.validFrom || ''}|${row.validTo || ''}|${Boolean(row.repeatsYearly)}`

/** @description what makes two sheet rows the same drives, whichever cabs they price */
const groupOf = row =>
    `${nameKey(row.fromPlace)}>${nameKey(row.toPlace)}|${row.bothWays === false ? 'one' : 'both'}|${nameKey(row.season)}|${datesOf(row)}`

/** @description the same, but "A to B" and "B to A" both-ways are one drive */
const driveOf = row => {
    const a = nameKey(row.fromPlace)
    const b = nameKey(row.toPlace)
    const places = row.bothWays === false ? `${a}>${b}` : [a, b].sort().join('<>')
    return `${places}|${nameKey(row.season)}|${datesOf(row)}`
}

export const blankSheetRow = (extra = {}) => ({
    key: nextKey(),
    fromPlace: '',
    toPlace: '',
    bothWays: true,
    season: '',
    validFrom: '',
    validTo: '',
    repeatsYearly: false,
    prices: {},
    ...extra
})

/**
 * @description the sheet of saved drives
 * @param {object[]} routes the saved drives, one per cab
 * @returns {{ rows: object[], cabs: string[] }} the sheet rows in the order the drives were first saved, and the cab names (as first written)
 */
export const sheetFromRoutes = routes => {
    const rows = new Map()
    const cabs = new Map()
    ;[...routes]
        .sort((a, b) => a.id - b.id)
        .forEach(route => {
            const cab = nameKey(route.vehicle)
            if (!cabs.has(cab)) cabs.set(cab, text(route.vehicle))
            const id = groupOf(route)
            if (!rows.has(id))
                rows.set(
                    id,
                    blankSheetRow({
                        key: `route-${route.id}`,
                        fromPlace: route.fromPlace,
                        toPlace: route.toPlace,
                        bothWays: route.bothWays !== false,
                        season: route.season || '',
                        validFrom: route.validFrom || '',
                        validTo: route.validTo || '',
                        repeatsYearly: Boolean(route.repeatsYearly)
                    })
                )
            rows.get(id).prices[cab] = { id: route.id, value: tidy(route.rate) }
        })
    return { rows: [...rows.values()], cabs: [...cabs.values()] }
}

const priceOf = (row, cab) => tidy(row.prices[nameKey(cab)]?.value)
const typedAny = (row, cabs) => cabs.some(cab => priceOf(row, cab) !== '')

/** @description a row nobody has typed in yet (an added blank row left alone is not an error) */
export const sheetUntouched = (row, cabs) =>
    !text(row.fromPlace) &&
    !text(row.toPlace) &&
    !text(row.season) &&
    !row.validFrom &&
    !row.validTo &&
    !typedAny(row, cabs)

/** @returns {string} what is wrong with a row, or '' */
export const sheetProblem = (row, cabs) => {
    if (!text(row.fromPlace) || !text(row.toPlace)) return 'Enter where the drive starts and ends'
    if (nameKey(row.fromPlace) === nameKey(row.toPlace)) return 'A drive needs two different places'
    if (!typedAny(row, cabs)) return 'Enter a price for at least one cab'
    const bad = cabs.find(
        cab => priceOf(row, cab) !== '' && (!AMOUNT.test(priceOf(row, cab)) || Number(priceOf(row, cab)) <= 0)
    )
    if (bad) return `Enter ${bad}’s price as an amount, such as 4500`
    if (Boolean(row.validFrom) !== Boolean(row.validTo)) return 'A season needs a start and an end date'
    if (row.repeatsYearly && !row.validFrom) return 'A season that comes back every year needs its dates'
    if (!row.repeatsYearly && row.validFrom && row.validFrom > row.validTo) return 'The season ends before it starts'
    return ''
}

/** @returns {Record<string, string>} the problem of each row that repeats another row's drive, by row key */
export const sheetDuplicates = (rows, cabs) => {
    const seen = new Set()
    const problems = {}
    rows.forEach(row => {
        if (sheetUntouched(row, cabs) || !text(row.fromPlace) || !text(row.toPlace)) return
        const id = driveOf(row)
        if (seen.has(id))
            problems[row.key] = `${text(row.fromPlace)} to ${text(row.toPlace)} is already listed for these dates`
        else seen.add(id)
    })
    return problems
}

const sameRowFields = (row, before) =>
    ['fromPlace', 'toPlace', 'season', 'validFrom', 'validTo'].every(
        field => text(row[field]) === text(before[field])
    ) &&
    Boolean(row.repeatsYearly) === Boolean(before.repeatsYearly) &&
    (row.bothWays !== false) === (before.bothWays !== false)

/**
 * @description what saving does: the drives to add or change (one per cab price) and the saved ones to remove — a cleared
 *              price, a removed row, or a cab column emptied
 * @param {object[]} rows the sheet now
 * @param {object[]} original the sheet as saved
 * @param {string[]} cabs the cab names in the sheet
 * @returns {{ rows: object[], removeIds: number[] }}
 */
export const sheetChanges = (rows, original, cabs) => {
    const out = []
    const removeIds = []
    const before = new Map(original.map(row => [row.key, row]))
    rows.forEach(row => {
        if (sheetUntouched(row, cabs)) return
        const was = before.get(row.key)
        cabs.forEach(cab => {
            const value = priceOf(row, cab)
            const saved = row.prices[nameKey(cab)]?.id ? row.prices[nameKey(cab)] : null
            if (!value) {
                if (saved) removeIds.push(saved.id)
                return
            }
            const unchanged = saved && was && sameRowFields(row, was) && tidy(was.prices[nameKey(cab)]?.value) === value
            if (unchanged) return
            out.push({
                ...(saved ? { id: saved.id } : {}),
                vehicle: cab,
                fromPlace: text(row.fromPlace),
                toPlace: text(row.toPlace),
                rate: value,
                bothWays: row.bothWays !== false,
                season: text(row.season),
                validFrom: row.validFrom || '',
                validTo: row.validTo || '',
                repeatsYearly: Boolean(row.repeatsYearly)
            })
        })
    })
    // ? a saved drive whose row was taken out of the sheet
    const present = new Set(rows.map(row => row.key))
    original.forEach(row => {
        if (present.has(row.key)) return
        Object.values(row.prices).forEach(price => price.id && removeIds.push(price.id))
    })
    return { rows: out, removeIds: [...new Set(removeIds)] }
}

/** @description a copy of a row to price a season: the same places and prices, with no dates and nothing saved yet */
export const copySheetRow = row =>
    blankSheetRow({
        fromPlace: row.fromPlace,
        toPlace: row.toPlace,
        bothWays: row.bothWays,
        prices: Object.fromEntries(
            Object.entries(row.prices).map(([cab, price]) => [cab, { id: null, value: price.value }])
        )
    })

export const withPrice = (row, cab, value) => ({
    ...row,
    prices: { ...row.prices, [nameKey(cab)]: { id: row.prices[nameKey(cab)]?.id || null, value } }
})

export const priceText = (row, cab) => row.prices[nameKey(cab)]?.value ?? ''
