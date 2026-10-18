/**
 * ITINERARY FORM RULES — an itinerary (one day of a trip) needs a title and the trip it belongs to; the description
 * is optional but, when written, must say something. Pure function, no React.
 */
const MIN_TITLE = 5
const MIN_DESCRIPTION = 10

/**
 * @param {{ title: string, description: string, campaignId: string }} values
 * @returns {Record<string, string>} the problems by field ({} when fine)
 */
const itenaryFormProblems = values => {
    const problems = {}
    const title = values.title.trim()
    if (!title) problems.title = 'Title is required'
    else if (title.length < MIN_TITLE) problems.title = `Use at least ${MIN_TITLE} characters`

    const description = values.description.trim()
    if (description && description.length < MIN_DESCRIPTION) {
        problems.description = `Say a little more, at least ${MIN_DESCRIPTION} characters, or leave it empty`
    }
    if (!values.campaignId) problems.campaignId = 'Choose the trip this day belongs to'
    return problems
}

export default itenaryFormProblems
