import { describe, expect, test } from 'vitest'
import { fieldPhoneProblem, leadPhoneToSave, phoneForField, phoneProblem, userPhoneToSave } from './phone'

// ? one spelling of a number, to compare a stored one with its round trip
const readable = value => leadPhoneToSave(value)

describe('a lead’s phone', () => {
    test.each([
        ['9876543210', '+919876543210'],
        ['98765 43210', '+919876543210'],
        ['+91-98765-43210', '+919876543210'],
        ['098765 43210', '+919876543210'],
        ['919876543210', '+919876543210'],
        ['+91 98765 43210', '+919876543210'],
        ['+44 7911 123456', '+447911123456'],
        ['0044 7911 123456', '+447911123456']
    ])('%s is saved as %s', (typed, saved) => {
        expect(phoneProblem(typed)).toBe('')
        expect(leadPhoneToSave(typed)).toBe(saved)
    })

    test('what isn’t a phone number says so', () => {
        expect(phoneProblem('')).toBe('Phone number is required')
        expect(phoneProblem('98765')).toMatch(/10-digit/)
        expect(phoneProblem('abcdefghij')).toMatch(/10-digit/)
        expect(phoneProblem('1234567890')).toBe('Enter a 10-digit mobile number')
        expect(phoneProblem('', { required: false })).toBe('')
    })
})

describe('a user’s phone', () => {
    test('a saved number loads into the field however it was saved — never "9191…"', () => {
        expect(phoneForField('9876543210')).toBe('919876543210')
        expect(phoneForField('+919876543210')).toBe('919876543210')
        expect(phoneForField('919876543210')).toBe('919876543210')
        expect(phoneForField('+91 98765 43210')).toBe('919876543210')
        expect(phoneForField('+447911123456')).toBe('447911123456')
        expect(phoneForField(null)).toBe('')
    })

    test('the field is checked and saved: 10 digits for India, the full number for another country', () => {
        expect(fieldPhoneProblem('919876543210')).toBe('')
        expect(userPhoneToSave('919876543210')).toBe('9876543210')
        expect(fieldPhoneProblem('447911123456')).toBe('')
        expect(userPhoneToSave('447911123456')).toBe('+447911123456')
        expect(fieldPhoneProblem('91')).toBe('Phone number is required')
        expect(fieldPhoneProblem('9198765')).toBe('Enter a 10-digit mobile number')
    })

    test('a load and save round trip keeps the number', () => {
        ;['9876543210', '+919876543210', '+447911123456'].forEach(stored => {
            const saved = userPhoneToSave(phoneForField(stored))
            expect(readable(saved)).toBe(readable(stored))
        })
    })
})
