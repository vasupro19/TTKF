/**
 * How a quote's prices read: per person (the default, and what every quote made before meant) or a total for the
 * whole group. Booking a per-person quote multiplies the price by the guests — adults and children.
 */
export const PER_PERSON = 'perPerson'
export const TOTAL = 'total'

export const priceBasisOf = value => (value === TOTAL ? TOTAL : PER_PERSON)

/** @description the guests a per-person price is multiplied by */
export const headCount = ({ adults, children } = {}) =>
    Math.max(0, Number(adults) || 0) + Math.max(0, Number(children) || 0)

export const guestsLabel = people => `${people} guest${people === 1 ? '' : 's'}`

/**
 * @description what the group pays for one hotel category: a per-person price times the guests, a total as it is
 * @returns {number} 0 when the category has no price
 */
export const groupPrice = (price, basis, people) => {
    const amount = Number(price) || 0
    if (amount <= 0) return 0
    return priceBasisOf(basis) === TOTAL || !people ? amount : amount * people
}
