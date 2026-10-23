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
