import { describe, expect, test } from 'vitest'
import itenaryFormProblems from './itenaryFormFacts'

const filled = { title: 'Delhi to Shimla via Cab', description: '', campaignId: '2' }

describe('itinerary form rules', () => {
    test('a title and a trip are enough', () => {
        expect(itenaryFormProblems(filled)).toEqual({})
    })

    test('title and trip are asked for when empty', () => {
        expect(Object.keys(itenaryFormProblems({ title: ' ', description: '', campaignId: '' })).sort()).toEqual([
            'campaignId',
            'title'
        ])
    })

    test('a short title is explained', () => {
        expect(itenaryFormProblems({ ...filled, title: 'Day' }).title).toMatch(/5 characters/)
    })

    test('a description is optional, but a one-word one is not accepted', () => {
        expect(itenaryFormProblems({ ...filled, description: '   ' })).toEqual({})
        expect(itenaryFormProblems({ ...filled, description: 'Arrive' }).description).toMatch(/10 characters/)
        expect(itenaryFormProblems({ ...filled, description: 'Arrive and transfer to the hotel.' })).toEqual({})
    })
})
