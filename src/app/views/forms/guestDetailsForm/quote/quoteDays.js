/**
 * QUOTE DAYS — small, pure helpers the quotation's itinerary step reads.
 */

export const HOTEL_TIERS = [
    { key: 'deluxe', label: 'Deluxe', category: 'Deluxe', priceKey: 'deluxePrice' },
    { key: 'superDeluxe', label: 'Super Deluxe', category: 'Super Deluxe', priceKey: 'superDeluxePrice' },
    { key: 'luxury', label: 'Luxury', category: 'Luxury', priceKey: 'luxuryPrice' },
    { key: 'premium', label: 'Premium', category: 'Premium', priceKey: 'premiumPrice' }
]

export const ENTRY_TYPES = [
    { value: 'Stay', label: 'Stay' },
    { value: 'Transit', label: 'Travel day' },
    { value: 'TransitStay', label: 'Travel + stay' },
    { value: 'FreshUp', label: 'Fresh up' }
]

export const entryTypeLabel = value => ENTRY_TYPES.find(type => type.value === value)?.label || 'Stay'

export const isStayType = value => !value || value === 'Stay' || value === 'TransitStay'

const LEGACY_TRANSIT_DESTINATIONS = new Set(['OVERNIGHT JOURNEY', 'FRESH UP', 'DAY JOURNEY'])

const isStayDay = item => {
    const type = item?.entryType || item?.fullItem?.entryType
    if (type) return isStayType(type)
    return !LEGACY_TRANSIT_DESTINATIONS.has(String(item?.destination || '').toUpperCase())
}

/**
 * @description "Hotel A | Hotel B" → ["Hotel A", "Hotel B"]; one name per line works too
 */
export const hotelList = text =>
    String(text || '')
        .split(/\s*\|\s*|\n+/)
        .map(name => name.trim())
        .filter(Boolean)

/**
 * @description consecutive nights per place, in trip order: [{ destination: 'Shimla', nights: 2 }, …]
 */
export const stayBreakdown = days => {
    const stays = []
    let current = null
    days.forEach(item => {
        if (!isStayDay(item)) {
            current = null
            return
        }
        if (current && current.destination === item.destination) {
            current.nights += 1
            return
        }
        current = { destination: item.destination, nights: 1 }
        stays.push(current)
    })
    return stays
}

/**
 * @description "6 days · 5 nights · Shimla 2N, Manali 3N"
 */
export const daysSummary = (days, stays) => {
    const nights = stays.reduce((sum, stay) => sum + stay.nights, 0)
    return [
        `${days.length} day${days.length === 1 ? '' : 's'}`,
        nights ? `${nights} night${nights === 1 ? '' : 's'}` : '',
        stays
            .filter(stay => stay.destination)
            .map(stay => `${stay.destination} ${stay.nights}N`)
            .join(', ')
    ]
        .filter(Boolean)
        .join(' · ')
}

/**
 * @description the date of day `index` (0-based) of a trip starting on `startDate` (YYYY-MM-DD), e.g. "Mon, 5 Oct"
 */
export const dayDate = (startDate, index) => {
    if (!/^\d{4}-\d{2}-\d{2}/.test(startDate || '')) return ''
    const date = new Date(`${startDate.slice(0, 10)}T00:00:00Z`)
    date.setUTCDate(date.getUTCDate() + index)
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
}

/**
 * @description the `order` writes that move one day up or down. Days are renumbered 1…n in their new order, so
 *              gaps (a day was deleted) and ties (older quotes saved every day as 0) are repaired on the way;
 *              only days whose number changes are returned.
 * @returns {Array<{ day: object, order: number }>|null} null when the day is already at that end
 */
export const reorderDays = (sortedDays, index, direction) => {
    const target = direction === 'up' ? index - 1 : index + 1
    if (index < 0 || target < 0 || target >= sortedDays.length) return null
    const next = [...sortedDays]
    ;[next[index], next[target]] = [next[target], next[index]]
    return next
        .map((day, position) => ({ day, order: position + 1 }))
        .filter(({ day, order }) => day.fullItem?.order !== order)
}

export const byOrder = (a, b) => (a.fullItem?.order ?? 0) - (b.fullItem?.order ?? 0)

export const formatRupees = value => {
    const amount = Number(value)
    return value !== '' && value !== null && value !== undefined && Number.isFinite(amount)
        ? `₹${amount.toLocaleString('en-IN')}`
        : ''
}

/**
 * @description the campaign a quote belongs to: the one most of its days come from (each day's saved day, else its
 *              destination); on a tie the lead's campaign if it is one of them. A quote with no days has none of
 *              its own — the caller falls back to the campaign chosen for it, then the lead's. Mirrors the API's
 *              Helpers/quoteCampaign.helper.js, which picks the inclusions and bank details the guest sees.
 * @returns {number|null}
 */
export const campaignOfDays = (days, leadCampaignId = null) => {
    const counts = new Map()
    days.forEach(day => {
        const id = Number(day?.fullItem?.itenary?.campaignId ?? day?.fullItem?.destination?.campaignId) || null
        if (id) counts.set(id, (counts.get(id) || 0) + 1)
    })
    if (!counts.size) return null
    const most = Math.max(...counts.values())
    const leaders = [...counts].filter(([, count]) => count === most).map(([id]) => id)
    return leaders.includes(Number(leadCampaignId)) ? Number(leadCampaignId) : leaders[0]
}
