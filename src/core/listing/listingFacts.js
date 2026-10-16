// ? the pure parts of the shared list page (ListPage.jsx): addresses, queries, empty states and CSV

/** @description the same query with these parameters set (an empty value removes it) */
export const withParams = (query, params = {}) => {
    const search = new URLSearchParams((query || '').replace(/^\?/, ''))
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') search.delete(key)
        else search.set(key, String(value))
    })
    const text = search.toString()
    return text ? `?${text}` : ''
}

/** @description the same query from the first row, `length` rows long (to export every matching row) */
export const withPaging = (query, start, length) => {
    const search = new URLSearchParams((query || '').replace(/^\?/, ''))
    search.set('start', String(start))
    search.set('length', String(length))
    search.delete('export')
    search.delete('ext')
    return `?${search.toString()}`
}

/** @description the chosen value of each filter in the address bar, '' for those not set or not on the list of options */
export const valuesFromSearch = (search, filters = []) => {
    const params = new URLSearchParams(search || '')
    return Object.fromEntries(
        filters.map(filter => {
            const value = params.get(filter.key) || ''
            const allowed = !filter.options || filter.options.some(option => String(option.value) === value)
            return [filter.key, allowed ? value : '']
        })
    )
}

/** @description the address bar after choosing filters: only those that are set are written */
export const searchWithValues = (search, values = {}) => {
    const params = new URLSearchParams(search || '')
    Object.entries(values).forEach(([key, value]) => {
        if (value) params.set(key, String(value))
        else params.delete(key)
    })
    const text = params.toString()
    return text ? `?${text}` : ''
}

/** @description 'first' (nothing here yet), 'filtered' (the filters match nothing) or null (show the table) */
export const emptyKindOf = ({ loaded, loading, count, hasFilters }) => {
    if (!loaded || loading || count > 0) return null
    return hasFilters ? 'filtered' : 'first'
}

const csvCell = value => {
    const text = value === undefined || value === null ? '' : String(value)
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/**
 * @description the rows as CSV, one column per table column that shows data (not the serial number or the actions).
 *              A column's `csv: row => text` decides what is written; else the value under its key.
 */
export const csvOf = (rows, columns) => {
    const shown = columns.filter(column => column.key && !column.isFrontend && column.key !== 'action')
    const lines = [shown.map(column => csvCell(column.label)).join(',')]
    rows.forEach(row => {
        lines.push(shown.map(column => csvCell(column.csv ? column.csv(row) : row?.[column.key])).join(','))
    })
    return lines.join('\r\n')
}

/** @description saves text as a CSV file the way Excel opens it (UTF-8 with a byte-order mark) */
export const downloadCsv = (text, name) => {
    const blob = new Blob([`\uFEFF${text}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = name.endsWith('.csv') ? name : `${name}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}
