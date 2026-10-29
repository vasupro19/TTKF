import { describe, expect, test } from 'vitest'
import { sheetOfShown } from '@/core/listing/excelFacts'
import { ledgerExcelColumns, ledgerHeaders } from './helper'

describe('what each supplier is owed, in Excel', () => {
    const row = {
        createdAt: '2026-10-20T08:30:00.000Z',
        guestName: 'Asha Verma',
        type: 'Hotel',
        supplierName: 'Hotel Snowline',
        cost: 20000,
        paidAmount: 5000.5,
        balance: '14999.50',
        paymentStatus: 'Partially Paid'
    }

    test('has the ledger’s columns, with the date a date and the money numbers that add up', () => {
        const [headings, cells] = sheetOfShown([row], ledgerExcelColumns(ledgerHeaders))
        expect(headings).toEqual(['Date', 'Guest', 'Service', 'Supplier', 'Total Cost', 'Paid', 'Balance', 'Status'])
        expect(cells[0]).toEqual({ t: 'n', v: 46315, z: 'dd-mmm-yyyy' })
        expect(cells.slice(1, 4)).toEqual(['Asha Verma', 'Hotel', 'Hotel Snowline'])
        expect(cells.slice(4, 7)).toEqual([20000, 5000.5, 14999.5])
        expect(cells[7]).toBe('Partially Paid')
    })

    test('a column the person hid is not in the file', () => {
        const columns = ledgerHeaders.map(column =>
            column.key === 'supplierName' ? { ...column, visible: false } : column
        )
        expect(sheetOfShown([row], ledgerExcelColumns(columns))[0]).not.toContain('Supplier')
    })

    test('a missing date or amount is an empty cell or zero, never NaN', () => {
        const [, cells] = sheetOfShown(
            [{ ...row, createdAt: null, cost: undefined, balance: 'x' }],
            ledgerExcelColumns(ledgerHeaders)
        )
        expect(cells[0]).toBe('')
        expect(cells[4]).toBe(0)
        expect(cells[6]).toBe(0)
    })
})
