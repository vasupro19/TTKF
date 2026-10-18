/**
 * SUPPLIER FORM RULES — what a hotel or transport supplier needs before it can be saved, and the exact fields the server
 * stores. Pure functions, no React.
 */

export const SUPPLIER_TYPES = ['Hotel', 'Taxi', 'Volvo', 'Other']

export const EMPTY_SUPPLIER = {
    businessname: '',
    type: '',
    constactperson: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    remarks: ''
}

const FIELDS = Object.keys(EMPTY_SUPPLIER)
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** @description a saved supplier as the form's text fields (a missing value is an empty box) */
export const supplierToForm = supplier =>
    Object.fromEntries(FIELDS.map(field => [field, supplier?.[field] ? String(supplier[field]) : '']))

/**
 * @description the form's problems, by field ({} when it is fine). The server needs a business name and a phone number;
 *              the type is what the Suppliers list filters on. The rest is optional, but an email must look like one.
 * @param {typeof EMPTY_SUPPLIER} values
 */
export const supplierProblems = values => {
    const problems = {}
    if (!values.businessname.trim()) problems.businessname = 'Business name is required'
    if (!values.type) problems.type = 'Choose what kind of supplier this is'

    const phone = values.phone.trim()
    const digits = phone.replace(/\D/g, '')
    if (!phone) problems.phone = 'Phone number is required'
    else if (digits.length < 7 || digits.length > 15) problems.phone = 'Enter a phone number with 7 to 15 digits'

    const email = values.email.trim()
    if (email && !EMAIL.test(email)) problems.email = 'Enter a valid email, like name@company.com'
    return problems
}

/** @description what is sent to the server: the supplier's own fields only, trimmed (the update saves whatever it is sent) */
export const supplierPayload = values =>
    Object.fromEntries(FIELDS.map(field => [field, String(values[field] ?? '').trim()]))
