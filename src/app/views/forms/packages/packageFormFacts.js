/**
 * PACKAGE FORM RULES — a package needs a name and the trip (campaign) it belongs to. Pure function, no React.
 */
const MIN_NAME = 3

/**
 * @param {{ name: string, campaignId: string }} values
 * @returns {Record<string, string>} the problems by field ({} when fine)
 */
const packageFormProblems = values => {
    const problems = {}
    const name = values.name.trim()
    if (!name) problems.name = 'Package name is required'
    else if (name.length < MIN_NAME) problems.name = `Use at least ${MIN_NAME} characters`
    if (!values.campaignId) problems.campaignId = 'Choose the trip this package belongs to'
    return problems
}

export default packageFormProblems
