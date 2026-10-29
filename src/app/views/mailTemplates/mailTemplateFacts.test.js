import { describe, expect, test } from 'vitest'
import {
    FORBIDDEN_MESSAGE,
    changedKeys,
    changedSlots,
    customisedSummary,
    describeFailure,
    draftOf,
    fieldErrors,
    groupKinds,
    insertAtCursor,
    isUnsaved,
    lengthLabel,
    placeholderToken,
    slotProblem,
    slotProblems,
    slotsBody,
    updatedLine
} from './mailTemplateFacts'

const slot = (key, extra = {}) => ({
    key,
    label: key,
    help: '',
    multiline: false,
    optional: false,
    maxLength: 50,
    default: `default ${key}`,
    value: `default ${key}`,
    customised: false,
    ...extra
})

const receipt = {
    key: 'guest_receipt',
    label: 'Payment receipt to the guest',
    audience: 'guest',
    customised: true,
    updatedAt: '2026-10-27T10:00:00.000Z',
    updatedByName: 'Asha Verma',
    slots: [
        slot('subject'),
        slot('greeting', { default: 'Dear {guest_name},', value: 'Hello {guest_name},', customised: true }),
        slot('footer', { multiline: true, optional: true, default: '', value: '' })
    ],
    placeholders: [{ name: 'guest_name', description: 'The guest’s name', sample: 'Asha Verma' }]
}

describe('grouping the kinds', () => {
    const kinds = [
        { key: 'a', audience: 'staff' },
        { key: 'b', audience: 'guest' },
        { key: 'c', audience: 'supplier' },
        { key: 'd', audience: 'guest' }
    ]

    test('guests, then hotels and transporters, then the team, keeping the server’s order inside a group', () => {
        const groups = groupKinds(kinds)
        expect(groups.map(group => group.label)).toEqual(['Guests', 'Hotels & transporters', 'Our team'])
        expect(groups[0].kinds.map(kind => kind.key)).toEqual(['b', 'd'])
    })

    test('a group with nothing in it is left out', () => {
        expect(groupKinds([{ key: 'b', audience: 'guest' }]).map(group => group.audience)).toEqual(['guest'])
        expect(groupKinds([])).toEqual([])
        expect(groupKinds(undefined)).toEqual([])
    })

    test('an audience the screen does not know is shown under Other, not lost', () => {
        const groups = groupKinds([...kinds, { key: 'e', audience: 'agent' }])
        expect(groups.at(-1)).toMatchObject({ label: 'Other', kinds: [{ key: 'e' }] })
    })
})

describe('what changed on screen', () => {
    test('the fields start with what is used now: the agency’s own words or the default', () => {
        expect(draftOf(receipt)).toEqual({
            subject: 'default subject',
            greeting: 'Hello {guest_name},',
            footer: ''
        })
        expect(draftOf(null)).toEqual({})
    })

    test('nothing is changed until a text differs from what is saved', () => {
        expect(changedKeys(receipt, draftOf(receipt))).toEqual([])
        expect(isUnsaved(receipt, draftOf(receipt))).toBe(false)
        const draft = { ...draftOf(receipt), footer: 'Thank you', subject: 'New subject' }
        expect(changedKeys(receipt, draft)).toEqual(['subject', 'footer'])
        expect(isUnsaved(receipt, draft)).toBe(true)
    })

    test('a text typed and then typed back is not a change', () => {
        const draft = { ...draftOf(receipt), subject: 'x' }
        expect(isUnsaved(receipt, draft)).toBe(true)
        expect(isUnsaved(receipt, { ...draft, subject: 'default subject' })).toBe(false)
    })
})

describe('the body that is sent', () => {
    test('only the slots that differ from what is saved', () => {
        const draft = { ...draftOf(receipt), footer: 'Thank you for travelling with us' }
        expect(slotsBody(receipt, draft)).toEqual({ slots: { footer: 'Thank you for travelling with us' } })
    })

    test('a slot edited back to the default is sent as null, so it follows the default again', () => {
        const draft = { ...draftOf(receipt), greeting: 'Dear {guest_name},' }
        expect(changedSlots(receipt, draft)).toEqual({ greeting: null })
    })

    test('an optional slot cleared where the default has text is saved blank, not reset', () => {
        const kind = {
            ...receipt,
            slots: [slot('footer', { optional: true, default: 'Safe travels', value: 'Safe travels' })]
        }
        expect(changedSlots(kind, { footer: '' })).toEqual({ footer: '' })
    })

    test('a custom text cleared back to a blank default is null', () => {
        const kind = {
            ...receipt,
            slots: [slot('footer', { optional: true, default: '', value: 'Thanks', customised: true })]
        }
        expect(changedSlots(kind, { footer: '' })).toEqual({ footer: null })
    })

    test('nothing changed sends no slots', () => {
        expect(slotsBody(receipt, draftOf(receipt))).toEqual({ slots: {} })
    })
})

describe('putting a fill-in into the text', () => {
    test('goes in at the cursor', () => {
        expect(insertAtCursor('Dear ,', 5, 5, '{guest_name}')).toEqual({
            value: 'Dear {guest_name},',
            cursor: 17
        })
    })

    test('replaces what is selected', () => {
        expect(insertAtCursor('Dear NAME,', 5, 9, '{guest_name}').value).toBe('Dear {guest_name},')
    })

    test('goes to the end when no cursor is known, and a cursor outside the text is brought inside it', () => {
        expect(insertAtCursor('Hello ', null, null, '{x}')).toEqual({ value: 'Hello {x}', cursor: 9 })
        expect(insertAtCursor('Hi', 99, 120, '{x}').value).toBe('Hi{x}')
        expect(insertAtCursor('Hi', -4, -4, '{x}').value).toBe('{x}Hi')
        expect(insertAtCursor(undefined, 0, 0, '{x}').value).toBe('{x}')
    })

    test('the fill-in is the name in curly brackets', () => {
        expect(placeholderToken('guest_name')).toBe('{guest_name}')
    })
})

describe('how long a text is, and what is wrong with it', () => {
    test('the length is shown against the most allowed', () => {
        expect(lengthLabel('Hello', 200)).toBe('5 / 200')
        expect(lengthLabel('Hello', undefined)).toBe('5')
    })

    test('a text that must be there can’t be blank, one that is optional can', () => {
        expect(slotProblem(slot('subject'), '   ')).toBe('This can’t be blank.')
        expect(slotProblem(slot('footer', { optional: true }), '')).toBe('')
    })

    test('too long says by how much it may be', () => {
        expect(slotProblem(slot('subject', { maxLength: 5 }), 'abcdef')).toMatch(/6 characters.*5 is the most/)
        expect(slotProblem(slot('subject', { maxLength: 5 }), 'abcde')).toBe('')
    })

    test('only the texts that were changed are checked', () => {
        const kind = { ...receipt, slots: [slot('subject', { value: '' }), slot('greeting', { maxLength: 3 })] }
        // ? the saved subject is blank (it can't be, but it isn't this screen's doing): leaving it alone isn't a problem
        expect(slotProblems(kind, { subject: '', greeting: 'default greeting' })).toEqual({})
        expect(Object.keys(slotProblems(kind, { subject: '', greeting: 'long text here' }))).toEqual(['greeting'])
    })
})

describe('the server’s answer when something is wrong', () => {
    const body = errors => ({
        success: false,
        message: 'Some text can’t be used',
        data: { errors }
    })

    test('reads the per-slot messages from the envelope', () => {
        expect(fieldErrors({ status: 400, data: body({ greeting: '{guest} is not available here' }) })).toEqual({
            greeting: '{guest} is not available here'
        })
        expect(fieldErrors({ data: { errors: { subject: 'Too long' } } })).toEqual({ subject: 'Too long' })
    })

    test('copes with no messages, odd shapes and empty ones', () => {
        expect(fieldErrors(undefined)).toEqual({})
        expect(fieldErrors({ data: { message: 'x' } })).toEqual({})
        expect(fieldErrors({ data: { data: { errors: ['a'] } } })).toEqual({})
        expect(fieldErrors({ data: { data: { errors: { a: '', b: 'no' } } } })).toEqual({ b: 'no' })
    })

    test('403 is the screen not being theirs', () => {
        expect(describeFailure({ status: 403, data: { message: 'Forbidden' } }, 'x')).toEqual({
            type: 'forbidden',
            message: FORBIDDEN_MESSAGE,
            errors: {}
        })
        expect(FORBIDDEN_MESSAGE).toBe("Only the agency's admins and managers can change mail templates.")
    })

    test('409 says what the server said, and stops editing', () => {
        const failure = describeFailure({ status: 409, data: { message: 'Run the upgrade first' } }, 'x')
        expect(failure).toMatchObject({ type: 'notReady', message: 'Run the upgrade first' })
        expect(describeFailure({ status: 409 }, 'x').message).toMatch(/upgrade/i)
    })

    test('400 with slot messages is the fields', () => {
        const failure = describeFailure({ status: 400, data: body({ greeting: 'Too long' }) }, 'x')
        expect(failure).toMatchObject({ type: 'fields', errors: { greeting: 'Too long' } })
    })

    test('anything else says the server’s message, or the fallback', () => {
        expect(describeFailure({ status: 400, data: { message: 'Bad' } }, 'x')).toMatchObject({
            type: 'other',
            message: 'Bad'
        })
        expect(describeFailure({ status: 500 }, 'Couldn’t save')).toMatchObject({
            type: 'other',
            message: 'Couldn’t save'
        })
        expect(describeFailure(undefined, 'Couldn’t save').message).toBe('Couldn’t save')
    })
})

describe('what is said about a kind', () => {
    test('who changed it last, and when', () => {
        expect(updatedLine(receipt)).toBe('Last changed by Asha Verma on 27 Oct 2026')
    })

    test('a kind never changed says nothing; a missing name or date is left out', () => {
        expect(updatedLine({ customised: false, updatedAt: null, updatedByName: null })).toBe('')
        expect(updatedLine({ customised: true, updatedAt: null, updatedByName: 'Asha' })).toBe('Last changed by Asha')
        expect(updatedLine({ customised: true, updatedAt: '2026-10-27T10:00:00.000Z' })).toBe(
            'Last changed on 27 Oct 2026'
        )
        expect(updatedLine({ customised: true, updatedAt: 'not a date' })).toBe('')
    })

    test('how many texts are the agency’s own', () => {
        expect(customisedSummary(receipt)).toBe('1 of 3 texts changed')
        expect(customisedSummary({ slots: [slot('subject')] })).toBe('Using the default text')
    })
})
