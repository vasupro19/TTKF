import { describe, expect, it } from 'vitest'
import { csvOf, emptyKindOf, searchWithValues, valuesFromSearch, withPaging, withParams } from './listingFacts'

describe('withParams', () => {
    it('adds parameters to a query, replacing the same name, and drops the empty ones', () => {
        expect(withParams('?start=0&length=10', { type: 'Hotel' })).toBe('?start=0&length=10&type=Hotel')
        expect(withParams('?type=Taxi', { type: 'Hotel' })).toBe('?type=Hotel')
        expect(withParams('?type=Taxi&start=0', { type: '' })).toBe('?start=0')
        expect(withParams('', {})).toBe('')
        expect(withParams(undefined, { a: 1 })).toBe('?a=1')
    })
})

describe('withPaging', () => {
    it('asks for the same rows from the first one, as many as wanted, and not as an export', () => {
        const query = withPaging('?start=20&length=10&search%5Bvalue%5D=goa&export=true&ext=csv', 0, 55)
        const params = new URLSearchParams(query)
        expect(params.get('start')).toBe('0')
        expect(params.get('length')).toBe('55')
        expect(params.get('search[value]')).toBe('goa')
        expect(params.has('export')).toBe(false)
    })
})

describe('filters in the address bar', () => {
    const filters = [{ key: 'type', options: [{ value: 'Hotel' }, { value: 'Taxi' }] }, { key: 'assignedTo' }]
    it('reads the chosen values, ignoring a value that is not one of the options', () => {
        expect(valuesFromSearch('?type=Taxi&assignedTo=4', filters)).toEqual({ type: 'Taxi', assignedTo: '4' })
        expect(valuesFromSearch('?type=Boat', filters)).toEqual({ type: '', assignedTo: '' })
        expect(valuesFromSearch('', filters)).toEqual({ type: '', assignedTo: '' })
    })
    it('writes only what is set and keeps the rest of the address', () => {
        expect(searchWithValues('?tab=guest&type=Hotel', { type: 'Taxi', assignedTo: '' })).toBe('?tab=guest&type=Taxi')
        expect(searchWithValues('?type=Hotel', { type: '' })).toBe('')
    })
})

describe('emptyKindOf', () => {
    it('is nothing until the first answer, while loading, or when there are rows', () => {
        expect(emptyKindOf({ loaded: false, loading: false, count: 0, hasFilters: false })).toBeNull()
        expect(emptyKindOf({ loaded: true, loading: true, count: 0, hasFilters: false })).toBeNull()
        expect(emptyKindOf({ loaded: true, loading: false, count: 3, hasFilters: true })).toBeNull()
    })
    it('tells "nothing yet" from "nothing matches"', () => {
        expect(emptyKindOf({ loaded: true, loading: false, count: 0, hasFilters: false })).toBe('first')
        expect(emptyKindOf({ loaded: true, loading: false, count: 0, hasFilters: true })).toBe('filtered')
    })
})

describe('csvOf', () => {
    const columns = [
        { key: 's_no', label: 'Sr. No.', isFrontend: true },
        { key: 'name', label: 'Name' },
        { key: 'note', label: 'Note' },
        { key: 'city', label: 'City', csv: row => row.city.toUpperCase() },
        { key: 'action', label: 'Action' }
    ]
    it('writes a header and a line per row, for the columns that show data', () => {
        const text = csvOf([{ name: 'Snow Valley', note: 'says "hi", twice', city: 'Manali' }], columns)
        expect(text.split('\r\n')).toEqual(['Name,Note,City', 'Snow Valley,"says ""hi"", twice",MANALI'])
    })
    it('leaves missing values empty', () => {
        expect(csvOf([{ city: 'x' }], columns).split('\r\n')[1]).toBe(',,X')
    })
})
