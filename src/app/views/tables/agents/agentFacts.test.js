import { describe, expect, it } from 'vitest'
import { filtersFor } from './agentFacts'

describe('filtersFor', () => {
    it('builds a City and a State dropdown from the real values', () => {
        const [city, state] = filtersFor({ cities: ['Goa', 'Pune'], states: ['Maharashtra', ''] })
        expect(city).toMatchObject({
            key: 'city',
            options: [
                { value: 'Goa', label: 'Goa' },
                { value: 'Pune', label: 'Pune' }
            ]
        })
        expect(state.options).toEqual([{ value: 'Maharashtra', label: 'Maharashtra' }])
    })
    it('copes with nothing loaded yet', () => {
        expect(filtersFor().map(f => f.options)).toEqual([[], []])
    })
})
