import { beforeEach, describe, expect, test, vi } from 'vitest'
import * as XLSX from 'xlsx'
import { cellOf, downloadExcel, fileDay, sheetOfShown } from './excelFacts'

// ? what would have been saved: the workbook handed to writeFile, so the cells can be read back
const saved = vi.hoisted(() => ({ workbook: null, name: '' }))
vi.mock('xlsx', async importOriginal => {
    const actual = await importOriginal()
    return {
        ...actual,
        writeFile: (workbook, name) => {
            saved.workbook = workbook
            saved.name = name
        }
    }
})

beforeEach(() => {
    saved.workbook = null
    saved.name = ''
})

describe('cellOf', () => {
    test('a number stays a number, text stays text — even digits, so a 12-digit transaction ID is not turned into 4.12346E+11', () => {
        expect(cellOf(1500.5)).toBe(1500.5)
        expect(cellOf('412345678901')).toBe('412345678901')
        expect(cellOf('Hotel Snowline')).toBe('Hotel Snowline')
        expect(cellOf(0)).toBe(0)
    })

    test('nothing is an empty cell', () => {
        expect(cellOf(null)).toBe('')
        expect(cellOf(undefined)).toBe('')
        expect(cellOf(Number.NaN)).toBe('')
        expect(cellOf(new Date('nonsense'))).toBe('')
    })

    test('a day becomes an Excel date, counted in UTC so the day does not move with the time zone', () => {
        expect(cellOf(new Date('1970-01-01T00:00:00.000Z'))).toEqual({ t: 'n', v: 25569, z: 'dd-mmm-yyyy' })
        expect(cellOf(new Date('2000-01-01T00:00:00.000Z')).v).toBe(36526)
        expect(cellOf(new Date('2026-10-25T00:00:00.000Z')).v).toBe(46320)
        // ? the same day whatever the time of day stored with it
        expect(cellOf(new Date('2026-10-25T18:29:00.000Z')).v).toBe(46320)
    })
})

describe('sheetOfShown', () => {
    const columns = [
        { key: 'date', label: 'Date', excel: row => new Date(row.paymentDate), csv: () => 'text date' },
        { key: 'guest', label: 'Guest', csv: row => row.guestName },
        { key: 'amount', label: 'Amount', csv: row => Number(row.amount) },
        { key: 'transactionId', label: 'Transaction ID' },
        { key: 'secret', label: 'Hidden one', visible: false },
        { key: 'action', label: 'Actions', render: () => null }
    ]
    const rows = [
        {
            paymentDate: '2026-10-25T00:00:00.000Z',
            guestName: 'Asha Verma',
            amount: '12000.50',
            transactionId: '412345678901',
            secret: 'x'
        }
    ]

    test('has the headings, then a row for each, in the columns that are shown — never the actions column', () => {
        const data = sheetOfShown(rows, columns)
        expect(data[0]).toEqual(['Date', 'Guest', 'Amount', 'Transaction ID'])
        expect(data).toHaveLength(2)
    })

    test('a column’s excel value wins over its csv text, which wins over the value under its key', () => {
        const [, row] = sheetOfShown(rows, columns)
        expect(row[0]).toEqual({ t: 'n', v: 46320, z: 'dd-mmm-yyyy' })
        expect(row[1]).toBe('Asha Verma')
        expect(row[2]).toBe(12000.5)
        expect(row[3]).toBe('412345678901')
    })

    test('no rows is the headings alone', () => {
        expect(sheetOfShown([], columns)).toEqual([['Date', 'Guest', 'Amount', 'Transaction ID']])
    })
})

describe('downloadExcel', () => {
    const data = [
        ['Date', 'Guest', 'Amount', 'Transaction ID'],
        [{ t: 'n', v: 46320, z: 'dd-mmm-yyyy' }, 'Asha Verma', 12000.5, '412345678901'],
        ['', 'Rohan Das', 800, 'AXISP00123456789']
    ]

    test('writes a file named .xlsx with the sheet, its widths and a filter on the headings', async () => {
        await downloadExcel([{ name: 'Guest payments', data }], 'Guest payments - 2026-10-26')
        expect(saved.name).toBe('Guest payments - 2026-10-26.xlsx')
        expect(saved.workbook.SheetNames).toEqual(['Guest payments'])
        const sheet = saved.workbook.Sheets['Guest payments']
        expect(sheet['!autofilter'].ref).toBe('A1:D3')
        expect(sheet['!cols']).toHaveLength(4)
        expect(sheet['!cols'][1].wch).toBeGreaterThanOrEqual(10)
    })

    test('the cells keep their kinds when the file is read back: the ID is text, the amount a number, the date a date', async () => {
        await downloadExcel([{ name: 'Guest payments', data }], 'x')
        const bytes = XLSX.write(saved.workbook, { type: 'array', bookType: 'xlsx' })
        const read = XLSX.read(bytes, { type: 'array' })
        const sheet = read.Sheets['Guest payments']
        expect(sheet.D2.t).toBe('s')
        expect(sheet.D2.v).toBe('412345678901')
        expect(sheet.C2.t).toBe('n')
        expect(sheet.C2.v).toBe(12000.5)
        // ? a date cell: the day's number, shown as 25-Oct-2026 and sorted as a date
        expect(sheet.A2.v).toBe(46320)
        expect(sheet.A2.w).toBe('25-Oct-2026')
        expect(sheet.B3.v).toBe('Rohan Das')
    })

    test('a sheet’s name is made safe for Excel: no \\ / ? * [ ] :, at most 31 characters', async () => {
        await downloadExcel([{ name: 'Guest/payments: what [was] paid? * all of it in October 2026', data }], 'x')
        const [name] = saved.workbook.SheetNames
        expect(name).not.toMatch(/[\\/?*[\]:]/)
        expect(name.length).toBeLessThanOrEqual(31)
    })

    test('a name that is already .xlsx is not given a second ending, and several sheets are written', async () => {
        await downloadExcel(
            [
                { name: 'One', data },
                { name: 'Two', data }
            ],
            'report.xlsx'
        )
        expect(saved.name).toBe('report.xlsx')
        expect(saved.workbook.SheetNames).toEqual(['One', 'Two'])
    })

    test('headings alone are written without a filter', async () => {
        await downloadExcel([{ name: 'Empty', data: [data[0]] }], 'x')
        expect(saved.workbook.Sheets.Empty['!autofilter']).toBeUndefined()
    })
})

describe('fileDay', () => {
    test('is the day where the person is', () => {
        expect(fileDay(new Date(2026, 9, 5))).toBe('2026-10-05')
    })
})
