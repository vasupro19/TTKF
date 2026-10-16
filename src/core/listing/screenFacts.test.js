import { describe, expect, it } from 'vitest'
import { TOGGLE_ALL } from '@/constants'
import { cleanDay, cleanId, cleanMonth, csvOfShown, oneOf, pickerColumns, toggleColumn } from './screenFacts'

describe('cleaning the address bar', () => {
    it('keeps only real days, months, ids and listed values', () => {
        expect(cleanDay('2026-10-05')).toBe('2026-10-05')
        expect(cleanDay('2026-02-31')).toBe('')
        expect(cleanDay('x')).toBe('')
        expect(cleanMonth('2026-10')).toBe('2026-10')
        expect(cleanMonth('2026-13')).toBe('')
        expect(cleanId('12')).toBe('12')
        expect(cleanId('-1')).toBe('')
        expect(cleanId('1;drop')).toBe('')
        expect(oneOf('UPI', ['UPI', 'Cash'])).toBe('UPI')
        expect(oneOf('Boat', ['UPI', 'Cash'])).toBe('')
    })
})

describe('columns and CSV', () => {
    const base = [
        { key: 'a', label: 'A' },
        { key: 'b', label: 'B', visible: false },
        { key: 'c', label: 'C', csv: row => row.a }
    ]
    it('hidden columns stay out of the CSV until picked', () => {
        const columns = pickerColumns(base)
        expect(csvOfShown([{ a: 'x', b: 'y' }], columns)).toBe('A,C\r\nx,x')
        const picked = toggleColumn(columns, 'b')
        expect(csvOfShown([{ a: 'x', b: 'y' }], picked)).toBe('A,B,C\r\nx,y,x')
        expect(toggleColumn(columns, TOGGLE_ALL).every(column => column.visible)).toBe(true)
    })
    it('a value that looks like a formula is not run by the spreadsheet', () => {
        expect(csvOfShown([{ a: '=SUM(A1)' }], pickerColumns([base[0]]))).toBe("A\r\n'=SUM(A1)")
        expect(csvOfShown([{ a: -5 }], pickerColumns([base[0]]))).toBe('A\r\n-5')
    })
})
