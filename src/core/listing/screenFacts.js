// ? the pure parts of the screens that are not DataTable lists but look like the Leads table (Transactions, Invoices,
// ? the team's incentives): their columns, the picker, the CSV and the address bar's filters
import { TOGGLE_ALL } from '@/constants'
import { csvOf } from './listingFacts'

const DAY = /^\d{4}-\d{2}-\d{2}$/

/** @description a yyyy-mm-dd that is a real day, else '' */
export const cleanDay = value => {
    const text = String(value || '')
    if (!DAY.test(text)) return ''
    const date = new Date(`${text}T00:00:00.000Z`)
    return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text ? '' : text
}

/** @description a yyyy-mm that is a real month, else '' */
export const cleanMonth = value => (/^\d{4}-(0[1-9]|1[0-2])$/.test(String(value || '')) ? String(value) : '')

/** @description a positive whole number as text, else '' */
export const cleanId = value => (/^[1-9]\d{0,9}$/.test(String(value || '')) ? String(value) : '')

/** @description `value` when it is one of `allowed`, else '' */
export const oneOf = (value, allowed) => (allowed.includes(String(value || '')) ? String(value) : '')

/** @description the columns as the column picker wants them: all visible, with an id */
export const pickerColumns = columns => columns.map(column => ({ id: column.key, visible: true, ...column }))

/** @description the picker's choice applied: one column toggled, or "Select all" */
export const toggleColumn = (columns, key) =>
    columns.map(column => {
        if (key === TOGGLE_ALL) return { ...column, visible: true }
        return column.key === key ? { ...column, visible: !column.visible } : column
    })

export const shownColumns = columns => columns.filter(column => column.visible !== false)

// ? a value that starts like a formula is not run when the file is opened in a spreadsheet
const safeCell = value => {
    if (typeof value === 'number') return value
    const text = value === undefined || value === null ? '' : String(value)
    return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
}

/** @description the rows as CSV: the columns that are shown, what is on screen (`column.csv(row)` or the value under its key) */
export const csvOfShown = (rows, columns) =>
    csvOf(
        rows,
        shownColumns(columns).map(column => ({
            ...column,
            csv: row => safeCell(column.csv ? column.csv(row) : row?.[column.key])
        }))
    )

/** @description the filters of the address bar that have a value (the base for "is anything filtered?") */
export const anySet = values => Object.values(values || {}).some(Boolean)
