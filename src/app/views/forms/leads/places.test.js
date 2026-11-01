import { describe, expect, test } from 'vitest'
import { cleanPlaces, placeOptions, placesSentence, placesText, samePlaces } from './places'

describe('the places a guest wants', () => {
    test('kept as the server keeps them: trimmed, each once, whole nights from 1 to 30 or none, empty rows dropped', () => {
        expect(
            cleanPlaces([
                { name: ' Shimla ', nights: '2' },
                { name: 'shimla', nights: 4 },
                { name: 'Manali', nights: '' },
                { name: 'Kasol', nights: 0 },
                { name: '', nights: 3 }
            ])
        ).toEqual([
            { name: 'Shimla', nights: 2 },
            { name: 'Manali', nights: null },
            { name: 'Kasol', nights: null }
        ])
        expect(cleanPlaces(undefined)).toEqual([])
    })

    test('read as "Shimla 2N, Manali" on the list, and "Shimla 2 nights, Manali 1 night" for the AI', () => {
        const places = [
            { name: 'Shimla', nights: 2 },
            { name: 'Manali', nights: null }
        ]
        expect(placesText(places)).toBe('Shimla 2N, Manali')
        expect(
            placesSentence([
                { name: 'Shimla', nights: 2 },
                { name: 'Manali', nights: 1 }
            ])
        ).toBe('Shimla 2 nights, Manali 1 night')
        expect(placesText([])).toBe('')
    })

    test('the same places in the same order, typed differently, are the same', () => {
        expect(samePlaces([{ name: 'Shimla ', nights: '2' }, { name: '' }], [{ name: 'Shimla', nights: 2 }])).toBe(true)
        expect(samePlaces([{ name: 'Shimla' }, { name: 'Manali' }], [{ name: 'Manali' }, { name: 'Shimla' }])).toBe(
            false
        )
    })

    test('suggestions: the trip’s places first, then the agency’s others, each once', () => {
        const saved = [
            { name: 'Gulmarg', campaignId: 2 },
            { name: 'Shimla', campaignId: 1 },
            { name: 'Manali', campaignId: 1 },
            { name: 'shimla', campaignId: 2 },
            { name: 'Agra', campaignId: 3 }
        ]
        expect(placeOptions(saved, '1')).toEqual([
            { name: 'Manali', group: 'This trip' },
            { name: 'Shimla', group: 'This trip' },
            { name: 'Agra', group: 'Other places' },
            { name: 'Gulmarg', group: 'Other places' }
        ])
        expect(placeOptions(undefined, 1)).toEqual([])
    })
})
