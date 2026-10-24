/**
 * A QUOTE PRICED FROM THE RATE CARD — what goes into the price boxes. Pure functions, no React.
 *
 * The server answers with the four hotel categories, each priced (`ok`, with `perPerson`) or not (`missing` says which rate the
 * rate card lacks). Only the priced ones are used: a category that could not be priced keeps whatever the agent had typed.
 */
import { PER_PERSON, TOTAL, priceBasisOf } from './pricing'

/**
 * @description the values for the price boxes, by price key ("deluxePrice")
 * @param {{ categories?: { priceKey: string, ok: boolean, perPerson: number|null }[] }} result the server's answer
 * @param {{ basis?: string, people?: number }} options a quote priced as a total for the group takes the per-person price times the guests
 * @returns {Record<string, string>} only the categories that were priced
 */
export const pricesFromResult = (result, { basis = PER_PERSON, people = 0 } = {}) => {
    const picked = {}
    ;(result?.categories || []).forEach(category => {
        const perPerson = Number(category.perPerson)
        if (!category.ok || !(perPerson > 0)) return
        const amount = priceBasisOf(basis) === TOTAL ? perPerson * Math.max(Number(people) || 1, 1) : perPerson
        picked[category.priceKey] = String(Math.round(amount))
    })
    return picked
}

/** @returns {number} how many of the four categories were priced */
export const pricedCount = result => (result?.categories || []).filter(category => category.ok).length

/**
 * @description what the rate card lacks, once each: "No Luxury rate for Manali" is said once however many categories need it
 * @returns {string[]}
 */
export const missingRates = result => [
    ...new Set((result?.categories || []).flatMap(category => category.missing || []))
]

/** @description the line under the heading: who the price is for and how it was worked out (the margin only for those who may see it) */
export const inputsLine = (inputs, canSeeCosts) => {
    if (!inputs) return ''
    const parts = [
        `${inputs.persons} guest${inputs.persons === 1 ? '' : 's'}`,
        `${inputs.nights} night${inputs.nights === 1 ? '' : 's'}`,
        `${inputs.rooms} room${inputs.rooms === 1 ? '' : 's'}`,
        `${inputs.mealPlan} meals`,
        inputs.vehicle ? `${inputs.vehicle} cab` : 'no cab'
    ]
    if (canSeeCosts && inputs.marginPct !== null && inputs.marginPct !== undefined)
        parts.push(`${inputs.marginPct}% margin`)
    return parts.join(' · ')
}

const PLAN_FIELDS = { EP: 'epRate', CP: 'cpRate', MAP: 'mapRate' }

/** @description the question for a rate the card has no row for: "Sedan, Manali to Jibhi" */
export const gapLabel = gap => {
    if (gap.kind === 'route') return `${gap.vehicle}: ${gap.from} to ${gap.to}`
    if (gap.kind === 'local') return `${gap.vehicle}: a day in ${gap.place}`
    return `${gap.categoryLabel} hotel in ${gap.place}`
}

/** @description what the price is for, under the question */
export const gapHint = gap => {
    if (gap.kind === 'route') return 'per drive, also used for the drive back'
    if (gap.kind === 'local') return 'per day of local sightseeing'
    return `per room per night, ${gap.mealPlan} meals`
}

/**
 * @description the rows to save for the prices typed beside the missing rates — each is the plain (all-year) price; a gap left
 *              empty is skipped, so the agent can fill what they know
 * @param {object[]} gaps `gaps` from the server's answer
 * @param {Record<string, string>} amounts the typed price by gap id
 * @returns {{ routes: object[], days: object[], hotels: object[] }}
 */
export const gapRows = (gaps, amounts) => {
    const out = { routes: [], days: [], hotels: [] }
    ;(gaps || []).forEach(gap => {
        const amount = String(amounts?.[gap.id] ?? '').replace(/[\s,]/g, '')
        if (!(Number(amount) > 0)) return
        if (gap.kind === 'route')
            out.routes.push({
                vehicle: gap.vehicle,
                fromPlace: gap.from,
                toPlace: gap.to,
                rate: amount,
                bothWays: true
            })
        else if (gap.kind === 'local') out.days.push({ vehicle: gap.vehicle, place: gap.place, dayRate: amount })
        else
            out.hotels.push({
                place: gap.place,
                category: gap.category,
                [PLAN_FIELDS[gap.mealPlan] || 'cpRate']: amount
            })
    })
    return out
}
