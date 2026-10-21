/**
 * THE SAME DAY, WORDED DIFFERENTLY
 *
 * Planning the same package from another starting city makes the planner word the same day another way: "Arrival in
 * Manali" one time, "Arrival in Manali & Evening Rest" the next. Saved as new, each wording becomes an itinerary of its
 * own and the trip's list fills with near-copies. Before a title is saved as a new itinerary, this looks for a saved one
 * that is the same day.
 *
 * Careful in both directions — a wrong match merges two different days, a missed one leaves a near-copy:
 *   - the same words plus a few more ("Arrival in Manali" / "Arrival in Manali & Evening Rest") is the same day, when the
 *     shorter title has at least two words that matter;
 *   - almost the same words (80% overlap) is the same day;
 *   - a route ("Manali to Delhi") is only ever the same as the exact same route: Manali to Dharamshala and
 *     Dharamshala to Manali are different days;
 *   - titles with different numbers ("Day 1" / "Day 2") are different days;
 *   - two sightseeing days that happen to share one place ("Old Manali & Vashisht" / "Hadimba Temple, Vashisht Village &
 *     Mall Road") are different days.
 */
import nameKey from './nameKey'

// ? words that carry no place or activity
const FILLER = new Set([
    'a',
    'an',
    'and',
    'at',
    'by',
    'for',
    'from',
    'in',
    'of',
    'on',
    'the',
    'to',
    'with',
    'day',
    'night'
])

const wordsOf = title =>
    nameKey(title)
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .split(' ')
        .filter(word => (word.length > 1 || /\d/.test(word)) && !FILLER.has(word))

const isRoute = title => /(^|\s)to(\s|$)/i.test(nameKey(title))

/**
 * @description whether two day titles are the same day
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export const sameDay = (a, b) => {
    const keyA = nameKey(a)
    const keyB = nameKey(b)
    if (!keyA || !keyB) return false
    if (keyA === keyB) return true
    // ? a route only equals the same route, however it is worded around it
    if (isRoute(a) || isRoute(b)) return false

    const first = new Set(wordsOf(a))
    const second = new Set(wordsOf(b))
    if (!first.size || !second.size) return false
    // ? a number tells days apart ("Day 1" and "Day 2"): titles with different numbers are different days
    const numbers = set =>
        [...set]
            .filter(word => /\d/.test(word))
            .sort()
            .join(',')
    if (numbers(first) !== numbers(second)) return false
    const shared = [...first].filter(word => second.has(word)).length
    const smaller = Math.min(first.size, second.size)
    if (shared === smaller && smaller >= 2) return true
    return shared / (first.size + second.size - shared) >= 0.8
}

/**
 * @description the saved itinerary that is the same day as `title`, or null. An exact (same name) match is the caller's
 *              business; this is for what the exact check misses.
 * @param {string} title
 * @param {{ title?: string }[]} saved
 */
export const findSimilarTitle = (title, saved) => (saved || []).find(item => sameDay(title, item?.title)) || null
