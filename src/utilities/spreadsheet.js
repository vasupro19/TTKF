/**
 * ============================================================================
 *  SPREADSHEET HELPERS (browser side)
 * ============================================================================
 *
 *  Bulk import no longer parses spreadsheets in the browser. The `xlsx`
 *  package that did it has an unpatched prototype-pollution advisory
 *  (SheetJS publishes fixes only to their own CDN, so `npm audit` reports "no
 *  fix available" for the npm build) — and it was reading files the user had
 *  just been handed by a third party. The API parses and validates the workbook
 *  now; see TTKB/utils/spreadsheet.js.
 *
 *  Removing it also took 415KB out of the main bundle.
 *
 *  Sample templates are generated as CSV using nothing but a Blob. Excel and
 *  Google Sheets both open CSV directly, and the import endpoint accepts either
 *  the canonical column names or the readable headings used here.
 * ============================================================================
 */

/**
 * @description escapes one CSV field
 * @param {*} value
 * @returns {string}
 */
function csvField(value) {
    const text = value === null || value === undefined ? '' : String(value)

    // Quote when the value contains a delimiter, a quote or a newline; double
    // any embedded quotes. Skipping this is how sample files end up with an
    // itinerary description spilling into the next column.
    if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`
    return text
}

/**
 * @description builds a CSV string from headers and rows
 * @param {readonly string[]} headers
 * @param {readonly object[]} rows keyed by header
 * @returns {string}
 */
export function toCsv(headers, rows) {
    const lines = [headers.map(csvField).join(',')]

    rows.forEach(row => {
        lines.push(headers.map(header => csvField(row[header])).join(','))
    })

    return lines.join('\r\n')
}

/**
 * @description triggers a browser download of a CSV template
 * @param {string} filename e.g. 'Campaign_Upload_Sample.csv'
 * @param {readonly string[]} headers
 * @param {readonly object[]} [sampleRows] one or two illustrative rows
 */
export function downloadCsvTemplate(filename, headers, sampleRows = []) {
    // The BOM makes Excel open UTF-8 correctly; without it, guest names and
    // destination names with non-ASCII characters render as mojibake.
    // \uFEFF is the UTF-8 BOM, written as an escape rather than a literal
    // so it is visible in review and does not trip no-irregular-whitespace.
    const csv = `\uFEFF${toCsv(headers, sampleRows)}`

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()

    // Release the object URL, or the blob stays in memory for the life of the
    // page — noticeable when a user downloads several templates in a session.
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

/**
 * @description validates a file the user picked before it is uploaded, so an
 *              obvious mistake is reported instantly rather than after a
 *              round-trip
 * @param {File} file
 * @param {{maxBytes?: number}} [options]
 * @returns {{ok: true} | {ok: false, message: string}}
 */
export function validateSpreadsheetFile(file, options = {}) {
    const { maxBytes = 10 * 1024 * 1024 } = options

    if (!file) return { ok: false, message: 'Please choose a file' }

    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
        return { ok: false, message: 'Please upload an .xlsx, .xls or .csv file' }
    }

    if (file.size > maxBytes) {
        return { ok: false, message: `That file is larger than ${Math.round(maxBytes / 1024 / 1024)}MB` }
    }

    return { ok: true }
}

export default { toCsv, downloadCsvTemplate, validateSpreadsheetFile }
