import * as XLSX from 'xlsx'
import { toCsv } from './paymentFacts'

export const EMPTY_FILTERS = Object.freeze({ from: '', to: '', method: '', type: '', q: '' })

/** @description saves spreadsheet rows as an Excel workbook or a CSV file */
export const saveRows = (rows, name, format = 'xlsx') => {
    const stamp = new Date().toISOString().slice(0, 10)
    if (format === 'csv') {
        // ? with a BOM, so Excel reads ₹ and names correctly
        const blob = new Blob([`\uFEFF${toCsv(rows)}`], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = `${name} ${stamp}.csv`
        document.body.appendChild(anchor)
        anchor.click()
        document.body.removeChild(anchor)
        URL.revokeObjectURL(url)
        return
    }
    const sheet = XLSX.utils.json_to_sheet(rows)
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, name.slice(0, 31))
    XLSX.writeFile(book, `${name} ${stamp}.xlsx`)
}
