import { describe, expect, test } from 'vitest'
import { fieldOf, reportOf, suppliersFromSheet, suppliersWord, templateSheets } from './supplierImportFacts'

describe('the headings an agency writes', () => {
    test.each([
        ['Business name', 'businessname'],
        ['  BUSINESS  NAME ', 'businessname'],
        ['business_name', 'businessname'],
        ['Hotel Name', 'businessname'],
        ['Supplier', 'businessname'],
        ['Type', 'type'],
        ['Category', 'type'],
        ['Contact person', 'constactperson'],
        ['Phone', 'phone'],
        ['Mobile No', 'phone'],
        ['Email ID', 'email'],
        ['City', 'city'],
        ['Place', 'city'],
        ['Notes', 'remarks'],
        ['Remarks', 'remarks']
    ])('%s fills %s', (heading, field) => expect(fieldOf(heading)).toBe(field))

    test('a heading that means nothing here fills nothing', () => {
        expect(fieldOf('Bank account')).toBe('')
        expect(fieldOf('')).toBe('')
    })
})

describe('suppliersFromSheet', () => {
    test('gives each row the number it has in the sheet (the headings are row 1), and skips empty rows', () => {
        const { rows } = suppliersFromSheet([
            { 'Business name': 'Hotel Snowline', Type: 'Hotel', Phone: 9876543210 },
            { 'Business name': '', Type: '', Phone: '' },
            { 'Business name': 'Himalayan Cabs', Type: 'Taxi', Phone: '9812345678' }
        ])
        expect(rows.map(row => row.row)).toEqual([2, 4])
        expect(rows[0]).toMatchObject({ businessname: 'Hotel Snowline', type: 'Hotel', phone: 9876543210 })
    })

    test('understands the headings of the agency’s own sheet', () => {
        const { rows, missing } = suppliersFromSheet([
            { 'Hotel Name': 'Rivera', Category: 'hotel', 'Mobile No': '98123 45678', Place: 'Kasol', Remarks: 'good' }
        ])
        expect(missing).toEqual([])
        expect(rows[0]).toMatchObject({
            businessname: 'Rivera',
            type: 'hotel',
            phone: '98123 45678',
            city: 'Kasol',
            remarks: 'good'
        })
    })

    test('the first column that fills a field wins', () => {
        const { rows } = suppliersFromSheet([
            { Name: 'First', 'Hotel name': 'Second', Type: 'Hotel', Phone: '9876543210' }
        ])
        expect(rows[0].businessname).toBe('First')
    })

    test('says which required columns are missing, and which headings were not used', () => {
        const { missing, ignored } = suppliersFromSheet([{ 'Business name': 'X', 'Bank account': '123' }])
        expect(missing).toEqual(['Type', 'Phone'])
        expect(ignored).toEqual(['Bank account'])
    })

    test('a sheet with headings and no rows is not a wrong sheet: the columns are there', () => {
        const { rows, missing } = suppliersFromSheet([], ['Business name', 'Type', 'Phone'])
        expect(rows).toEqual([])
        expect(missing).toEqual([])
    })

    test('a sheet with nothing at all lacks every required column', () => {
        expect(suppliersFromSheet([]).missing).toEqual(['Business name', 'Type', 'Phone'])
    })
})

describe('the template', () => {
    test('is what the importer reads: its example rows come back as suppliers', () => {
        const [headings, ...examples] = templateSheets().Suppliers
        const sheetRows = examples.map(values =>
            Object.fromEntries(headings.map((heading, index) => [heading, values[index]]))
        )
        const { rows, missing, ignored } = suppliersFromSheet(sheetRows)
        expect(missing).toEqual([])
        expect(ignored).toEqual([])
        expect(rows).toHaveLength(2)
        expect(rows[0]).toMatchObject({ businessname: 'Hotel Snowline', type: 'Hotel', city: 'Manali' })
        expect(rows[1]).toMatchObject({ businessname: 'Himalayan Cabs', type: 'Taxi', city: 'Shimla' })
    })

    test('says how to fill it, with the allowed types', () => {
        const lines = templateSheets()['How to fill'].flat().join(' ')
        expect(lines).toMatch(/Hotel, Taxi, Volvo or Other/)
        expect(lines).toMatch(/Phone/)
    })
})

describe('reportOf', () => {
    test('counts what an import said', () => {
        expect(
            reportOf({ added: 3, skipped: [{ row: 5, reason: 'x' }], problems: [{ row: 6, message: 'y' }] })
        ).toEqual({
            added: 3,
            skipped: [{ row: 5, reason: 'x' }],
            problems: [{ row: 6, message: 'y' }],
            nothing: false
        })
        expect(reportOf({ added: 0 }).nothing).toBe(true)
        expect(reportOf(undefined).nothing).toBe(true)
    })

    test('suppliersWord is singular for one', () => {
        expect(suppliersWord(1)).toBe('1 supplier')
        expect(suppliersWord(0)).toBe('0 suppliers')
        expect(suppliersWord(12)).toBe('12 suppliers')
    })
})
