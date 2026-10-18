import { describe, expect, test } from 'vitest'
import packageFormProblems from './packageFormFacts'

describe('package form rules', () => {
    test('a name and a trip make a package', () => {
        expect(packageFormProblems({ name: 'Shimla 3N', campaignId: '4' })).toEqual({})
    })

    test('both are asked for when empty', () => {
        expect(Object.keys(packageFormProblems({ name: '  ', campaignId: '' })).sort()).toEqual(['campaignId', 'name'])
    })

    test('a very short name is explained', () => {
        expect(packageFormProblems({ name: 'ab', campaignId: '4' }).name).toMatch(/3 characters/)
    })
})
