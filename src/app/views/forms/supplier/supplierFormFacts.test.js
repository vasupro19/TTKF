import { describe, expect, test } from 'vitest'
import { EMPTY_SUPPLIER, SUPPLIER_TYPES, supplierPayload, supplierProblems, supplierToForm } from './supplierFormFacts'

const filled = {
    ...EMPTY_SUPPLIER,
    businessname: 'Hotel Snow Valley',
    type: 'Hotel',
    phone: '98160 00001'
}

describe('supplier form rules', () => {
    test('a business name, a type and a phone number are enough', () => {
        expect(supplierProblems(filled)).toEqual({})
    })

    test('an empty form asks for the three required things', () => {
        expect(Object.keys(supplierProblems(EMPTY_SUPPLIER)).sort()).toEqual(['businessname', 'phone', 'type'])
    })

    test('a phone is any number of 7 to 15 digits, with spaces, dashes or a plus', () => {
        expect(supplierProblems({ ...filled, phone: '+62 811 2345 678' }).phone).toBeUndefined()
        expect(supplierProblems({ ...filled, phone: '12345' }).phone).toMatch(/7 to 15/)
        expect(supplierProblems({ ...filled, phone: '1'.repeat(16) }).phone).toMatch(/7 to 15/)
    })

    test('the email is optional, but must look like one', () => {
        expect(supplierProblems({ ...filled, email: '' }).email).toBeUndefined()
        expect(supplierProblems({ ...filled, email: 'rakesh@' }).email).toMatch(/valid email/)
        expect(supplierProblems({ ...filled, email: 'rakesh@snowvalley.in' }).email).toBeUndefined()
    })

    test('the types are the ones the list filters on', () => {
        expect(SUPPLIER_TYPES).toEqual(['Hotel', 'Taxi', 'Volvo', 'Other'])
    })

    test('a saved supplier loads into the boxes, leaving out what the form does not edit', () => {
        const form = supplierToForm({
            id: 4,
            businessname: 'Konkan Travels',
            phone: 9822000005,
            remarks: null,
            createdAt: 'x'
        })
        expect(form.businessname).toBe('Konkan Travels')
        expect(form.phone).toBe('9822000005')
        expect(form.remarks).toBe('')
        expect(form).not.toHaveProperty('createdAt')
        expect(form).not.toHaveProperty('id')
    })

    test('only the supplier’s own fields are sent, trimmed', () => {
        const payload = supplierPayload({ ...filled, businessname: '  Hotel Snow Valley ', title: 'x', createdAt: 'y' })
        expect(Object.keys(payload).sort()).toEqual(Object.keys(EMPTY_SUPPLIER).sort())
        expect(payload.businessname).toBe('Hotel Snow Valley')
    })
})
