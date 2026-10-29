/**
 * EXCEL DOWNLOADS — a list as a real .xlsx file rather than a CSV. A CSV opened in Excel turns a 12-digit transaction ID into
 * 4.12346E+11 and shows ₹ and dates as text; here an ID stays text, an amount is a number that adds up, and a date is a date that
 * sorts. The cells are worked out by `sheetOfShown` (pure), the file written by `downloadExcel` (the xlsx library is loaded only
 * when someone downloads, so no screen carries it).
 *
 * A column says what goes in its cells with `excel(row)` — a number, a text, or a Date (a day, read as UTC like the screens
 * do) — else `csv(row)`, else the value under its key.
 */
import { shownColumns } from './screenFacts'

// ? days from Excel's day 0 (30 Dec 1899) to 1 Jan 1970
const EXCEL_EPOCH = 25569
const DAY_MS = 86400000
const DATE_FORMAT = 'dd-mmm-yyyy'
const MAX_WIDTH = 42
// ? a sheet name has at most 31 characters and none of  \ / ? * [ ] :
const sheetName = name =>
    String(name)
        .replace(/[\\/?*[\]:]/g, ' ')
        .trim()
        .slice(0, 31) || 'Sheet1'

/** @description the cell a value becomes: a Date is the day as an Excel date; a number stays a number; anything else is text */
export const cellOf = value => {
    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) return ''
        return { t: 'n', v: Math.floor(value.getTime() / DAY_MS) + EXCEL_EPOCH, z: DATE_FORMAT }
    }
    if (typeof value === 'number') return Number.isFinite(value) ? value : ''
    if (value === undefined || value === null) return ''
    return String(value)
}

const valueOf = (column, row) => {
    if (column.excel) return column.excel(row)
    if (column.csv) return column.csv(row)
    return row?.[column.key]
}

/**
 * @description the rows as the cells of a sheet: a heading row, then a row for each, in the columns that are shown (never the
 *              actions column)
 * @returns {Array<Array<string | number | object>>}
 */
export const sheetOfShown = (rows, columns) => {
    const shown = shownColumns(columns).filter(column => column.key && !column.isFrontend && column.key !== 'action')
    return [
        shown.map(column => String(column.label ?? column.key)),
        ...rows.map(row => shown.map(column => cellOf(valueOf(column, row))))
    ]
}

const widthOf = (data, index) => {
    const longest = data.reduce((most, row) => {
        const cell = row[index]
        const text = cell && typeof cell === 'object' ? DATE_FORMAT : String(cell ?? '')
        return Math.max(most, text.length)
    }, 0)
    return Math.min(MAX_WIDTH, Math.max(10, longest + 2))
}

/**
 * @description saves sheets as an .xlsx file: each `{ name, data }` with `data` from `sheetOfShown`
 * @param {{ name: string, data: Array<Array<unknown>> }[]} sheets
 * @param {string} filename with or without .xlsx
 */
export const downloadExcel = async (sheets, filename) => {
    const XLSX = await import('xlsx')
    const workbook = XLSX.utils.book_new()
    sheets.forEach(({ name, data }) => {
        const sheet = XLSX.utils.aoa_to_sheet(data)
        sheet['!cols'] = (data[0] || []).map((heading, index) => ({ wch: widthOf(data, index) }))
        if (data.length > 1 && data[0]?.length) {
            sheet['!autofilter'] = {
                ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: data.length - 1, c: data[0].length - 1 } })
            }
        }
        XLSX.utils.book_append_sheet(workbook, sheet, sheetName(name))
    })
    XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`)
}

/** @description today as yyyy-mm-dd where the person is, for a file's name */
export const fileDay = (now = new Date()) =>
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
