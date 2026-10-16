import { describe, expect, it } from 'vitest'
import { draftOf, formDataOf, initialsOf, isChanged, logoProblem, problemsOf } from './companyFacts'

const company = { name: 'Himalayan Trails', phoneNumber: '9876543210', address: 'Manali', website: null, insta: '' }

describe('initialsOf', () => {
    it('takes the first letters of the first two words', () => {
        expect(initialsOf('Himalayan Trails')).toBe('HT')
        expect(initialsOf('  travel   kart  india ')).toBe('TK')
        expect(initialsOf('Wanderlust')).toBe('WA')
        expect(initialsOf('')).toBe('T')
    })
})

describe('draft and changes', () => {
    it('starts from what is saved, with nothing as an empty string', () => {
        expect(draftOf(company)).toEqual({
            name: 'Himalayan Trails',
            phoneNumber: '9876543210',
            address: 'Manali',
            website: '',
            insta: ''
        })
    })
    it('sees an edit, a new logo and a removed logo, but not stray spaces', () => {
        const draft = draftOf(company)
        expect(isChanged(draft, company)).toBe(false)
        expect(isChanged({ ...draft, name: ' Himalayan Trails ' }, company)).toBe(false)
        expect(isChanged({ ...draft, website: 'ht.in' }, company)).toBe(true)
        expect(isChanged(draft, company, { logo: new Blob(['x']) })).toBe(true)
        expect(isChanged(draft, company, { removeLogo: true })).toBe(true)
    })
})

describe('problemsOf', () => {
    const ok = draftOf(company)
    it('accepts what is saved', () => expect(problemsOf(ok)).toEqual({}))
    it('wants a name, phone and address', () => {
        const problems = problemsOf({ ...ok, name: '', phoneNumber: 'abc', address: ' ' })
        expect(Object.keys(problems).sort()).toEqual(['address', 'name', 'phoneNumber'])
    })
    it('checks the website and Instagram only when they are filled', () => {
        expect(problemsOf({ ...ok, website: 'www.ht.in', insta: '@ht.trails' })).toEqual({})
        expect(problemsOf({ ...ok, website: 'not a link' }).website).toBeTruthy()
        expect(problemsOf({ ...ok, insta: 'two words' }).insta).toBeTruthy()
    })
})

describe('logoProblem', () => {
    it('takes images up to 2 MB', () => {
        expect(logoProblem(null)).toBe('')
        expect(logoProblem({ type: 'image/png', size: 100 })).toBe('')
        expect(logoProblem({ type: 'application/pdf', size: 100 })).toMatch(/image/)
        expect(logoProblem({ type: 'image/png', size: 5 * 1024 * 1024 })).toMatch(/2 MB/)
    })
})

describe('formDataOf', () => {
    it('sends every field, so an emptied website is cleared', () => {
        const data = formDataOf({ ...draftOf(company), website: '' })
        expect(data.get('website')).toBe('')
        expect(data.get('name')).toBe('Himalayan Trails')
    })
    it('adds the logo, or asks for it to be removed', () => {
        expect(
            formDataOf(draftOf(company), { logo: new File(['x'], 'l.png', { type: 'image/png' }) }).get('logo').name
        ).toBe('l.png')
        expect(formDataOf(draftOf(company), { removeLogo: true }).get('removeLogo')).toBe('true')
        expect(formDataOf(draftOf(company)).has('logo')).toBe(false)
    })
})
