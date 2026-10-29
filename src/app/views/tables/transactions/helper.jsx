export const ledgerHeaders = [
    { key: 'createdAt', label: 'Date', visible: true, isDate: true },
    { key: 'guestName', label: 'Guest', visible: true },
    { key: 'type', label: 'Service', visible: true },
    { key: 'supplierName', label: 'Supplier', visible: true },
    { key: 'cost', label: 'Total Cost', visible: true },
    { key: 'paidAmount', label: 'Paid', visible: true },
    { key: 'balance', label: 'Balance', visible: true },
    { key: 'paymentStatus', label: 'Status', visible: true }
]
export default ledgerHeaders

/** @description the ledger's cells in an Excel file: a date as a date, the money as numbers, the rest as written */
const money = value => {
    const number = Number(value)
    return Number.isFinite(number) ? number : 0
}
export const ledgerExcelColumns = columns =>
    columns.map(column => {
        if (column.key === 'createdAt')
            return { ...column, excel: row => (row.createdAt ? new Date(row.createdAt) : '') }
        if (['cost', 'paidAmount', 'balance'].includes(column.key))
            return { ...column, excel: row => money(row[column.key]) }
        return column
    })
