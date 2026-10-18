/**
 * USER FORM RULES — what must be filled in before a user can be saved. Pure function, no React.
 */
import { phoneProblem } from '@/utilities/phone'

const MIN_PASSWORD = 6
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * @description the form's problems, by field ({} when it is fine). A new user needs a password; when editing, a password
 *              is only checked if one is typed (blank keeps the current one)
 * @param {{ firstName: string, phone: string, email: string, roleId: string, password: string, confirmPassword: string }} values
 * @param {{ editing?: boolean }} options
 */
export const userFormProblems = (values, { editing = false } = {}) => {
    const problems = {}
    if (!values.firstName.trim()) problems.firstName = 'Name is required'

    const phone = phoneProblem(values.phone)
    if (phone) problems.phone = phone

    const email = values.email.trim()
    if (!email) problems.email = 'Email is required'
    else if (!EMAIL.test(email)) problems.email = 'Enter a valid email, like name@company.com'

    if (!values.roleId) problems.roleId = 'Choose a role'

    const typed = Boolean(values.password || values.confirmPassword)
    if (!editing || typed) {
        if (!values.password) problems.password = 'Password is required'
        else if (values.password.length < MIN_PASSWORD) problems.password = `At least ${MIN_PASSWORD} characters`
        if (!values.confirmPassword) problems.confirmPassword = 'Type the password again'
        else if (values.password && values.password !== values.confirmPassword) {
            problems.confirmPassword = 'The two passwords don’t match'
        }
    }
    return problems
}
