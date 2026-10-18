import { describe, expect, test } from 'vitest'
import { userFormProblems } from './userFormFacts'

const filled = {
    firstName: 'Riya Sharma',
    phone: '98765 43210',
    email: 'riya@example.com',
    roleId: '3',
    password: 'secret1',
    confirmPassword: 'secret1',
    emailPassword: ''
}

describe('user form rules', () => {
    test('a complete new user has no problems', () => {
        expect(userFormProblems(filled)).toEqual({})
    })

    test('name, phone, email, role and password are all needed for a new user', () => {
        expect(
            Object.keys(
                userFormProblems({
                    ...filled,
                    firstName: ' ',
                    phone: '',
                    email: '',
                    roleId: '',
                    password: '',
                    confirmPassword: ''
                })
            ).sort()
        ).toEqual(['confirmPassword', 'email', 'firstName', 'password', 'phone', 'roleId'])
    })

    test('the phone is read like a lead’s: 10 digits for India, or a full number with its country code', () => {
        expect(userFormProblems({ ...filled, phone: '12345' }).phone).toBeTruthy()
        expect(userFormProblems({ ...filled, phone: '+44 7911 123456' }).phone).toBeUndefined()
    })

    test('a bad email is explained', () => {
        expect(userFormProblems({ ...filled, email: 'riya@' }).email).toMatch(/valid email/)
    })

    test('passwords must be 6 characters and match', () => {
        expect(userFormProblems({ ...filled, password: 'abc', confirmPassword: 'abc' }).password).toMatch(/6/)
        expect(userFormProblems({ ...filled, confirmPassword: 'other' }).confirmPassword).toMatch(/match/)
    })

    test('when editing, a blank password keeps the current one; a typed one is checked', () => {
        const edit = { ...filled, password: '', confirmPassword: '' }
        expect(userFormProblems(edit, { editing: true })).toEqual({})
        expect(userFormProblems({ ...edit, password: 'abc' }, { editing: true }).password).toMatch(/6/)
        expect(userFormProblems({ ...edit, password: 'secret1' }, { editing: true }).confirmPassword).toBeTruthy()
    })
})
