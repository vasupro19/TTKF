import { describe, expect, test } from 'vitest'
import {
    EMPTY_AGENT,
    INDIAN_STATES,
    agentFormProblems,
    agentPayload,
    agentToForm,
    stateOptions
} from './agentFormFacts'

describe('agent form rules', () => {
    test('only the name is required', () => {
        expect(agentFormProblems(EMPTY_AGENT)).toEqual({ name: 'Agent name is required' })
        expect(agentFormProblems({ ...EMPTY_AGENT, name: '  ' }).name).toBeTruthy()
        expect(agentFormProblems({ ...EMPTY_AGENT, name: 'Sharma Travels' })).toEqual({})
    })

    test('a phone or email is checked only when given', () => {
        const base = { ...EMPTY_AGENT, name: 'Sharma Travels' }
        expect(agentFormProblems({ ...base, phone: '98765 43210' })).toEqual({})
        expect(agentFormProblems({ ...base, phone: '+44 7911 123456' })).toEqual({})
        expect(agentFormProblems({ ...base, phone: '12' }).phone).toBeTruthy()
        expect(agentFormProblems({ ...base, phone: 'call me' }).phone).toBeTruthy()
        expect(agentFormProblems({ ...base, email: 'sharma@' }).email).toMatch(/valid email/)
        expect(agentFormProblems({ ...base, email: 'sharma@travels.in' })).toEqual({})
    })

    test('the payload is the seven fields, trimmed', () => {
        expect(agentPayload({ ...EMPTY_AGENT, name: ' Sharma ', city: ' Shimla ', id: 5, createdAt: 'x' })).toEqual({
            name: 'Sharma',
            phone: '',
            email: '',
            state: '',
            city: 'Shimla',
            address: '',
            remarks: ''
        })
    })

    test('a saved agent loads as text, with empty fields as ""', () => {
        expect(agentToForm({ id: 3, name: 'Sharma', phone: 9812345678, city: null, state: 'HP' })).toEqual({
            ...EMPTY_AGENT,
            name: 'Sharma',
            phone: '9812345678',
            state: 'HP'
        })
    })

    test('a state saved some other way still shows in the dropdown', () => {
        expect(stateOptions('HP')).toBe(INDIAN_STATES)
        expect(stateOptions('')).toBe(INDIAN_STATES)
        expect(stateOptions('Himachal').at(-1)).toEqual({ value: 'Himachal', label: 'Himachal' })
    })
})
