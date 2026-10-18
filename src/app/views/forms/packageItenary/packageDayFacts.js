/**
 * PACKAGE DAYS — what the days screen shows and decides, as pure functions (no React).
 */

/** @description whether the guest sleeps at the day's destination */
export const isStay = entryType => entryType === 'Stay' || entryType === 'TransitStay'

export const ENTRY_TYPES = [
    { label: 'Stay', value: 'Stay', hint: 'A day in a place, with a night there' },
    { label: 'Transit', value: 'Transit', hint: 'Travelling, no hotel that night' },
    { label: 'Transit + Stay', value: 'TransitStay', hint: 'Travel to a place and stay the night' },
    { label: 'Fresh Up', value: 'FreshUp', hint: 'A short halt to freshen up' }
]

export const entryTypeLabel = value => ENTRY_TYPES.find(type => type.value === value)?.label || 'Stay'

/** @description a day's title: its own, else its itinerary's */
export const dayTitle = day => day?.title || day?.itenary?.title || 'Untitled day'

/**
 * @description the nights in each place, in trip order: "Shimla 2N → Manali 3N". Consecutive stays at one place
 *              join; a day with no stay breaks the run.
 * @returns {{ destination: string, nights: number, from: number }[]} `from` is the day number the stay starts on
 */
export const staysOf = days => {
    const stays = []
    let current = null
    ;(days || []).forEach((day, index) => {
        const name = day?.destination?.name || ''
        if (!isStay(day?.entryType || 'Stay') || !name) {
            current = null
            return
        }
        if (current && current.destination === name) {
            current.nights += 1
            return
        }
        current = { destination: name, nights: 1, from: index + 1 }
        stays.push(current)
    })
    return stays
}

export const nightsOf = days => staysOf(days).reduce((sum, stay) => sum + stay.nights, 0)

/** @description the list with the item at `from` moved to `to` (a new array; a bad index changes nothing) */
export const moveItem = (list, from, to) => {
    if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list
    const next = [...list]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    return next
}

/**
 * @description where a new day can go: the start, after any day, or the end. The value is the position the server
 *              takes (0 = first day)
 * @returns {{ value: number, label: string }[]}
 */
export const positionChoices = days => {
    const list = days || []
    if (list.length === 0) return [{ value: 0, label: 'As Day 1' }]
    return [
        { value: 0, label: 'At the start, before Day 1' },
        ...list.slice(0, -1).map((day, index) => ({
            value: index + 1,
            label: `After Day ${index + 1}: ${dayTitle(day)}`
        })),
        { value: list.length, label: `At the end, as Day ${list.length + 1}` }
    ]
}
