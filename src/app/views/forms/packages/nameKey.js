/**
 * The key two names are compared by: capitals, spacing and the kind of dash do not matter ("Day 1 - Arrival" and
 * "day 1 \u2013 arrival" are one itinerary). The server uses the same rule (Helpers/catalogName.helper.js) when it is asked to
 * create a destination or an itinerary, so what the wizard thinks already exists is what the server thinks too.
 */
const nameKey = text =>
    String(text ?? '')
        .normalize('NFKC')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .toLowerCase()
        .replace(/[\u2010-\u2015\u2212]/g, '-')
        .replace(/\s*-\s*/g, '-')
        .replace(/\s+/g, ' ')
        .trim()

export default nameKey
